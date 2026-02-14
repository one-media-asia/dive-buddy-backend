import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = Deno?.env?.get('SUPABASE_URL') ?? process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = Deno?.env?.get('SUPABASE_SERVICE_ROLE_KEY') ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL || '', SUPABASE_SERVICE_ROLE_KEY || '');

export default async function handler(request: Request) {
  try {
    const method = request.method.toUpperCase();

    if (method === 'GET') {
      // list upcoming trips
      const { data, error } = await supabase
        .from('trips')
        .select('*')
        .order('start_at', { ascending: true });
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
      return new Response(JSON.stringify(data), { status: 200 });
    }

    if (method === 'POST') {
      const payload = await request.json().catch(() => ({}));
      const { name, boat_id, instructor_id, start_at, end_at, capacity, notes } = payload;
      if (!name || !start_at) return new Response('missing name or start_at', { status: 400 });

      const { data, error } = await supabase
        .from('trips')
        .insert([{ name, boat_id, instructor_id, start_at, end_at, capacity, notes }])
        .select()
        .single();

      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
      return new Response(JSON.stringify(data), { status: 201 });
    }

    return new Response('method not allowed', { status: 405 });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(err);
    return new Response(String(err), { status: 500 });
  }
}
