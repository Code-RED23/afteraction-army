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
  if (!profile.agency_id) throw new Error('No agency assigned');

  return {
    userId,
    profile: profile as Profile,
    agencyId: profile.agency_id,
    role: profile.role,
  };
}

export async function ensureAdmin(ctx: AuthContext): Promise<void> {
  if (ctx.role !== 'admin') throw new Error('Forbidden: admin access required');
}
