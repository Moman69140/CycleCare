# CycleCare - Plan de déploiement

## Rôle de chaque plateforme

### GitHub

GitHub est nécessaire.

Utilisation:

- sauvegarder le code;
- suivre les versions;
- brancher Netlify;
- brancher plus tard les builds Expo/EAS;
- préparer une collaboration avec développeur, designer ou juriste.

### Netlify

Netlify est utile, mais pas pour publier l’app iOS.

Utilisation recommandée:

- landing page publique;
- politique de confidentialité;
- conditions d’utilisation;
- page support;
- prototype web public si besoin.

Netlify sera important pour App Store Connect, car Apple demande une URL de politique de confidentialité.

### Supabase

Supabase sera le backend MVP.

Utilisation:

- inscription/connexion;
- stockage sécurisé des profils;
- cycles;
- partenaires;
- quotas gratuits;
- Couple+;
- historique;
- réponses partenaire;
- suppression/export des données.

### Expo / EAS

Expo/EAS sert à créer l’app installable.

Utilisation:

- lancer l’app sur iPhone;
- créer les builds iOS;
- envoyer vers TestFlight.

### Apple Developer / App Store Connect

Obligatoire pour la publication iOS.

Utilisation:

- achat intégré Couple+ avec StoreKit;
- TestFlight;
- fiche App Store;
- validation App Review.

## Ordre conseillé

1. Initialiser Git localement.
2. Pousser le code sur GitHub.
3. Connecter Netlify au repo GitHub.
4. Publier la landing page et les pages légales.
5. Créer le projet Supabase.
6. Appliquer `backend/supabase/schema.sql`.
7. Brancher les variables Supabase dans `mobile/`.
8. Lancer l’app Expo localement.
9. Construire les écrans auth/cycle/partage dans l’app mobile.
10. Configurer EAS et TestFlight.

## Variables à prévoir

### Netlify

Pas de variable nécessaire pour la landing statique actuelle.

### Mobile Expo

```text
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
```

### Supabase Edge Functions

```text
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_FROM_NUMBER=
SENDGRID_API_KEY=
SENDGRID_FROM_EMAIL=
APPLE_BUNDLE_ID=
APPLE_ISSUER_ID=
APPLE_KEY_ID=
APPLE_PRIVATE_KEY=
```

## Netlify

Le dossier racine peut être publié directement.

Build command:

```text
aucune
```

Publish directory:

```text
.
```

Pages publiques:

- `/index.html`
- `/privacy.html`
- `/terms.html`
