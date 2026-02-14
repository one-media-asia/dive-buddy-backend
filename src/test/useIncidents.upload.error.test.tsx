import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

vi.mock('@/integrations/supabase/client', () => {
  return {
    supabase: {
      from: (table: string) => {
        if (table === 'incidents') {
          return {
            select: () => ({ order: async () => ({ data: [] }) }),
            insert: (_rows: any[]) => ({ select: () => ({ single: async () => ({ data: null, error: { message: 'insert failed' } }) }) }),
            update: (_: any) => ({ eq: (_k: string, _v: any) => ({ select: () => ({ single: async () => ({ data: { id: '1', resolved_at: new Date().toISOString() } }) }) }) }),
          };
        }
        return {};
      },
      storage: {
        from: () => ({
          upload: async () => ({ error: { message: 'upload failed' } }),
          getPublicUrl: (_: string) => ({ data: { publicUrl: null } }),
        }),
      },
    },
  };
});

import useIncidents from '@/hooks/useIncidents';

function TestComp() {
  const { createIncident, uploadAttachment } = useIncidents();

  return (
    <div>
      <button
        onClick={async () => {
          // attempt create which will return an error
          const { error } = await createIncident({ description: 'Bad create' } as any);
          (window as any).__createErr = error;
        }}
      >
        CreateFail
      </button>
      <button
        onClick={async () => {
          const file = new File(['x'], 'att.png', { type: 'image/png' });
          const res = await uploadAttachment(file as any, 'incident-id');
          (window as any).__uploadErr = res.error ?? null;
        }}
      >
        UploadFail
      </button>
    </div>
  );
}

test('createIncident and uploadAttachment return errors when backend fails', async () => {
  render(<TestComp />);

  fireEvent.click(screen.getByText('CreateFail'));
  await waitFor(() => expect((window as any).__createErr).toBeTruthy());

  fireEvent.click(screen.getByText('UploadFail'));
  await waitFor(() => expect((window as any).__uploadErr).toBeTruthy());
});
