import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

export default async function handler(request: Request) {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  // Require admin JWT — refresh is expensive and could be abused for DoS.
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return json({ error: 'unauthorized' }, 401);
  const token = authHeader.slice(7);

  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: userRes, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userRes?.user) return json({ error: 'invalid token' }, 401);

  const { data: roleRow } = await serviceClient
    .from('user_roles')
    .select('role')
    .eq('user_id', userRes.user.id)
    .eq('role', 'admin')
    .limit(1)
    .maybeSingle();
  if (!roleRow) return json({ error: 'forbidden' }, 403);

  try {
    let days = 30;
    if (request.method === 'POST') {
      const body = await request.json().catch(() => ({}));
      if (body?.days) {
        const n = Number(body.days);
        if (!Number.isFinite(n) || n < 1 || n > 365) {
          return json({ error: 'invalid days (1-365)' }, 400);
        }
        days = Math.floor(n);
      }
    }

    const { error } = await serviceClient.rpc('refresh_all_metrics', { days });
    if (error) return json({ error: 'refresh failed' }, 500);

    return json({ ok: true }, 200);
  } catch (_err) {
    return json({ error: 'internal error' }, 500);
  }
}
