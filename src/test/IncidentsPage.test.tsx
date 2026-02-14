import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

vi.mock('@/integrations/supabase/client', () => {
  return {
    supabase: {
      from: (table: string) => {
        if (table === 'incidents') {
          return {
            select: () => ({ order: async () => ({ data: [{ id: '1', description: 'Broken tank', severity: 'high', reported_at: new Date().toISOString(), resolved_at: null }] }) }),
            insert: (rows: any[]) => ({ select: () => ({ single: async () => ({ data: { id: '2', ...rows[0] } }) }) }),
            update: (_: any) => ({ eq: (_k: string, _v: any) => ({ select: () => ({ single: async () => ({ data: { id: '1', description: 'Broken tank', resolved_at: new Date().toISOString() } }) }) }) }),
          };
        }
        return {};
      },
      storage: { from: () => ({ upload: async () => ({ error: null }), getPublicUrl: () => ({ data: { publicUrl: 'https://cdn.example/att.jpg' } }) }) },
    }
  };
});

import IncidentsPage from '@/pages/IncidentsPage';

test('renders IncidentsPage and shows recent incidents', async () => {
  render(<IncidentsPage />);

  expect(screen.getByText('Incidents')).toBeInTheDocument();

  await waitFor(() => expect(screen.getByText('Broken tank')).toBeInTheDocument());

  // ensure Resolve button is present
  expect(screen.getByText('Mark Resolved')).toBeInTheDocument();
});
