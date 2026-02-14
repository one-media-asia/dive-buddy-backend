import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useIncidents() {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const { data } = await supabase.from('incidents').select('*, dive_log_id, reported_by, reported_at').order('reported_at', { ascending: false });
      if (!mounted) return;
      setIncidents(data ?? []);
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, []);

  async function createIncident(payload: { dive_log_id?: string | null; description: string; severity?: string; actions_taken?: any; reported_by?: string | null }) {
    const { data, error } = await supabase.from('incidents').insert([{
      dive_log_id: payload.dive_log_id ?? null,
      description: payload.description,
      severity: payload.severity ?? 'medium',
      actions_taken: payload.actions_taken ?? null,
      reported_by: payload.reported_by ?? null,
    }]).select().single();
    if (!error && data) setIncidents((s) => [data, ...s]);
    return { data, error };
  }

  async function uploadAttachment(file: File, incidentId: string) {
    // store in bucket 'incident-attachments'
    const path = `incident-attachments/${incidentId}/${Date.now()}_${file.name}`;
    const { error: uploadErr } = await supabase.storage.from('incident-attachments').upload(path, file, { upsert: true });
    if (uploadErr) return { error: uploadErr };
    const { data: urlData } = supabase.storage.from('incident-attachments').getPublicUrl(path);
    return { publicUrl: urlData?.publicUrl ?? null };
  }

  async function resolveIncident(id: string) {
    const { data, error } = await supabase.from('incidents').update({ resolved_at: new Date().toISOString() }).eq('id', id).select().single();
    if (!error && data) setIncidents((s) => s.map((it) => it.id === id ? data : it));
    return { data, error };
  }

  return { incidents, loading, createIncident, uploadAttachment, resolveIncident };
}

export default useIncidents;
