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
- vérifier le quota mensuel gratuit ou Couple+;
- envoyer via Resend et/ou Twilio;
- marquer l’événement `sent` ou `failed`;
- incrémenter le compteur mensuel après chaque envoi réussi;
- retourner le statut.

Variables nécessaires:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_FROM_PHONE`

App mobile:

- `Preparer le message` cree les brouillons et la preuve de consentement.
- `Envoyer maintenant` appelle cette fonction avec les `eventIds`.
- Si les secrets Resend/Twilio ne sont pas encore configures, l'app garde le brouillon et affiche un message de configuration.

Quotas actuels:

- Gratuit: 3 envois mensuels.
- Couple+: 30 envois mensuels.

À ajouter ensuite:

- générer un token de réponse si réponse autorisée;

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
