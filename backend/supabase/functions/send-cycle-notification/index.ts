type NotificationChannel = "email" | "sms";

type NotificationEvent = {
  id: string;
  user_id: string;
  partner_id: string;
  channel: NotificationChannel;
  phase: string;
  message_preview: string;
  partners: {
    display_name: string;
    email: string | null;
    phone: string | null;
    sharing_consent: boolean;
  };
};

const FREE_SEND_LIMIT = 3;
const COUPLE_PLUS_SEND_LIMIT = 30;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const authorization = request.headers.get("authorization") ?? "";

  if (!supabaseUrl || !serviceRoleKey) {
    return json({ error: "Supabase server environment is missing" }, 500);
  }

  const user = await getAuthenticatedUser(supabaseUrl, serviceRoleKey, authorization);
  if (!user) {
    return json({ error: "Unauthorized" }, 401);
  }

  const body = await request.json().catch(() => ({}));
  const eventIds = Array.isArray(body.eventIds) ? body.eventIds.filter(Boolean) : [];
  if (eventIds.length === 0) {
    return json({ error: "eventIds is required" }, 400);
  }

  const events = await getNotificationEvents(supabaseUrl, serviceRoleKey, user.id, eventIds);
  if (events.length === 0) {
    return json({ error: "No notification events found" }, 404);
  }

  const results = [];
  for (const event of events) {
    if (!event.partners.sharing_consent) {
      await markNotification(supabaseUrl, serviceRoleKey, event.id, "failed");
      results.push({ id: event.id, channel: event.channel, ok: false, reason: "missing consent" });
      continue;
    }

    const quota = await getQuotaState(supabaseUrl, serviceRoleKey, event.user_id);
    if (quota.sendCount >= quota.sendLimit) {
      await markNotification(supabaseUrl, serviceRoleKey, event.id, "failed");
      results.push({
        id: event.id,
        channel: event.channel,
        ok: false,
        reason: "quota exceeded",
        sendCount: quota.sendCount,
        sendLimit: quota.sendLimit,
      });
      continue;
    }

    const result = event.channel === "email" ? await sendEmail(event) : await sendSms(event);
    await markNotification(supabaseUrl, serviceRoleKey, event.id, result.ok ? "sent" : "failed");
    if (result.ok) {
      await setMonthlySendCount(supabaseUrl, serviceRoleKey, event.user_id, quota.sendCount + 1);
    }
    results.push({ id: event.id, channel: event.channel, ...result });
  }

  return json({ results });
});

async function getAuthenticatedUser(supabaseUrl: string, serviceRoleKey: string, authorization: string) {
  if (!authorization.toLowerCase().startsWith("bearer ")) return null;

  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      apikey: serviceRoleKey,
      authorization,
    },
  });

  if (!response.ok) return null;
  return response.json();
}

async function getNotificationEvents(
  supabaseUrl: string,
  serviceRoleKey: string,
  userId: string,
  eventIds: string[],
): Promise<NotificationEvent[]> {
  const params = new URLSearchParams({
    select: "id,user_id,partner_id,channel,phase,message_preview,partners(display_name,email,phone,sharing_consent)",
    user_id: `eq.${userId}`,
    id: `in.(${eventIds.join(",")})`,
    status: "eq.draft",
  });

  const response = await fetch(`${supabaseUrl}/rest/v1/notification_events?${params}`, {
    headers: {
      apikey: serviceRoleKey,
      authorization: `Bearer ${serviceRoleKey}`,
    },
  });

  if (!response.ok) return [];
  return response.json();
}

async function getQuotaState(supabaseUrl: string, serviceRoleKey: string, userId: string) {
  const monthKey = getMonthKey();
  const [subscriptionResponse, quotaResponse] = await Promise.all([
    fetch(`${supabaseUrl}/rest/v1/subscriptions?user_id=eq.${userId}&select=tier,active_until`, {
      headers: serviceHeaders(serviceRoleKey),
    }),
    fetch(
      `${supabaseUrl}/rest/v1/monthly_send_quotas?user_id=eq.${userId}&month_key=eq.${monthKey}&select=send_count`,
      { headers: serviceHeaders(serviceRoleKey) },
    ),
  ]);

  const subscriptions = subscriptionResponse.ok ? await subscriptionResponse.json() : [];
  const quotas = quotaResponse.ok ? await quotaResponse.json() : [];
  const subscription = subscriptions[0];
  const hasCouplePlus =
    subscription?.tier === "couple_plus" &&
    (!subscription.active_until || new Date(subscription.active_until).getTime() > Date.now());

  return {
    monthKey,
    sendCount: Number(quotas[0]?.send_count ?? 0),
    sendLimit: hasCouplePlus ? COUPLE_PLUS_SEND_LIMIT : FREE_SEND_LIMIT,
  };
}

async function setMonthlySendCount(
  supabaseUrl: string,
  serviceRoleKey: string,
  userId: string,
  sendCount: number,
) {
  await fetch(`${supabaseUrl}/rest/v1/monthly_send_quotas?on_conflict=user_id,month_key`, {
    method: "POST",
    headers: {
      ...serviceHeaders(serviceRoleKey),
      "content-type": "application/json",
      Prefer: "resolution=merge-duplicates,return=minimal",
    },
    body: JSON.stringify({
      user_id: userId,
      month_key: getMonthKey(),
      send_count: sendCount,
      updated_at: new Date().toISOString(),
    }),
  });
}

async function sendEmail(event: NotificationEvent) {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("RESEND_FROM_EMAIL");
  const to = event.partners.email;

  if (!apiKey || !from) return { ok: false, reason: "email provider is not configured" };
  if (!to) return { ok: false, reason: "recipient email is missing" };

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject: "Un repere CycleCare a ete partage avec toi",
      text: event.message_preview,
    }),
  });

  if (!response.ok) return { ok: false, reason: await response.text() };
  return { ok: true };
}

function serviceHeaders(serviceRoleKey: string) {
  return {
    apikey: serviceRoleKey,
    authorization: `Bearer ${serviceRoleKey}`,
  };
}

function getMonthKey() {
  return new Date().toISOString().slice(0, 7);
}

async function sendSms(event: NotificationEvent) {
  const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
  const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
  const from = Deno.env.get("TWILIO_FROM_PHONE");
  const to = event.partners.phone;

  if (!accountSid || !authToken || !from) return { ok: false, reason: "sms provider is not configured" };
  if (!to) return { ok: false, reason: "recipient phone is missing" };

  const credentials = btoa(`${accountSid}:${authToken}`);
  const body = new URLSearchParams({
    From: from,
    To: to,
    Body: event.message_preview,
  });

  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method: "POST",
    headers: {
      authorization: `Basic ${credentials}`,
      "content-type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!response.ok) return { ok: false, reason: await response.text() };
  return { ok: true };
}

async function markNotification(
  supabaseUrl: string,
  serviceRoleKey: string,
  eventId: string,
  status: "sent" | "failed",
) {
  await fetch(`${supabaseUrl}/rest/v1/notification_events?id=eq.${eventId}`, {
    method: "PATCH",
    headers: {
      apikey: serviceRoleKey,
      authorization: `Bearer ${serviceRoleKey}`,
      "content-type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      status,
      sent_at: status === "sent" ? new Date().toISOString() : null,
    }),
  });
}

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders,
      "content-type": "application/json",
    },
  });
}
