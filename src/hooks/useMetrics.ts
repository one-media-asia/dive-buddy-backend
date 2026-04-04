import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

const sb = supabase as any;

export function useMetrics(pollInterval = 10000) {
  const [loading, setLoading] = useState(true);
  const [bookingsSeries, setBookingsSeries] = useState<any[]>([]);
  const [revenueSeries, setRevenueSeries] = useState<any[]>([]);
  const [maintenanceCounts, setMaintenanceCounts] = useState({ due: 0, overdue: 0 });
  const [topItems, setTopItems] = useState<any[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data: bookings } = await sb.rpc('bookings_per_day', { days: 30 });
      const bookingsData = (bookings || []).map((r: any) => ({ date: r.day?.toString?.() ?? r.day, count: Number(r.count || 0) }));

      const { data: rev } = await sb.from('pos_transactions').select('created_at, amount, status').gte('created_at', new Date(Date.now() - 29 * 24 * 3600 * 1000).toISOString());
      const revCounts: Record<string, number> = {};
      (rev || []).forEach((t: any) => {
        if (t.status !== 'paid') return;
        const d = new Date(t.created_at).toISOString().slice(0, 10);
        revCounts[d] = (revCounts[d] || 0) + Number(t.amount || 0);
      });
      const revData = Object.keys(revCounts).sort().map((k) => ({ date: k, revenue: revCounts[k] }));

      const { count: dueCount } = await sb.from('maintenance_tasks').select('id', { count: 'exact', head: true }).gte('due_at', new Date().toISOString());
      const { count: overdueCount } = await sb.from('maintenance_tasks').select('id', { count: 'exact', head: true }).lt('due_at', new Date().toISOString()).neq('completed_at', null);

      const { data: items } = await sb.rpc('pos_top_items', { days: 30, limit_val: 5 });

      const { data: matBookings } = await sb.from('metrics_bookings_day').select('*').order('day', { ascending: true }).limit(30);
      const bookingSeriesToUse = (matBookings && matBookings.length) ? matBookings.map((r: any) => ({ date: r.day?.toString?.(), count: Number(r.count || 0) })) : bookingsData || [];

      const { data: matRevenue } = await sb.from('metrics_revenue_day').select('*').order('day', { ascending: true }).limit(30);
      const revenueSeriesToUse = (matRevenue && matRevenue.length) ? matRevenue.map((r: any) => ({ date: r.day?.toString?.(), revenue: Number(r.revenue || 0) })) : revData || [];

      setBookingsSeries(bookingSeriesToUse);
      setRevenueSeries(revenueSeriesToUse);
      setMaintenanceCounts({ due: Number(dueCount || 0), overdue: Number(overdueCount || 0) });

      const { data: matItems } = await sb.from('metrics_top_items').select('*').order('quantity', { ascending: false }).limit(10);
      setTopItems((matItems && matItems.length) ? matItems : (items || []));
    } catch (e) {
      // ignore errors
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const ch = supabase.channel('metrics');
    ch.on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => load());
    ch.subscribe();
    const id = setInterval(load, pollInterval);
    return () => {
      clearInterval(id);
      supabase.removeChannel(ch);
    };
  }, [load, pollInterval]);

  return { loading, bookingsSeries, revenueSeries, maintenanceCounts, topItems, refresh: load };
}

export default useMetrics;
