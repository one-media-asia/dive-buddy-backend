import { createClient } from '@supabase/supabase-js';

// This is a simple Supabase Edge Function scaffold that accepts auth webhook
// payloads and upserts a `profiles` row using a service-role key.
// Configure `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in the function env.

const SUPABASE_URL = Deno?.env?.get('SUPABASE_URL') ?? process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = Deno?.env?.get('SUPABASE_SERVICE_ROLE_KEY') ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  // eslint-disable-next-line no-console
  console.warn('Supabase function missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
}

const supabase = createClient(SUPABASE_URL || '', SUPABASE_SERVICE_ROLE_KEY || '');

export default async function handler(request: Request) {
  try {
    const payload = await request.json().catch(() => ({}));

    const user = payload.user ?? payload.record ?? payload;
    if (!user || !user.id) {
      return new Response('no user payload', { status: 400 });
    }

    const full_name = user.user_metadata?.full_name ?? user.email ?? '';

    const { error } = await supabase
      .from('profiles')
      .upsert({ user_id: user.id, full_name }, { onConflict: 'user_id' });

    if (error) {
      // eslint-disable-next-line no-console
      console.error('profile upsert error', error);
      return new Response('upsert error', { status: 500 });
    }

    return new Response('ok', { status: 200 });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
    return new Response(String(err), { status: 500 });
  }
}
