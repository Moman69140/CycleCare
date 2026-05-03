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
3. Paste and run `backend/supabase/manual-setup/01_tables.sql`.
4. Create a second query.
5. Paste and run `backend/supabase/manual-setup/02_functions.sql`.
6. Create a third query.
7. Paste and run `backend/supabase/manual-setup/03_security.sql`.

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

- API URL / Project URL
- Publishable key

Send only these two values to configure the mobile app:

```text
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
```

Use only the base project URL in the mobile app. If Supabase shows:

```text
https://your-project.supabase.co/rest/v1/
```

then use:

```text
https://your-project.supabase.co
```

Do not send the service role key in chat.

## 5. What stays secret

Never expose:

- service role key;
- database password;
- Twilio auth token;
- Resend API key;
- Apple private key.

These will go into Supabase Edge Function secrets later.

## 6. Deploy notification sending

The mobile app prepares notification drafts. The real e-mail/SMS send happens from the Supabase Edge Function:

```text
backend/supabase/functions/send-cycle-notification/index.ts
```

Install and log in to the Supabase CLI, then link the project:

```bash
supabase login
supabase link --project-ref your-project-ref
```

Set secrets directly in Supabase. Do not paste them in chat.

```bash
supabase secrets set RESEND_API_KEY=your_resend_key
supabase secrets set RESEND_FROM_EMAIL="CycleCare <hello@your-domain.com>"
supabase secrets set TWILIO_ACCOUNT_SID=your_twilio_sid
supabase secrets set TWILIO_AUTH_TOKEN=your_twilio_token
supabase secrets set TWILIO_FROM_PHONE=+33600000000
```

Deploy the function:

```bash
supabase functions deploy send-cycle-notification
```

For a first MVP test, configure Resend first and keep SMS disabled in the app until Twilio is ready.
