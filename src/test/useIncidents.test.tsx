import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';

// Mock the supabase client used by the hook
vi.mock('@/integrations/supabase/client', () => {
  const fromMock = vi.fn((table: string) => {
    if (table === 'incidents') {
      return {
        select: () => ({ order: async () => ({ data: [] }) }),
        insert: (rows: any[]) => ({ select: () => ({ single: async () => ({ data: { id: 'new-id', ...rows[0] } }) }) }),
        update: (_: any) => ({ eq: (_k: string, _v: any) => ({ select: () => ({ single: async () => ({ data: { id: 'new-id', resolved_at: new Date().toISOString() } }) }) }) }),
      };
    }
    return {};
  });

  const storage = {
    from: () => ({ upload: async () => ({ error: null }), getPublicUrl: (_: string) => ({ data: { publicUrl: 'https://cdn.example/att.jpg' } }) }),
  };

  return { supabase: { from: fromMock, storage } };
});

import useIncidents from '@/hooks/useIncidents';

function TestComponent() {
  const { incidents, loading, createIncident, resolveIncident } = useIncidents();

  return (
    <div>
      <div data-testid="loading">{loading ? 'loading' : 'ready'}</div>
      <div data-testid="count">{incidents.length}</div>
      <button onClick={() => createIncident({ description: 'Test incident' })}>Create</button>
      <button onClick={() => resolveIncident('new-id')}>Resolve</button>
      <ul>
        {incidents.map((i: any) => (
          <li key={i.id}>{i.description}</li>
        ))}
      </ul>
    </div>
  );
}

test('useIncidents creates and resolves incidents (mocked supabase)', async () => {
  render(<TestComponent />);

  // initial load completes
  await waitFor(() => expect(screen.getByTestId('loading').textContent).toBe('ready'));

  // create an incident
  fireEvent.click(screen.getByText('Create'));
  await waitFor(() => expect(screen.getByTestId('count').textContent).toBe('1'));
  expect(screen.getByText('Test incident')).toBeInTheDocument();

  // resolve the incident
  fireEvent.click(screen.getByText('Resolve'));
  await waitFor(() => expect(screen.getByTestId('count').textContent).toBe('1'));
});
