# CycleCare - Étape 1 MVP de lancement

Objectif: définir clairement la première version lançable de CycleCare avant de passer au développement technique complet.

## Positionnement

CycleCare est une app mobile bien-être pour les femmes qui souhaitent mieux suivre leur cycle et partager volontairement des repères simples avec leur partenaire.

Promesse principale:

- Comprendre son cycle.
- Garder le contrôle de ses données.
- Aider son homme à mieux accompagner, sans intrusion.

CycleCare ne doit jamais se présenter comme un outil médical ou de diagnostic.

## Utilisatrice principale

La femme est l’utilisatrice principale.

Elle doit pouvoir:

- créer son espace;
- entrer les informations de son cycle;
- voir sa phase actuelle estimée;
- recevoir des conseils adaptés;
- choisir si elle partage ou non une information;
- choisir le destinataire;
- supprimer ou exporter ses données;
- activer Couple+ si elle veut envoyer davantage d’informations au fil du cycle.

## Destinataire

Le destinataire est secondaire.

Il peut:

- recevoir un message e-mail ou SMS si la femme l’autorise;
- recevoir des conseils simples pour mieux accompagner;
- répondre une seule fois par notification si la femme active cette option.

Il ne peut pas:

- consulter librement le cycle;
- demander des informations sans consentement;
- envoyer des messages illimités;
- modifier les données de la femme.

## Fonctionnalités MVP

### Compte et accès

- Inscription avec e-mail.
- Connexion sécurisée.
- Mot de passe oublié.
- Suppression de compte.

Pour la première version, Apple Sign In est recommandé si d’autres connexions sociales sont ajoutées.

### Profil cycle

- Prénom.
- Premier jour des dernières règles.
- Durée moyenne du cycle.
- Durée moyenne des règles.
- Sensibilités ou besoins personnels.
- Calcul indicatif de la phase actuelle.

Phases MVP:

- Règles.
- Phase folliculaire.
- Ovulation estimée.
- Phase lutéale.

### Conseils

- Conseils courts par phase.
- Conseils orientés action concrète pour le partenaire.
- Ton bienveillant, non médical, non culpabilisant.

### Partage vers partenaire

- Ajout d’un destinataire.
- E-mail du destinataire.
- Téléphone du destinataire.
- Choix du canal: e-mail, SMS, ou les deux.
- Aperçu du message avant envoi.
- Confirmation obligatoire avant chaque envoi.
- Historique des envois.

### Plan gratuit

- 2 envois de cycle par mois.
- Accès au suivi personnel.
- Accès aux conseils dans l’app.
- Suppression/export des données.

### Couple+

Couple+ est le plan payant.

- Débloqué via achat intégré Apple sur iOS.
- Envois étendus pour partager les repères pendant tout le cycle.
- Réponse partenaire optionnelle.
- Réponse limitée à 1 message court par notification.
- Désactivation immédiate possible par la femme.

Le bénéfice vendu est principalement: partager plus souvent les repères du cycle.

### Confidentialité

- Consentement explicite avant partage.
- Export des données.
- Suppression du compte et des données.
- Politique de confidentialité publique.
- Données minimisées.
- Aucun tracking publicitaire.
- Aucune revente ou réutilisation marketing des données santé.

## Écrans MVP

- Accueil / onboarding.
- Création de compte.
- Connexion.
- Profil cycle.
- Vue cycle actuelle.
- Conseils du moment.
- Contact partenaire.
- Aperçu et envoi du message.
- Couple+ / paywall.
- Historique.
- Confidentialité.
- Paramètres.
- Suppression de compte.

## Règles App Store importantes

- Utiliser StoreKit pour Couple+.
- Ne pas proposer de paiement externe dans l’app iOS.
- Afficher une politique de confidentialité.
- Ne pas promettre de prédiction médicale.
- Prévoir un mode démo pour App Review.
- Permettre la suppression de compte.
- Décrire clairement les données collectées dans App Store Connect.

## Ce qui n’est pas dans le MVP

- Chat illimité.
- Réseau social.
- Partage à plusieurs destinataires.
- Analyse médicale avancée.
- Prédiction de fertilité présentée comme fiable.
- Publicité.
- Revente de données.
- Communauté publique.
- Notifications basées sur localisation.

## Choix technique recommandé pour l’étape 2

Option recommandée:

- React Native avec Expo pour iOS d’abord.
- Backend Supabase ou Firebase.
- SMS via Twilio.
- E-mail via SendGrid ou Mailgun.
- Paiement iOS via StoreKit.

Pourquoi:

- développement plus rapide;
- app installable sur iPhone;
- possibilité Android plus tard;
- backend suffisamment robuste pour le MVP;
- intégration SMS/e-mail possible.

## Critères de validation de l’étape 1

L’étape 1 est validée si:

- le périmètre MVP est figé;
- le modèle gratuit/Couple+ est accepté;
- les écrans MVP sont listés;
- les données sensibles sont identifiées;
- les règles App Store sont prises en compte;
- les fonctionnalités hors MVP sont mises de côté;
- l’étape 2 peut commencer sans ambiguïté.

## Décision actuelle

Le MVP retenu est:

- suivi du cycle;
- conseils par phase;
- partage volontaire vers un partenaire;
- 2 envois gratuits par mois;
- Couple+ pour envois étendus;
- réponse partenaire optionnelle et limitée;
- conformité confidentialité et App Store dès le départ.
