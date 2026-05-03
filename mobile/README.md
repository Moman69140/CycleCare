# CycleCare Mobile

Base Expo / React Native pour la future app iOS CycleCare.

## Installation

Use Node 20 LTS for Expo:

```bash
node --version
```

If Node is newer than 22, switch to Node 20 before starting Expo.

```bash
npm install
```

## Lancer l’app

```bash
npm run ios
```

ou:

```bash
npm run start
```

Si Expo reste bloqué après `Starting project at ...`, utilise le script Node 20:

```bash
npm run start:node20
```

Pour ouvrir sur iPhone avec Expo Go, utilise plutôt:

```bash
npm run start:tunnel
```

## Configuration

Créer un projet Supabase, puis renseigner dans `app.json` ou via variables d’environnement Expo:

- `supabaseUrl`
- `supabaseAnonKey`

Dans Supabase, configure aussi les URL d’authentification:

- Authentication > URL Configuration > Site URL: `https://cyclecare-fr.netlify.app`
- Redirect URLs: ajoute l’URL Expo affichée dans le terminal avec `/--/auth/callback`, par exemple `exp://192.168.1.13:8081/--/auth/callback`
- Pour la future app installée: ajoute `cyclecare://auth/callback`

## Notes MVP

- L’app mobile reprend le positionnement premium du prototype web.
- Les données de cycle restent indicatives.
- Le partage vers partenaire doit passer par le backend.
- Couple+ doit être validé côté serveur après achat StoreKit.
