import React, { useRef, useState } from 'react';
import useIncidents from '@/hooks/useIncidents';
import { supabase } from '@/integrations/supabase/client';

export default function IncidentForm({ onCreated }: { onCreated?: (inc: any) => void }) {
  const { createIncident, uploadAttachment } = useIncidents();
  const [form, setForm] = useState({ dive_log_id: '', description: '', severity: 'medium', actions_taken: '' });
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const { data, error } = await createIncident({ dive_log_id: form.dive_log_id || null, description: form.description, severity: form.severity, actions_taken: form.actions_taken ? [{ text: form.actions_taken }] : null });
    if (error) {
      alert('Failed to create incident: ' + error.message);
      setSubmitting(false);
      return;
    }
    const incident = data;
    if (file && incident?.id) {
      const { publicUrl, error: upErr } = await uploadAttachment(file, incident.id) as any;
      if (upErr) {
        console.warn('attachment upload failed', upErr);
      } else if (publicUrl) {
        // update incident record to include attachment URL in actions_taken or separate field
        await supabase.from('incidents').update({ actions_taken: [{ text: form.actions_taken }, { attachment: publicUrl }] }).eq('id', incident.id);
      }
    }
    setForm({ dive_log_id: '', description: '', severity: 'medium', actions_taken: '' });
    setFile(null);
    setSubmitting(false);
    if (onCreated) onCreated(incident);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 p-3">
      <div>
        <label className="block text-sm font-medium">Attach to Dive Log ID (optional)</label>
        <input value={form.dive_log_id} onChange={(e) => setForm({ ...form, dive_log_id: e.target.value })} className="input" />
      </div>
      <div>
        <label className="block text-sm font-medium">Severity</label>
        <select value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })} className="input">
          {['low','medium','high','critical'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium">Description</label>
        <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="textarea" rows={4} />
      </div>
      <div>
        <label className="block text-sm font-medium">Actions Taken (optional)</label>
        <textarea value={form.actions_taken} onChange={(e) => setForm({ ...form, actions_taken: e.target.value })} className="textarea" rows={3} />
      </div>
      <div>
        <label className="block text-sm font-medium">Attachment (photo/report)</label>
        <input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
      </div>
      <div>
        <button type="submit" className="btn primary" disabled={submitting}>{submitting ? 'Submitting…' : 'Report Incident'}</button>
      </div>
    </form>
  );
}
