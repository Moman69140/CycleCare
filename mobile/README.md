# CycleCare Mobile

Base Expo / React Native pour la future app iOS CycleCare.

## Installation

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

## Configuration

Créer un projet Supabase, puis renseigner dans `app.json` ou via variables d’environnement Expo:

- `supabaseUrl`
- `supabaseAnonKey`

## Notes MVP

- L’app mobile reprend le positionnement premium du prototype web.
- Les données de cycle restent indicatives.
- Le partage vers partenaire doit passer par le backend.
- Couple+ doit être validé côté serveur après achat StoreKit.
