import { isSupabaseConfigured, supabase } from "./supabase";

export type SharingSetupInput = {
  userId: string;
  partnerName: string;
  partnerEmail: string;
  partnerPhone: string;
  emailEnabled: boolean;
  smsEnabled: boolean;
  consentAccepted: boolean;
  phase: string;
  messagePreview: string;
};

export type SharingSetupResult = {
  ok: boolean;
  message: string;
  eventIds?: string[];
};

export type PartnerSummary = {
  id: string;
  displayName: string;
  email: string | null;
  phone: string | null;
  emailEnabled: boolean;
  smsEnabled: boolean;
  sharingConsent: boolean;
  createdAt: string;
};

export type NotificationSummary = {
  id: string;
  partnerId: string;
  partnerName: string;
  channel: "email" | "sms";
  status: "draft" | "sent" | "failed";
  messagePreview: string;
  createdAt: string;
  sentAt: string | null;
};

export type SharingOverview = {
  partners: PartnerSummary[];
  notifications: NotificationSummary[];
};

export async function saveSharingSetup(input: SharingSetupInput): Promise<SharingSetupResult> {
  if (!isSupabaseConfigured) {
    return { ok: false, message: "Supabase n'est pas encore configure dans l'app mobile." };
  }

  const partnerName = input.partnerName.trim();
  const partnerEmail = input.partnerEmail.trim().toLowerCase();
  const partnerPhone = input.partnerPhone.trim();

  if (!input.consentAccepted) {
    return { ok: false, message: "Confirme ton accord avant de preparer un partage." };
  }

  if (!partnerName) {
    return { ok: false, message: "Ajoute le prenom du destinataire." };
  }

  if (!input.emailEnabled && !input.smsEnabled) {
    return { ok: false, message: "Choisis au moins un canal : e-mail ou SMS." };
  }

  if (input.emailEnabled && !partnerEmail) {
    return { ok: false, message: "Ajoute une adresse e-mail pour l'envoi par e-mail." };
  }

  if (input.emailEnabled && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(partnerEmail)) {
    return { ok: false, message: "L'adresse e-mail du destinataire n'est pas valide." };
  }

  if (input.smsEnabled && !partnerPhone) {
    return { ok: false, message: "Ajoute un numero de telephone pour l'envoi par SMS." };
  }

  const client = supabase as any;
  const { data: partner, error: partnerError } = await client
    .from("partners")
    .insert({
      user_id: input.userId,
      display_name: partnerName,
      email: partnerEmail || null,
      phone: partnerPhone || null,
      email_enabled: input.emailEnabled,
      sms_enabled: input.smsEnabled,
      sharing_consent: input.consentAccepted,
    })
    .select("id")
    .single();

  if (partnerError) {
    return { ok: false, message: partnerError.message };
  }

  const channels = [
    ...(input.emailEnabled ? ["email"] : []),
    ...(input.smsEnabled ? ["sms"] : []),
  ];

  const { data: notificationEvents, error: notificationError } = await client
    .from("notification_events")
    .insert(
      channels.map((channel) => ({
        user_id: input.userId,
        partner_id: partner.id,
        channel,
        status: "draft",
        phase: input.phase,
        message_preview: input.messagePreview,
      })),
    )
    .select("id");

  if (notificationError) {
    return { ok: false, message: notificationError.message };
  }

  const { error: consentError } = await client.from("consent_events").insert({
    user_id: input.userId,
    partner_id: partner.id,
    event_type: "sharing_setup_created",
    details: {
      email_enabled: input.emailEnabled,
      sms_enabled: input.smsEnabled,
      message_preview: input.messagePreview,
    },
  });

  if (consentError) {
    return { ok: false, message: consentError.message };
  }

  return {
    ok: true,
    message: "Message prepare. Verifie l'apercu, puis confirme l'envoi.",
    eventIds: notificationEvents?.map((event: { id: string }) => event.id) ?? [],
  };
}

export async function sendPreparedNotifications(eventIds: string[]): Promise<SharingSetupResult> {
  if (!isSupabaseConfigured) {
    return { ok: false, message: "Supabase n'est pas encore configure dans l'app mobile." };
  }

  if (eventIds.length === 0) {
    return { ok: false, message: "Prepare d'abord un message avant de l'envoyer." };
  }

  const client = supabase as any;
  const { data, error } = await client.functions.invoke("send-cycle-notification", {
    body: { eventIds },
  });

  if (error) {
    return {
      ok: false,
      message: "L'envoi n'est pas encore actif. Il faut deployer la fonction Supabase et configurer e-mail/SMS.",
    };
  }

  const results = Array.isArray(data?.results) ? data.results : [];
  const quotaExceeded = results.some((result: { reason?: string }) => result.reason === "quota exceeded");
  if (quotaExceeded) {
    return {
      ok: false,
      message: "Quota gratuit atteint. Couple+ permettra de partager plus de reperes pendant le cycle.",
    };
  }

  const hasFailure = results.some((result: { ok?: boolean }) => !result.ok);

  if (hasFailure) {
    return {
      ok: false,
      message: "Le message est prepare, mais un canal d'envoi n'est pas encore configure.",
    };
  }

  return { ok: true, message: "Message envoye au destinataire." };
}

export async function loadSharingOverview(userId: string): Promise<SharingOverview> {
  if (!isSupabaseConfigured) {
    return { partners: [], notifications: [] };
  }

  const client = supabase as any;
  const [{ data: partners }, { data: notifications }] = await Promise.all([
    client
      .from("partners")
      .select("id, display_name, email, phone, email_enabled, sms_enabled, sharing_consent, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    client
      .from("notification_events")
      .select("id, partner_id, channel, status, message_preview, created_at, sent_at, partners(display_name)")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  return {
    partners: (partners ?? []).map((partner: any) => ({
      id: partner.id,
      displayName: partner.display_name,
      email: partner.email,
      phone: partner.phone,
      emailEnabled: partner.email_enabled,
      smsEnabled: partner.sms_enabled,
      sharingConsent: partner.sharing_consent,
      createdAt: partner.created_at,
    })),
    notifications: (notifications ?? []).map((event: any) => ({
      id: event.id,
      partnerId: event.partner_id,
      partnerName: event.partners?.display_name ?? "Destinataire",
      channel: event.channel,
      status: event.status,
      messagePreview: event.message_preview,
      createdAt: event.created_at,
      sentAt: event.sent_at,
    })),
  };
}

export async function disablePartnerSharing(partnerId: string): Promise<SharingSetupResult> {
  if (!isSupabaseConfigured) {
    return { ok: false, message: "Supabase n'est pas encore configure dans l'app mobile." };
  }

  const client = supabase as any;
  const { data: partner } = await client.from("partners").select("user_id").eq("id", partnerId).maybeSingle();
  const { error } = await client
    .from("partners")
    .update({
      email_enabled: false,
      sms_enabled: false,
      sharing_consent: false,
    })
    .eq("id", partnerId);

  if (error) {
    return { ok: false, message: error.message };
  }

  if (partner?.user_id) {
    await client.from("consent_events").insert({
      user_id: partner.user_id,
      partner_id: partnerId,
      event_type: "sharing_disabled",
      details: {},
    });
  }

  return { ok: true, message: "Partage desactive pour ce destinataire." };
}

export async function deletePartner(partnerId: string): Promise<SharingSetupResult> {
  if (!isSupabaseConfigured) {
    return { ok: false, message: "Supabase n'est pas encore configure dans l'app mobile." };
  }

  const client = supabase as any;
  const { data: partner } = await client.from("partners").select("user_id").eq("id", partnerId).maybeSingle();
  if (partner?.user_id) {
    await client.from("consent_events").insert({
      user_id: partner.user_id,
      partner_id: partnerId,
      event_type: "partner_deleted",
      details: {},
    });
  }

  const { error } = await client.from("partners").delete().eq("id", partnerId);

  if (error) {
    return { ok: false, message: error.message };
  }

  return { ok: true, message: "Destinataire supprime." };
}
