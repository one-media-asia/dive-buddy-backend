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
  if (request.method !== 'POST') return json({ error: 'method not allowed' }, 405);

  // 1. Verify caller is a signed-in user.
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return json({ error: 'unauthorized' }, 401);
  const token = authHeader.slice(7);

  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: userRes, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userRes?.user) return json({ error: 'invalid token' }, 401);
  const callerId = userRes.user.id;

  // 2. Check caller is staff/admin.
  const { data: roleRow } = await serviceClient
    .from('user_roles')
    .select('role')
    .eq('user_id', callerId)
    .in('role', ['admin', 'staff'])
    .limit(1)
    .maybeSingle();
  const isStaff = !!roleRow;

  // 3. Validate input.
  const payload = await request.json().catch(() => ({}));
  const { trip_id, diver_id, booking_notes } = payload ?? {};
  if (!trip_id || !diver_id || typeof trip_id !== 'string' || typeof diver_id !== 'string') {
    return json({ error: 'missing or invalid trip_id/diver_id' }, 400);
  }
  if (booking_notes != null && typeof booking_notes !== 'string') {
    return json({ error: 'invalid booking_notes' }, 400);
  }

  // 4. If not staff, callers may only book on behalf of a diver record linked to their own user.
  if (!isStaff) {
    const { data: diverRow } = await serviceClient
      .from('divers')
      .select('user_id')
      .eq('id', diver_id)
      .maybeSingle();
    if (!diverRow || (diverRow as any).user_id !== callerId) {
      return json({ error: 'forbidden' }, 403);
    }
  }

  // Load trip
  const { data: trip, error: tripErr } = await serviceClient
    .from('trips')
    .select('*')
    .eq('id', trip_id)
    .maybeSingle();
  if (tripErr) return json({ error: 'trip lookup failed' }, 500);
  if (!trip) return json({ error: 'trip not found' }, 404);

  const { count } = await serviceClient
    .from('bookings')
    .select('id', { count: 'exact', head: true })
    .eq('trip_id', trip_id)
    .eq('status', 'confirmed');

  const confirmed = Number(count || 0);
  const insertPayload: Record<string, unknown> = {
    diver_id,
    trip_id,
    notes: booking_notes ?? null,
    created_at: new Date().toISOString(),
  };

  if (confirmed < (Number((trip as any).capacity) || 0)) {
    insertPayload.status = 'confirmed';
    insertPayload.seat_number = confirmed + 1;
  } else {
    const { data: wlData, error: wlErr } = await serviceClient
      .from('bookings')
      .select('waitlist_position')
      .eq('trip_id', trip_id)
      .neq('waitlist_position', null)
      .order('waitlist_position', { ascending: false })
      .limit(1);
    if (wlErr) return json({ error: 'waitlist lookup failed' }, 500);
    const maxPos = wlData && wlData.length ? ((wlData[0] as any).waitlist_position || 0) : 0;
    insertPayload.status = 'waitlist';
    insertPayload.waitlist_position = (maxPos || 0) + 1;
  }

  const { data: booking, error: bookingErr } = await serviceClient
    .from('bookings')
    .insert([insertPayload])
    .select()
    .single();

  if (bookingErr) return json({ error: 'booking failed' }, 500);
  return json(booking, 201);
}
