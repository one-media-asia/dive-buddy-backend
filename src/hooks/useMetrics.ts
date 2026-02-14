import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useMetrics(pollInterval = 10000) {
  const [loading, setLoading] = useState(true);
  const [bookingsSeries, setBookingsSeries] = useState<any[]>([]);
  const [revenueSeries, setRevenueSeries] = useState<any[]>([]);
  const [maintenanceCounts, setMaintenanceCounts] = useState({ due: 0, overdue: 0 });
  const [topItems, setTopItems] = useState<any[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Use RPCs when available for server-side aggregation
      const { data: bookings } = await supabase.rpc('bookings_per_day', { days: 30 });
      const bookingsData = (bookings || []).map((r: any) => ({ date: r.day?.toString?.() ?? r.day, count: Number(r.count || 0) }));

      const { data: rev } = await supabase.from('pos_transactions').select('created_at, amount, status').gte('created_at', new Date(Date.now() - 29 * 24 * 3600 * 1000).toISOString());
      const revCounts: Record<string, number> = {};
      (rev || []).forEach((t: any) => {
        if (t.status !== 'paid') return;
        const d = new Date(t.created_at).toISOString().slice(0, 10);
        revCounts[d] = (revCounts[d] || 0) + Number(t.amount || 0);
      });
      const revData = Object.keys(revCounts).sort().map((k) => ({ date: k, revenue: revCounts[k] }));

      const { data: maintenanceDue } = await supabase.from('maintenance_tasks').select('id', { count: 'exact', head: true }).gte('due_at', new Date().toISOString());
      const { data: maintenanceOverdue } = await supabase.from('maintenance_tasks').select('id', { count: 'exact', head: true }).lt('due_at', new Date().toISOString()).neq('completed_at', null);

      // top-selling items via RPC
      const { data: items } = await supabase.rpc('pos_top_items', { days: 30, limit_val: 5 });

      // Prefer reading precomputed materialized tables when available for speed
      const { data: matBookings } = await supabase.from('metrics_bookings_day').select('*').order('day', { ascending: true }).limit(30);
      const bookingSeriesToUse = (matBookings && matBookings.length) ? matBookings.map((r:any) => ({ date: r.day?.toString?.(), count: Number(r.count || 0) })) : bookingsData || [];

      const { data: matRevenue } = await supabase.from('metrics_revenue_day').select('*').order('day', { ascending: true }).limit(30);
      const revenueSeriesToUse = (matRevenue && matRevenue.length) ? matRevenue.map((r:any) => ({ date: r.day?.toString?.(), revenue: Number(r.revenue || 0) })) : revData || [];

      setBookingsSeries(bookingSeriesToUse);
      setRevenueSeries(revenueSeriesToUse);
      setMaintenanceCounts({ due: Number(maintenanceDue || 0), overdue: Number(maintenanceOverdue || 0) });
      // top items: read precomputed table if present
      const { data: matItems } = await supabase.from('metrics_top_items').select('*').order('quantity', { ascending: false }).limit(10);
      setTopItems((matItems && matItems.length) ? matItems : (items || []));
    } catch (e) {
      // ignore errors for now
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();

    // subscribe to realtime changes to keep charts near real-time
    const ch = supabase.channel('metrics');

    ch.on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => load());
    ch.on('postgres_changes', { event: '*', schema: 'public', table: 'pos_transactions' }, () => load());
    ch.on('postgres_changes', { event: '*', schema: 'public', table: 'maintenance_tasks' }, () => load());

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
