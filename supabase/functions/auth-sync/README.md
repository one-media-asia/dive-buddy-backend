Auth-sync Supabase Function

Purpose
-------
This edge function receives auth webhook payloads (user created/updated) and upserts a row in the `profiles` table using the Supabase service-role key.

Environment
-----------
- `SUPABASE_URL` - your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - service role key (keep secret)

Deploy
------
Use the Supabase CLI to deploy the function. Example:

```bash
supabase functions deploy auth-sync --project-ref <PROJECT_REF>
```

Configure the function's environment variables with the CLI or in the dashboard.

Hooking auth to the function
---------------------------
In the Supabase dashboard under Auth → Settings → Webhooks, add the deployed function URL as a webhook for auth events (user.created / user.updated).
