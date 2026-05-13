import { auth } from '@clerk/nextjs/server';
import { createServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { name, company, battalion, brigade, installation, state } = await req.json();
  if (!name || !state) return NextResponse.json({ error: 'Platoon name and state required' }, { status: 400 });

  const supabase = createServiceClient();

  // Create platoon
  const { data: platoon, error: platoonErr } = await supabase
    .from('platoons')
    .insert({ name, company: company || null, battalion: battalion || null, brigade: brigade || null, installation: installation || null, state })
    .select()
    .single();
  if (platoonErr) return NextResponse.json({ error: 'Failed to create platoon' }, { status: 500 });

  // Link or create profile
  const { data: existing } = await supabase.from('profiles').select('id').eq('clerk_user_id', userId).single();
  if (existing) {
    await supabase.from('profiles').update({ platoon_id: platoon.id, role: 'admin' }).eq('clerk_user_id', userId);
  } else {
    await supabase.from('profiles').insert({ clerk_user_id: userId, platoon_id: platoon.id, role: 'admin', full_name: '', email: '' });
  }

  return NextResponse.json({ platoon });
}
