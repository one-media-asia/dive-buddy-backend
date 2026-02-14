import { createClient } from '@supabase/supabase-js';

// Edge Function to trigger server-side metrics refresh using service role key.
const SUPABASE_URL = Deno?.env?.get('SUPABASE_URL') ?? process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = Deno?.env?.get('SUPABASE_SERVICE_ROLE_KEY') ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL || '', SUPABASE_SERVICE_ROLE_KEY || '');

export default async function handler(request: Request) {
  try {
    // Optional: accept { days } in JSON body
    let days = 30;
    if (request.method === 'POST') {
      const body = await request.json().catch(() => ({}));
      if (body?.days) days = Number(body.days) || 30;
    }

    const { error } = await supabase.rpc('refresh_all_metrics', { days });
    if (error) {
      console.error('refresh_all_metrics error', error);
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response(String(err), { status: 500 });
  }
}
