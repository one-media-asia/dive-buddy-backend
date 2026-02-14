import { supabase } from './client';
import type { Database } from './types';

// Keep the client in sync with the `profiles` table when auth state changes.
export function syncProfileOnAuth() {
  // subscribe to auth state changes
  supabase.auth.onAuthStateChange(async (_event, session) => {
    const user = session?.user;
    if (!user) return;

    const userId = user.id;
    const full_name = (user.user_metadata as any)?.full_name ?? user.email ?? '';

    try {
      await supabase
        .from('profiles')
        .upsert({ user_id: userId, full_name }, { onConflict: 'user_id' });
    } catch (err) {
      // keep failure non-fatal for the client
      // eslint-disable-next-line no-console
      console.error('Failed to sync profile on auth change', err);
    }
  });
}

export async function getProfile(userId: string) {
  const { data, error } = await supabase.from('profiles').select('*').eq('user_id', userId).single();
  return { data, error } as { data: Database['public']['Tables']['profiles']['Row'] | null; error: any };
}

export async function updateProfile(userId: string, changes: Partial<{ full_name: string }>) {
  const { data, error } = await supabase
    .from('profiles')
    .update(changes)
    .eq('user_id', userId)
    .select()
    .single();
  return { data, error } as { data: Database['public']['Tables']['profiles']['Row'] | null; error: any };
}

export default {
  syncProfileOnAuth,
  getProfile,
  updateProfile,
};
