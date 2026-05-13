import { NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase/server';

// GET /api/aar — List AARs
export async function GET(req: Request) {
  try {
    const ctx = await getAuthContext();
    const supabase = createServiceClient();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = 20;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('aars')
      .select('*, action_items(count), profiles!aars_created_by_fkey(full_name)', { count: 'exact' })
      .eq('agency_id', ctx.agencyId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (search) query = query.textSearch('search_vector', search);

    const { data: aars, error, count } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ aars, total: count || 0, page, limit });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error';
    return NextResponse.json({ error: msg }, { status: msg === 'Unauthorized' ? 401 : 500 });
  }
}

// POST /api/aar — Create new AAR (starts a debrief session)
export async function POST() {
  try {
    const ctx = await getAuthContext();
    const supabase = createServiceClient();

    const { data: aar, error } = await supabase
      .from('aars')
      .insert({
        agency_id: ctx.agencyId,
        created_by: ctx.profile.id,
        status: 'active',
        conversation: [],
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ aar });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
