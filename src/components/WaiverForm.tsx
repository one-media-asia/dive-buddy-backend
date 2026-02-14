import React, { useRef } from 'react';
import { useForm } from 'react-hook-form';
import SignaturePad, { SignaturePadHandle } from '@/components/SignaturePad';
import { useWaiver } from '@/hooks/useWaiver';

export default function WaiverForm() {
  const { register, handleSubmit } = useForm<{ name: string; email?: string; medical_notes?: string }>();
  const sigRef = useRef<SignaturePadHandle | null>(null);
  const { createPdfAndUpload, loading } = useWaiver();

  async function onSubmit(values: any) {
    const sig = sigRef.current?.toDataURL() ?? null;
    const res = await createPdfAndUpload(values, sig);
    if (res.ok) {
      alert('Waiver submitted');
      sigRef.current?.clear();
    } else {
      alert('Error submitting waiver');
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium">Full name</label>
        <input {...register('name', { required: true })} className="input" />
      </div>
      <div>
        <label className="block text-sm font-medium">Email</label>
        <input {...register('email')} className="input" />
      </div>
      <div>
        <label className="block text-sm font-medium">Medical notes</label>
        <textarea {...register('medical_notes')} className="textarea" />
      </div>

      <div>
        <label className="block text-sm font-medium">Signature</label>
        <SignaturePad ref={sigRef} />
        <div className="mt-2 space-x-2">
          <button type="button" onClick={() => sigRef.current?.clear()} className="btn">Clear</button>
        </div>
      </div>

      <div>
        <button type="submit" className="btn primary" disabled={loading}>{loading ? 'Saving…' : 'Save Waiver'}</button>
      </div>
    </form>
  );
}
