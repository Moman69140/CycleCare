# CycleCare - Supabase setup

## 1. Create the project

1. Go to https://supabase.com/dashboard
2. Create a new project.
3. Suggested project name: `cyclecare`.
4. Choose a strong database password and store it safely.
5. Choose the closest region to France/Europe.

## 2. Apply the schema

In Supabase:

1. Open **SQL Editor**.
2. Create a new query.
3. Paste the content of `backend/supabase/schema.sql`.
4. Run the query.

Expected result:

- public tables are created;
- Row Level Security is enabled;
- auth users automatically create `profiles` and `subscriptions`;
- free quota and Couple+ helper functions are available.

## 3. Configure Auth

In **Authentication > Providers**:

- Enable Email.
- For MVP testing, email confirmation can be disabled at first.
- Before public launch, re-enable email confirmation.

In **Authentication > URL Configuration**:

- Site URL: `https://cyclecare-fr.netlify.app`
- Add redirect URLs later for Expo/EAS builds.

## 4. Get API keys

In **Project Settings > API**, copy:

- Project URL
- anon public key

Send only these two values to configure the mobile app:

```text
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
```

Do not send the service role key in chat.

## 5. What stays secret

Never expose:

- service role key;
- database password;
- Twilio auth token;
- SendGrid API key;
- Apple private key.

These will go into Supabase Edge Function secrets later.
