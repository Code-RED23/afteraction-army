import { NextResponse } from 'next/server';
import { getAuthContext, ensureAdmin } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const ctx = await getAuthContext();
    const supabase = createServiceClient();

    const { data: agency } = await supabase.from('agencies').select('*').eq('id', ctx.agencyId).single();
    const { data: members } = await supabase.from('profiles').select('id, full_name, email, role, created_at').eq('agency_id', ctx.agencyId).order('created_at');
    const { data: invites } = await supabase.from('invites').select('*').eq('agency_id', ctx.agencyId).eq('status', 'pending').order('created_at', { ascending: false });

    return NextResponse.json({ agency, members: members || [], invites: invites || [] });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const ctx = await getAuthContext();
    await ensureAdmin(ctx);
    const body = await req.json();
    const supabase = createServiceClient();

    const allowed = ['name', 'state', 'size', 'logo_url'];
    const updates: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in body) updates[key] = body[key];
    }

    if (Object.keys(updates).length > 0) {
      await supabase.from('agencies').update(updates).eq('id', ctx.agencyId);
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: err instanceof Error && err.message.includes('admin') ? 403 : 500 });
  }
}
