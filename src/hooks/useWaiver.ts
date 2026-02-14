import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import jsPDF from 'jspdf';

export function useWaiver() {
  const [loading, setLoading] = useState(false);

  async function createPdfAndUpload(values: { name: string; email?: string; medical_notes?: string }, signatureDataUrl?: string | null) {
    setLoading(true);
    try {
      const doc = new jsPDF({ unit: 'pt', format: 'a4' });
      doc.setFontSize(12);
      doc.text('Diving Waiver and Medical Declaration', 40, 40);
      doc.text(`Name: ${values.name}`, 40, 80);
      doc.text(`Email: ${values.email ?? ''}`, 40, 100);
      doc.text('Medical notes:', 40, 140);
      doc.text(values.medical_notes ?? 'None', 40, 160, { maxWidth: 500 });

      if (signatureDataUrl) {
        // insert signature image near bottom
        doc.text('Signature:', 40, 500);
        doc.addImage(signatureDataUrl, 'PNG', 120, 480, 200, 60);
      }

      const pdfBlob = doc.output('blob');

      // ensure we have a diver row: try match by email
      let diverId: string | null = null;
      if (values.email) {
        const { data: existing } = await supabase.from('divers').select('id').eq('email', values.email).limit(1).maybeSingle();
        if (existing && (existing as any).id) diverId = (existing as any).id;
      }

      if (!diverId) {
        // create a minimal diver record
        const { data: newDiver } = await supabase.from('divers').insert([{ name: values.name, email: values.email }]).select().single();
        diverId = newDiver?.id ?? null;
      }

      const path = `waivers/${diverId ?? 'unknown'}/${Date.now()}.pdf`;
      const { error: uploadErr } = await supabase.storage.from('waivers').upload(path, pdfBlob as Blob, { upsert: true });
      let publicUrl: string | null = null;
      if (!uploadErr) {
        const { data: urlData } = supabase.storage.from('waivers').getPublicUrl(path);
        publicUrl = urlData.publicUrl ?? null;
      }

      // create waiver record
      const { error: wErr } = await supabase.from('waivers').insert([{ diver_id: diverId, form_data: values, signature_image_url: signatureDataUrl, pdf_url: publicUrl }]);
      if (wErr) throw wErr;

      setLoading(false);
      return { ok: true, pdfUrl: publicUrl };
    } catch (err) {
      setLoading(false);
      return { ok: false, error: err };
    }
  }

  return { createPdfAndUpload, loading };
}
