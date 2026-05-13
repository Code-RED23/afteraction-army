import { auth } from '@clerk/nextjs/server';
import { createServiceClient } from '@/lib/supabase/server';
import type { AuthContext, Profile } from '@/types';

export async function getAuthContext(): Promise<AuthContext> {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');

  const supabase = createServiceClient();
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('clerk_user_id', userId)
    .single();

  if (error || !profile) throw new Error('Profile not found');
  if (!profile.platoon_id) throw new Error('No unit assigned');

  return {
    userId,
    profile: profile as Profile,
    platoonId: profile.platoon_id,
    squadId: profile.squad_id || null,
    role: profile.role,
  };
}

export async function ensureNCO(ctx: AuthContext): Promise<void> {
  if (ctx.role !== 'admin' && ctx.role !== 'nco') throw new Error('Forbidden: NCO/admin access required');
}

export async function ensureAdmin(ctx: AuthContext): Promise<void> {
  if (ctx.role !== 'admin') throw new Error('Forbidden: admin access required');
}
