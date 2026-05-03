# Supabase Edge Functions prévues

## send-cycle-notification

Fichier:

```text
backend/supabase/functions/send-cycle-notification/index.ts
```

Entrée:

```json
{
  "eventIds": ["uuid-notification-event-id"]
}
```

Responsabilités:

- vérifier l’utilisateur connecté;
- vérifier le consentement du destinataire;
- envoyer via Resend et/ou Twilio;
- marquer l’événement `sent` ou `failed`;
- retourner le statut.

Variables nécessaires:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_FROM_PHONE`

À ajouter ensuite:

- vérifier le quota gratuit ou Couple+;
- générer un token de réponse si réponse autorisée;
- incrémenter le quota mensuel;

## inbound-partner-reply

Responsabilités:

- recevoir webhook Twilio/Mailgun;
- retrouver l’événement avec token;
- refuser si réponse déjà utilisée;
- limiter à 180 caractères;
- enregistrer `partner_replies`;
- marquer `reply_used = true`;
- notifier la femme dans l’app.

## apple-subscription-webhook

Responsabilités:

- recevoir les notifications Apple App Store Server Notifications;
- vérifier la signature Apple;
- mettre à jour `subscriptions`;
- ne jamais accepter un état Couple+ uniquement depuis le client.
