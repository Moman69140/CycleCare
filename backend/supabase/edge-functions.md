# Supabase Edge Functions prévues

## send-cycle-notification

Entrée:

```json
{
  "partnerId": "uuid",
  "channels": ["email", "sms"],
  "phase": "luteal",
  "messagePreview": "texte confirme par la femme",
  "allowReply": true
}
```

Responsabilités:

- vérifier l’utilisateur connecté;
- vérifier le consentement du partenaire;
- vérifier le quota gratuit ou Couple+;
- créer un événement d’envoi;
- envoyer via Twilio et/ou SendGrid;
- générer un token de réponse si réponse autorisée;
- incrémenter le quota mensuel;
- retourner le statut.

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
