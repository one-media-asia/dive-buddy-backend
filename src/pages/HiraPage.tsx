import React, { useState } from 'react';
import useHira from '@/hooks/useHira';
import { supabase } from '@/integrations/supabase/client';

export default function HiraPage() {
  const { assessments, loading, createAssessment } = useHira();
  const [form, setForm] = useState({ site_id: '', risk_level: 'low', hazards: '', mitigations: '', notes: '' });

  const [sites, setSites] = useState<any[]>([]);
  React.useEffect(() => {
    (async () => {
      const { data } = await supabase.from('dive_sites').select('id, name').order('name');
      setSites(data ?? []);
    })();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const hazards = form.hazards ? form.hazards.split('\n').map((s) => ({ text: s })) : [];
    const mitigations = form.mitigations ? form.mitigations.split('\n').map((s) => ({ text: s })) : [];
    await createAssessment({ site_id: form.site_id || null, risk_level: form.risk_level, hazards, mitigations, notes: form.notes });
    setForm({ site_id: '', risk_level: 'low', hazards: '', mitigations: '', notes: '' });
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">HIRA — Hazard Identification & Risk Assessment</h1>
        <p className="page-description">Create and review HIRA entries for dive sites</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <form onSubmit={handleSubmit} className="col-span-1 p-4 border rounded space-y-3">
          <div>
            <label className="block text-sm font-medium">Dive Site</label>
            <select value={form.site_id} onChange={(e) => setForm({ ...form, site_id: e.target.value })} className="input">
              <option value="">(Unassigned)</option>
              {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Risk Level</label>
            <select value={form.risk_level} onChange={(e) => setForm({ ...form, risk_level: e.target.value })} className="input">
              {['low','medium','high','critical'].map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Hazards (one per line)</label>
            <textarea value={form.hazards} onChange={(e) => setForm({ ...form, hazards: e.target.value })} className="textarea" rows={5} />
          </div>
          <div>
            <label className="block text-sm font-medium">Mitigations (one per line)</label>
            <textarea value={form.mitigations} onChange={(e) => setForm({ ...form, mitigations: e.target.value })} className="textarea" rows={5} />
          </div>
          <div>
            <label className="block text-sm font-medium">Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="textarea" rows={3} />
          </div>
          <div>
            <button type="submit" className="btn primary">Create HIRA</button>
          </div>
        </form>

        <div className="col-span-2 p-4 border rounded">
          <h3 className="font-semibold mb-3">Recent Assessments</h3>
          {loading && <div>Loading…</div>}
          <div className="space-y-3">
            {assessments.map((a:any) => (
              <div key={a.id} className="p-3 border rounded">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="font-medium">{a.site_id ? (sites.find(s => s.id === a.site_id)?.name ?? 'Site') : 'Unassigned'}</div>
                    <div className="text-sm text-muted-foreground">{new Date(a.assessed_at).toLocaleString()}</div>
                  </div>
                  <div className="text-sm capitalize">{a.risk_level}</div>
                </div>
                <div className="text-sm mb-2">
                  <strong>Hazards</strong>
                  <ul className="list-disc pl-5">
                    {(a.hazards || []).map((h:any, i:number) => <li key={i}>{h.text ?? JSON.stringify(h)}</li>)}
                  </ul>
                </div>
                <div className="text-sm mb-2">
                  <strong>Mitigations</strong>
                  <ul className="list-disc pl-5">
                    {(a.mitigations || []).map((m:any, i:number) => <li key={i}>{m.text ?? JSON.stringify(m)}</li>)}
                  </ul>
                </div>
                {a.notes && <div className="text-sm text-muted-foreground">Notes: {a.notes}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
