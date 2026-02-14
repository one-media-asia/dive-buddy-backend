Refresh Metrics function

Purpose
-------
This edge function triggers the `refresh_all_metrics` RPC in the database to precompute metrics into lightweight materialized tables.

Environment
-----------
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - service role key (required)

Deploy
------
```bash
supabase functions deploy refresh-metrics --project-ref <PROJECT_REF>
```

Scheduling
----------
You can schedule this function from the Supabase dashboard or using an external cron. To schedule from the dashboard, go to "Edge Functions" → your function → "Schedules" and create a schedule (e.g., every 10 minutes).

Or use curl (run from a secure server or CI) to trigger it:

```bash
curl -X POST -H "Authorization: Bearer <SERVICE_ROLE_KEY>" \
  -H "Content-Type: application/json" \
  -d '{"days":30}' \
  https://<PROJECT_REF>.functions.supabase.co/refresh-metrics
```
