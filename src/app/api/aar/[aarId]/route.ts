import { NextResponse } from 'next/server';
import { getAuthContext, ensureNCO } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase/server';

export async function GET(_req: Request, { params }: { params: Promise<{ aarId: string }> }) {
  try {
    const ctx = await getAuthContext();
    const { aarId } = await params;
    const supabase = createServiceClient();

    const { data: aar } = await supabase
      .from('aars')
      .select('*, action_items(*), profiles!aars_created_by_fkey(full_name, email)')
      .eq('id', aarId)
      .eq('platoon_id', ctx.platoonId)
      .single();

    if (!aar) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ aar });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ aarId: string }> }) {
  try {
    const ctx = await getAuthContext();
    const { aarId } = await params;
    const body = await req.json();
    const supabase = createServiceClient();

    const { data: existing } = await supabase.from('aars').select('id').eq('id', aarId).eq('platoon_id', ctx.platoonId).single();
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const { action_items, ...aarFields } = body;
    const allowed = ['mission_date','mission_type','operation_name','unit_designation','location','grid_reference','training_event','what_was_planned','what_happened','why_difference','sustain_improve','summary','tags','status','conversation'];
    const updates: Record<string, unknown> = {};
    for (const key of allowed) { if (key in aarFields) updates[key] = aarFields[key]; }

    if (Object.keys(updates).length > 0) {
      await supabase.from('aars').update(updates).eq('id', aarId);
    }

    if (action_items) {
      await supabase.from('action_items').delete().eq('aar_id', aarId);
      if (action_items.length > 0) {
        await supabase.from('action_items').insert(
          action_items.map((item: Record<string, unknown>) => ({
            aar_id: aarId, description: item.description, assigned_to: item.assigned_to || null,
            due_date: item.due_date || null, status: item.status || 'open', priority: item.priority || 'medium',
            source_section: item.source_section || null,
          }))
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ aarId: string }> }) {
  try {
    const ctx = await getAuthContext();
    await ensureNCO(ctx);
    const { aarId } = await params;
    const supabase = createServiceClient();

    await supabase.from('aars').delete().eq('id', aarId).eq('platoon_id', ctx.platoonId);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: err instanceof Error && err.message.includes('NCO') ? 403 : 500 });
  }
}
