import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

interface AuthContext {
  userId: string;
  isStaff: boolean;
  isAdmin: boolean;
}

async function authenticate(request: Request): Promise<AuthContext | Response> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return json({ error: 'unauthorized' }, 401);
  const token = authHeader.slice(7);

  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: userRes, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userRes?.user) return json({ error: 'invalid token' }, 401);

  const { data: roles } = await serviceClient
    .from('user_roles')
    .select('role')
    .eq('user_id', userRes.user.id);
  const roleSet = new Set((roles ?? []).map((r: { role: string }) => r.role));
  return {
    userId: userRes.user.id,
    isStaff: roleSet.has('admin') || roleSet.has('staff'),
    isAdmin: roleSet.has('admin'),
  };
}

export default async function handler(request: Request) {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const auth = await authenticate(request);
  if (auth instanceof Response) return auth;

  try {
    if (request.method === 'GET') {
      if (!auth.isStaff) return json({ error: 'forbidden' }, 403);
      const { data, error } = await serviceClient
        .from('trips')
        .select('*')
        .order('start_at', { ascending: true });
      if (error) return json({ error: 'query failed' }, 500);
      return json(data, 200);
    }

    if (request.method === 'POST') {
      if (!auth.isAdmin) return json({ error: 'forbidden' }, 403);
      const payload = await request.json().catch(() => ({}));
      const { name, boat_id, instructor_id, start_at, end_at, capacity, notes } = payload ?? {};

      if (!name || typeof name !== 'string' || name.length > 255) {
        return json({ error: 'invalid name' }, 400);
      }
      if (!start_at || typeof start_at !== 'string') {
        return json({ error: 'invalid start_at' }, 400);
      }
      if (capacity != null && (!Number.isFinite(Number(capacity)) || Number(capacity) < 0)) {
        return json({ error: 'invalid capacity' }, 400);
      }

      const { data, error } = await serviceClient
        .from('trips')
        .insert([{ name, boat_id, instructor_id, start_at, end_at, capacity, notes }])
        .select()
        .single();
      if (error) return json({ error: 'insert failed' }, 500);
      return json(data, 201);
    }

    return json({ error: 'method not allowed' }, 405);
  } catch (_err) {
    return json({ error: 'internal error' }, 500);
  }
}
