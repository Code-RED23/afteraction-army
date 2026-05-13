import { NextResponse } from 'next/server';
import { getAuthContext, ensureNCO } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  try {
    const ctx = await getAuthContext();
    await ensureNCO(ctx);
    const { email, role = 'soldier' } = await req.json();

    if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 });

    const supabase = createServiceClient();

    const { data: existing } = await supabase
      .from('invites')
      .select('id')
      .eq('platoon_id', ctx.platoonId)
      .eq('email', email.toLowerCase())
      .eq('status', 'pending')
      .single();

    if (existing) return NextResponse.json({ error: 'Invite already pending' }, { status: 409 });

    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('platoon_id', ctx.platoonId)
      .eq('email', email.toLowerCase())
      .single();

    if (existingProfile) return NextResponse.json({ error: 'Already a member' }, { status: 409 });

    const { data: invite, error } = await supabase
      .from('invites')
      .insert({
        platoon_id: ctx.platoonId,
        email: email.toLowerCase(),
        role,
        invited_by: ctx.profile.id,
        status: 'pending',
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ invite });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: err instanceof Error && err.message.includes('NCO') ? 403 : 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const ctx = await getAuthContext();
    await ensureNCO(ctx);
    const { inviteId } = await req.json();

    const supabase = createServiceClient();
    await supabase.from('invites').delete().eq('id', inviteId).eq('platoon_id', ctx.platoonId);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 500 });
  }
}
