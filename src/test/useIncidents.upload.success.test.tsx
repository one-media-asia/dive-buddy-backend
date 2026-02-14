import React, { useState } from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

vi.mock('@/integrations/supabase/client', () => {
  return {
    supabase: {
      from: (table: string) => {
        if (table === 'incidents') {
          return {
            select: () => ({ order: async () => ({ data: [] }) }),
            insert: (rows: any[]) => ({ select: () => ({ single: async () => ({ data: { id: 'new-id', ...rows[0] } }) }) }),
          };
        }
        return {};
      },
      storage: {
        from: () => ({
          upload: async () => ({ error: null }),
          getPublicUrl: (_: string) => ({ data: { publicUrl: 'https://cdn.example/ok.jpg' } }),
        }),
      },
    },
  };
});

import useIncidents from '@/hooks/useIncidents';

function TestComp() {
  const { uploadAttachment } = useIncidents();
  const [url, setUrl] = useState<string | null>(null);
  return (
    <div>
      <button
        onClick={async () => {
          const file = new File(['x'], 'att.png', { type: 'image/png' });
          const res = await uploadAttachment(file as any, 'incident-id');
          setUrl(res.publicUrl ?? null);
        }}
      >
        Upload
      </button>
      <div data-testid="url">{url}</div>
    </div>
  );
}

test('uploadAttachment returns publicUrl on success', async () => {
  render(<TestComp />);
  fireEvent.click(screen.getByText('Upload'));
  await waitFor(() => expect(screen.getByTestId('url').textContent).toBe('https://cdn.example/ok.jpg'));
});
