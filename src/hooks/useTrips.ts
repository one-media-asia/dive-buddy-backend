import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useTrips() {
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      const { data, error } = await supabase.from('trips').select('*').order('start_at', { ascending: true });
      if (!mounted) return;
      if (!error && data) setTrips(data);
      setLoading(false);
    }
    load();
    return () => { mounted = false; };
  }, []);

  return { trips, loading };
}
