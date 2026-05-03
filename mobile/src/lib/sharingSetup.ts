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
  const hasFailure = results.some((result: { ok?: boolean }) => !result.ok);

  if (hasFailure) {
    return {
      ok: false,
      message: "Le message est prepare, mais un canal d'envoi n'est pas encore configure.",
    };
  }

  return { ok: true, message: "Message envoye au destinataire." };
}
