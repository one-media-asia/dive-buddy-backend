import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = Deno?.env?.get('SUPABASE_URL') ?? process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = Deno?.env?.get('SUPABASE_SERVICE_ROLE_KEY') ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL || '', SUPABASE_SERVICE_ROLE_KEY || '');

export default async function handler(request: Request) {
  try {
    if (request.method !== 'POST') return new Response('method not allowed', { status: 405 });
    const payload = await request.json().catch(() => ({}));
    const { trip_id, diver_id, booking_notes } = payload;
    if (!trip_id || !diver_id) return new Response('missing trip_id or diver_id', { status: 400 });

    // Load trip
    const { data: trip, error: tripErr } = await supabase.from('trips').select('*').eq('id', trip_id).single();
    if (tripErr) return new Response(JSON.stringify({ error: tripErr.message }), { status: 500 });
    if (!trip) return new Response('trip not found', { status: 404 });

    // Count confirmed bookings for trip
    const { count } = await supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('trip_id', trip_id)
      .eq('status', 'confirmed');

    const confirmed = Number(count || 0);

    let insertPayload: any = {
      diver_id,
      trip_id,
      notes: booking_notes ?? null,
      created_at: new Date().toISOString(),
    };

    if (confirmed < (trip.capacity || 0)) {
      // Confirmed seat
      insertPayload.status = 'confirmed';
      insertPayload.seat_number = confirmed + 1;
    } else {
      // Add to waitlist
      // compute current max waitlist position
      const { data: wlData, error: wlErr } = await supabase
        .from('bookings')
        .select('waitlist_position', { head: false })
        .eq('trip_id', trip_id)
        .neq('waitlist_position', null)
        .order('waitlist_position', { ascending: false })
        .limit(1);
      if (wlErr) return new Response(JSON.stringify({ error: wlErr.message }), { status: 500 });
      const maxPos = wlData && wlData.length ? (wlData[0].waitlist_position || 0) : 0;
      insertPayload.status = 'waitlist';
      insertPayload.waitlist_position = (maxPos || 0) + 1;
    }

    // Use service role to bypass RLS and create booking
    const { data: booking, error: bookingErr } = await supabase
      .from('bookings')
      .insert([insertPayload])
      .select()
      .single();

    if (bookingErr) return new Response(JSON.stringify({ error: bookingErr.message }), { status: 500 });
    return new Response(JSON.stringify(booking), { status: 201 });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
    return new Response(String(err), { status: 500 });
  }
}
