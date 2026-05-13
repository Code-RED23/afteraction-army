'use client';

import { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, AlertTriangle, CheckCircle, Clock, Tag, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface InsightsData {
  stats: {
    total: number;
    byType: [string, number][];
    byMonth: [string, number][];
    topTags: [string, number][];
    actionItems: { open: number; closed: number; highPriority: number };
    topThemes: { theme: string; count: number }[];
  };
  recentAARs: { id: string; summary: string | null; incident_type: string | null; incident_date: string | null }[];
}

export default function InsightsPage() {
  const [data, setData] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await fetch('/api/insights');
      const json = await res.json();
      setData(json);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
      </div>
    );
  }

  if (!data?.stats || data.stats.total === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <h2 className="text-xl font-bold text-gray-100 mb-2">Insights</h2>
        <div className="text-center py-16 border border-dashed border-gray-800 rounded-xl">
          <BarChart3 className="w-10 h-10 text-gray-700 mx-auto mb-3" />
          <h3 className="text-sm font-medium text-gray-400 mb-1">No data yet</h3>
          <p className="text-xs text-gray-600">Complete a few debriefs to see patterns emerge.</p>
        </div>
      </div>
    );
  }

  const { stats, recentAARs } = data;
  const completionRate = stats.actionItems.open + stats.actionItems.closed > 0
    ? Math.round((stats.actionItems.closed / (stats.actionItems.open + stats.actionItems.closed)) * 100)
    : 0;

  const maxTypeCount = Math.max(...stats.byType.map(([, c]) => c), 1);

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-100">Insights</h2>
        <p className="text-sm text-gray-500">Cross-incident pattern detection across {stats.total} AARs</p>
      </div>

      {/* Top-level stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-4 h-4 text-amber-400" />
            <span className="text-xs text-gray-500 uppercase tracking-wider">Total AARs</span>
          </div>
          <p className="text-2xl font-bold text-gray-100">{stats.total}</p>
        </div>

        <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span className="text-xs text-gray-500 uppercase tracking-wider">Open Actions</span>
          </div>
          <p className="text-2xl font-bold text-gray-100">{stats.actionItems.open}</p>
          {stats.actionItems.highPriority > 0 && (
            <p className="text-xs text-red-400 mt-1">{stats.actionItems.highPriority} high priority</p>
          )}
        </div>

        <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-gray-500 uppercase tracking-wider">Completion</span>
          </div>
          <p className="text-2xl font-bold text-gray-100">{completionRate}%</p>
          <p className="text-xs text-gray-600 mt-1">{stats.actionItems.closed} closed</p>
        </div>

        <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-gray-500 uppercase tracking-wider">Types</span>
          </div>
          <p className="text-2xl font-bold text-gray-100">{stats.byType.length}</p>
          <p className="text-xs text-gray-600 mt-1">incident categories</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Incident Type Breakdown */}
        <div className="border border-gray-800 rounded-lg bg-gray-900/50">
          <div className="px-4 py-3 border-b border-gray-800">
            <h3 className="text-sm font-semibold text-gray-200">By Incident Type</h3>
          </div>
          <div className="p-4 space-y-3">
            {stats.byType.map(([type, count]) => (
              <div key={type}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-300">{type}</span>
                  <span className="text-xs text-gray-500">{count}</span>
                </div>
                <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all"
                    style={{ width: `${(count / maxTypeCount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
            {stats.byType.length === 0 && (
              <p className="text-xs text-gray-600 text-center py-4">No incident types recorded yet.</p>
            )}
          </div>
        </div>

        {/* Recurring Themes */}
        <div className="border border-gray-800 rounded-lg bg-gray-900/50">
          <div className="px-4 py-3 border-b border-gray-800">
            <h3 className="text-sm font-semibold text-gray-200">Recurring Themes</h3>
          </div>
          <div className="p-4">
            {stats.topThemes.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {stats.topThemes.map((t) => (
                  <span
                    key={t.theme}
                    className={cn(
                      'text-xs font-mono px-2.5 py-1 rounded-full border',
                      t.count >= 5
                        ? 'bg-amber-900/30 text-amber-400 border-amber-800/40'
                        : t.count >= 3
                        ? 'bg-gray-800 text-gray-300 border-gray-700'
                        : 'bg-gray-900 text-gray-500 border-gray-800'
                    )}
                  >
                    {t.theme} ({t.count})
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-600 text-center py-4">Need more AARs to detect patterns.</p>
            )}
          </div>
        </div>

        {/* Tags */}
        {stats.topTags.length > 0 && (
          <div className="border border-gray-800 rounded-lg bg-gray-900/50">
            <div className="px-4 py-3 border-b border-gray-800 flex items-center gap-2">
              <Tag className="w-4 h-4 text-gray-500" />
              <h3 className="text-sm font-semibold text-gray-200">Top Tags</h3>
            </div>
            <div className="p-4 flex flex-wrap gap-2">
              {stats.topTags.map(([tag, count]) => (
                <span key={tag} className="text-xs font-mono px-2 py-1 rounded bg-gray-800 text-gray-400">
                  {tag} ({count})
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Monthly Activity */}
        <div className="border border-gray-800 rounded-lg bg-gray-900/50">
          <div className="px-4 py-3 border-b border-gray-800 flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-500" />
            <h3 className="text-sm font-semibold text-gray-200">Monthly Activity</h3>
          </div>
          <div className="p-4 space-y-2">
            {stats.byMonth.slice(0, 6).map(([month, count]) => (
              <div key={month} className="flex items-center justify-between">
                <span className="text-sm text-gray-400">{month}</span>
                <span className="text-xs font-mono text-gray-500">{count} AAR{count !== 1 ? 's' : ''}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent AARs */}
      {recentAARs.length > 0 && (
        <div className="mt-6 border border-gray-800 rounded-lg bg-gray-900/50">
          <div className="px-4 py-3 border-b border-gray-800">
            <h3 className="text-sm font-semibold text-gray-200">Recent Reviews</h3>
          </div>
          <div className="divide-y divide-gray-800">
            {recentAARs.map((aar) => (
              <Link key={aar.id} href={`/dashboard/${aar.id}`} className="block px-4 py-3 hover:bg-gray-900/80 transition-colors">
                <p className="text-sm text-gray-300 truncate">{aar.summary || 'Untitled'}</p>
                <div className="flex gap-3 mt-1">
                  {aar.incident_type && <span className="text-xs text-gray-600">{aar.incident_type}</span>}
                  {aar.incident_date && (
                    <span className="text-xs text-gray-600">
                      {new Date(aar.incident_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
