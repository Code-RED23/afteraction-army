import { NextResponse } from 'next/server';
import { getAuthContext, ensureNCO } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const ctx = await getAuthContext();
    const supabase = createServiceClient();

    const { data: platoon } = await supabase.from('platoons').select('*').eq('id', ctx.platoonId).single();
    const { data: squads } = await supabase.from('squads').select('*').eq('platoon_id', ctx.platoonId).order('name');
    const { data: members } = await supabase.from('profiles').select('id, full_name, email, role, rank, duty_position, squad_id, created_at').eq('platoon_id', ctx.platoonId).order('created_at');
    const { data: invites } = await supabase.from('invites').select('*').eq('platoon_id', ctx.platoonId).eq('status', 'pending').order('created_at', { ascending: false });

    return NextResponse.json({ platoon, squads: squads || [], members: members || [], invites: invites || [] });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const ctx = await getAuthContext();
    await ensureNCO(ctx);
    const body = await req.json();
    const supabase = createServiceClient();

    const allowed = ['name', 'company', 'battalion', 'brigade', 'installation', 'state', 'logo_url'];
    const updates: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in body) updates[key] = body[key];
    }

    if (Object.keys(updates).length > 0) {
      await supabase.from('platoons').update(updates).eq('id', ctx.platoonId);
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: err instanceof Error && err.message.includes('NCO') ? 403 : 500 });
  }
}
