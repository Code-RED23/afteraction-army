import { NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const ctx = await getAuthContext();
    const supabase = createServiceClient();

    // Fetch all finalized AARs for this platoon
    const { data: aars } = await supabase
      .from('aars')
      .select('id, summary, mission_type, mission_date, what_was_planned, sustain_improve, tags, created_at')
      .eq('platoon_id', ctx.platoonId)
      .in('status', ['review', 'final'])
      .order('created_at', { ascending: false })
      .limit(100);

    if (!aars || aars.length === 0) {
      return NextResponse.json({ insights: null, stats: { total: 0 } });
    }

    // Aggregate stats
    const typeCounts: Record<string, number> = {};
    const monthCounts: Record<string, number> = {};
    const allTags: Record<string, number> = {};

    for (const aar of aars) {
      if (aar.mission_type) {
        typeCounts[aar.mission_type] = (typeCounts[aar.mission_type] || 0) + 1;
      }
      const month = aar.mission_date
        ? new Date(aar.mission_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        : 'Unknown';
      monthCounts[month] = (monthCounts[month] || 0) + 1;

      if (aar.tags) {
        for (const tag of aar.tags) {
          allTags[tag] = (allTags[tag] || 0) + 1;
        }
      }
    }

    // Action item stats
    const { data: actionItems } = await supabase
      .from('action_items')
      .select('status, priority, aar_id')
      .in('aar_id', aars.map((a) => a.id));

    const openItems = actionItems?.filter((ai) => ai.status === 'open').length || 0;
    const closedItems = actionItems?.filter((ai) => ai.status === 'closed').length || 0;
    const highPriority = actionItems?.filter((ai) => ai.priority === 'high' && ai.status === 'open').length || 0;

    // Extract common themes from sustain/improve sections
    const themes: string[] = [];
    for (const aar of aars) {
      if (aar.sustain_improve) {
        const words = aar.sustain_improve.toLowerCase().split(/\s+/);
        for (const word of words) {
          if (word.length > 6) themes.push(word);
        }
      }
    }

    const themeCounts: Record<string, number> = {};
    for (const t of themes) {
      themeCounts[t] = (themeCounts[t] || 0) + 1;
    }
    const topThemes = Object.entries(themeCounts)
      .filter(([, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([theme, count]) => ({ theme, count }));

    return NextResponse.json({
      stats: {
        total: aars.length,
        byType: Object.entries(typeCounts).sort((a, b) => b[1] - a[1]),
        byMonth: Object.entries(monthCounts).sort((a, b) => b[1] - a[1]),
        topTags: Object.entries(allTags).sort((a, b) => b[1] - a[1]).slice(0, 15),
        actionItems: { open: openItems, closed: closedItems, highPriority },
        topThemes,
      },
      recentAARs: aars.slice(0, 5).map((a) => ({
        id: a.id,
        summary: a.summary,
        mission_type: a.mission_type,
        mission_date: a.mission_date,
      })),
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 500 });
  }
}
