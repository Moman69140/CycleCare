# CycleCare - Plan TestFlight et StoreKit

## Objectif

Passer du test Expo Go a un vrai build iOS installe via TestFlight, puis preparer Couple+ avec achat integre Apple.

## 1. Comptes necessaires

- Apple Developer Program actif.
- Acces App Store Connect.
- Compte Expo/EAS.
- Projet Supabase deja actif.

## 2. Identifiants iOS

- Nom app: CycleCare.
- Bundle identifier provisoire: `com.cyclecare.app`.
- Scheme deep link: `cyclecare://auth/callback`.
- Privacy URL: `https://cyclecare-fr.netlify.app/privacy`.
- Terms URL: `https://cyclecare-fr.netlify.app/terms`.

## 3. Build TestFlight

Depuis `mobile/`:

```bash
npm install -g eas-cli
eas login
eas init
eas build --platform ios --profile preview
```

Quand le build interne est stable:

```bash
eas build --platform ios --profile production
eas submit --platform ios --profile production
```

## 4. Couple+ StoreKit

Creer un abonnement ou achat integre dans App Store Connect:

- Nom public: Couple+.
- Benefice: partager des reperes pendant tout le cycle.
- Gratuit: 3 envois mensuels.
- Couple+: 30 envois mensuels.

Regle de securite:

- L'app ne doit pas activer Couple+ seule.
- Le backend doit verifier le recu Apple ou les App Store Server Notifications.
- Supabase met ensuite a jour `subscriptions.tier = 'couple_plus'`.

## 5. Notes App Review

CycleCare ne fournit pas de diagnostic medical. Les phases sont indicatives. Les donnees de cycle sont partagees uniquement apres consentement explicite et peuvent etre desactivees ou supprimees dans l'app.

Compte demo a preparer avant soumission:

- e-mail de test;
- mot de passe de test;
- cycle deja renseigne;
- destinataire fictif avec e-mail de test.
