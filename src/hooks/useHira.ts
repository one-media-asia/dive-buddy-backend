import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useHira(siteId?: string) {
  const [assessments, setAssessments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      let q = supabase.from('hazard_assessments').select('*').order('assessed_at', { ascending: false });
      if (siteId) q = q.eq('site_id', siteId);
      const { data } = await q;
      if (!mounted) return;
      setAssessments(data ?? []);
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, [siteId]);

  async function createAssessment(payload: { site_id?: string; assessor_id?: string; risk_level?: string; hazards?: any; mitigations?: any; notes?: string }) {
    const { data, error } = await supabase.from('hazard_assessments').insert([{
      site_id: payload.site_id ?? null,
      assessor_id: payload.assessor_id ?? null,
      risk_level: payload.risk_level ?? null,
      hazards: payload.hazards ?? null,
      mitigations: payload.mitigations ?? null,
      notes: payload.notes ?? null,
    }]).select().single();
    if (!error) {
      setAssessments((s) => [data, ...s]);
    }
    return { data, error };
  }

  return { assessments, loading, createAssessment };
}

export default useHira;
