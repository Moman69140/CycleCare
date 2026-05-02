# CycleCare - Checklist App Store

Cette checklist prépare le prototype à une future soumission Apple App Store. Elle ne remplace pas une revue juridique, médicale ou sécurité.

## Points déjà intégrés dans le prototype

- Consentement explicite avant partage des données de cycle.
- Confirmation obligatoire avant chaque envoi simulé au contact.
- Avertissement visible: l’app informe et ne pose pas de diagnostic médical.
- Minimisation des données demandées.
- Section confidentialité accessible depuis l’app.
- Export et suppression locale des données.
- Aucune publicité, aucun tracking, aucune réutilisation marketing des données de santé.
- Option Couple+ cadrée comme fonctionnalité payante via achat intégré Apple, avec davantage d’envois côté femme et contrôle complet du partage.

## À faire avant soumission réelle

- Valider le périmètre MVP dans `MVP_LAUNCH_PLAN.md`.
- Créer une app native iOS ou wrapper conforme avec APIs publiques Apple.
- Ajouter une vraie politique de confidentialité hébergée publiquement et renseignée dans App Store Connect.
- URL actuelle de politique de confidentialité: https://cyclecare-fr.netlify.app/privacy
- Remplir les Privacy Nutrition Labels: santé, contact partenaire, identifiants éventuels, diagnostics si utilisés.
- Chiffrer les données sensibles au repos et en transit.
- Ne pas stocker d’informations de santé personnelles dans iCloud sauf conformité explicite.
- Mettre en place suppression de compte/données côté serveur si un backend existe.
- Brancher SMS/e-mail via un service conforme, avec logs minimisés et consentement révocable.
- Implémenter Couple+ avec StoreKit, pas avec un paiement externe dans l’app iOS.
- Décrire clairement la limite gratuite et les bénéfices Couple+ avant l’achat intégré.
- Garder la réponse partenaire optionnelle, limitée à un message court par notification, avec blocage, signalement et désactivation immédiate.
- Documenter dans la politique de confidentialité les réponses entrantes, leur durée de conservation et leur suppression.
- Préparer un compte de démo ou un mode démo complet pour App Review.
- Faire tester sur appareils iOS réels avant soumission.

## Références Apple utiles

- App Review Guidelines: https://developer.apple.com/app-store/review/guidelines/
- App Privacy Details: https://developer.apple.com/app-store/app-privacy-details/
