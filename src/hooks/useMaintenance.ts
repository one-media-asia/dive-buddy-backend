import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useMaintenanceTasks() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const { data } = await supabase.from('maintenance_tasks').select('*, gear_stock(*)').order('due_at', { ascending: true });
      if (!mounted) return;
      setTasks(data ?? []);
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, []);

  return { tasks, loading };
}

export async function createMaintenanceTask(payload: { gear_stock_id: string; due_at: string; notes?: string }) {
  const { data, error } = await supabase.from('maintenance_tasks').insert([payload]).select().single();
  return { data, error };
}

export async function completeMaintenanceTask(id: string) {
  const { data, error } = await supabase.from('maintenance_tasks').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', id).select().single();
  if (!error) {
    // also update gear_stock last_maintenance_at
    try {
      const task = data as any;
      if (task?.gear_stock_id) {
        await supabase.from('gear_stock').update({ last_maintenance_at: task.completed_at }).eq('id', task.gear_stock_id);
      }
    } catch (e) {
      // ignore
    }
  }
  return { data, error };
}

export default {
  useMaintenanceTasks,
  createMaintenanceTask,
  completeMaintenanceTask,
};
