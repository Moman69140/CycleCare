# CycleCare - Étape 2 Architecture technique

Objectif: transformer le prototype local en vraie application mobile installable, avec backend sécurisé, paiements Apple, SMS/e-mail et conformité dès le départ.

## Stack retenue

### App mobile

- React Native avec Expo.
- TypeScript.
- iOS en priorité.
- Android possible plus tard avec la même base.

Pourquoi:

- développement rapide;
- bon rendu mobile;
- publication iOS possible;
- compatible StoreKit via modules natifs;
- possibilité d’itérer vite avant une version Swift native si nécessaire.

### Backend

- Supabase recommandé pour le MVP.
- Authentification e-mail.
- PostgreSQL.
- Row Level Security.
- Edge Functions pour les envois SMS/e-mail et webhooks.

Pourquoi:

- base SQL claire;
- règles d’accès fortes;
- temps de développement court;
- export/suppression des données plus maîtrisable.

### Notifications externes

- SMS: Twilio.
- E-mail: SendGrid ou Mailgun.
- Réponses entrantes: webhook Twilio/Mailgun.

### Paiement

- iOS: StoreKit / achat intégré Apple.
- Pas de paiement externe dans l’app iOS.
- Le backend stocke seulement l’état d’abonnement vérifié.

## Structure projet

```text
mobile/
  App.tsx
  app.json
  package.json
  tsconfig.json
  src/
    config/
    lib/
    screens/
backend/
  supabase/
    schema.sql
    edge-functions.md
```

## Données sensibles

Données considérées sensibles:

- date des dernières règles;
- durée du cycle;
- durée des règles;
- besoins personnels;
- phase estimée;
- identité/contact du destinataire;
- historique des envois;
- réponses du partenaire.

Principes:

- stocker le minimum;
- chiffrer en transit;
- limiter l’accès par propriétaire;
- permettre export et suppression;
- ne jamais utiliser ces données pour publicité ou revente.

## Modèle gratuit et Couple+

Plan gratuit:

- 2 envois de cycle par mois.

Couple+:

- envois étendus;
- vendu via StoreKit;
- réponse partenaire optionnelle;
- 1 réponse courte par notification;
- désactivation immédiate par la femme.

## Flux d’envoi

1. La femme configure son cycle.
2. Elle ajoute un destinataire.
3. L’app génère un message indicatif.
4. Elle voit l’aperçu.
5. Elle confirme l’envoi.
6. Le backend vérifie:
   - consentement;
   - quota gratuit ou Couple+ actif;
   - canal autorisé;
   - destinataire valide.
7. Le backend envoie via Twilio et/ou SendGrid.
8. L’événement est journalisé.
9. Si Couple+ et réponse autorisée, une réponse courte peut être acceptée une fois.

## Sécurité MVP

- Auth obligatoire pour toute donnée personnelle.
- Row Level Security sur toutes les tables utilisateur.
- Service role seulement côté Edge Functions.
- Logs minimisés.
- Pas de données de santé dans les analytics.
- Suppression complète liée à l’utilisateur.

## Prochaine étape de développement

1. Installer les dépendances Expo.
2. Créer le projet Supabase.
3. Appliquer `backend/supabase/schema.sql`.
4. Brancher l’authentification.
5. Porter les écrans du prototype dans `mobile/`.
6. Brancher le calcul de cycle depuis `mobile/src/lib/cycle.ts`.
7. Ajouter l’envoi simulé backend.
8. Remplacer le simulé par Twilio/SendGrid.
9. Ajouter StoreKit pour Couple+.
10. Tester sur TestFlight.
