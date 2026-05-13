import { auth } from '@clerk/nextjs/server';
import { createServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { name, state, size } = await req.json();
  if (!name || !state) return NextResponse.json({ error: 'Name and state required' }, { status: 400 });

  const supabase = createServiceClient();
  const { data: agency, error: agencyErr } = await supabase.from('agencies').insert({ name, state, size: size || 'small' }).select().single();
  if (agencyErr) return NextResponse.json({ error: 'Failed to create agency' }, { status: 500 });

  const { data: existing } = await supabase.from('profiles').select('id').eq('clerk_user_id', userId).single();
  if (existing) {
    await supabase.from('profiles').update({ agency_id: agency.id, role: 'admin' }).eq('clerk_user_id', userId);
  } else {
    await supabase.from('profiles').insert({ clerk_user_id: userId, agency_id: agency.id, role: 'admin', full_name: '', email: '' });
  }

  return NextResponse.json({ agency });
}
