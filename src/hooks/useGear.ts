import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useGearItems() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const { data } = await supabase.from('gear_items').select('*').order('created_at', { ascending: false });
      if (!mounted) return;
      setItems(data ?? []);
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, []);

  return { items, loading };
}

export async function createGearItem(payload: { name: string; sku?: string; category?: string; description?: string }) {
  const { data, error } = await supabase.from('gear_items').insert([payload]).select().single();
  return { data, error };
}

export async function getGearStock(gear_item_id: string) {
  const { data, error } = await supabase.from('gear_stock').select('*').eq('gear_item_id', gear_item_id).order('created_at', { ascending: false });
  return { data, error };
}

export async function createGearStock(payload: { gear_item_id: string; serial_number?: string }) {
  const { data, error } = await supabase.from('gear_stock').insert([payload]).select().single();
  return { data, error };
}

export default {
  useGearItems,
  createGearItem,
  getGearStock,
  createGearStock,
};
