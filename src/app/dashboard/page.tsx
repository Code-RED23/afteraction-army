'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Search, MessageSquarePlus, FileText, CheckCircle, Clock, Loader2, MessageSquare } from 'lucide-react';
import { cn, formatDate, formatRelativeTime } from '@/lib/utils';

interface AARItem {
  id: string; summary: string | null; incident_date: string | null; incident_type: string | null;
  unit: string | null; status: string; created_at: string;
  action_items: { count: number }[]; profiles: { full_name: string } | null;
}

export default function DashboardPage() {
  const [aars, setAars] = useState<AARItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  const fetchAARs = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    params.set('page', page.toString());
    const res = await fetch(`/api/aar?${params}`);
    const data = await res.json();
    setAars(data.aars || []);
    setTotal(data.total || 0);
    setLoading(false);
  }, [search, page]);

  useEffect(() => { const t = setTimeout(fetchAARs, 300); return () => clearTimeout(t); }, [fetchAARs]);

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-100">After Action Reviews</h2>
          <p className="text-sm text-gray-500">{total} debrief{total !== 1 ? 's' : ''} completed</p>
        </div>
        <Link href="/dashboard/debrief"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium rounded-lg transition-colors">
          <MessageSquarePlus className="w-4 h-4" />
          Start Debrief
        </Link>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
        <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search AARs..."
          className="w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-gray-800 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-amber-500/40" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48"><Loader2 className="w-6 h-6 text-amber-400 animate-spin" /></div>
      ) : aars.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-gray-800 rounded-xl">
          <MessageSquare className="w-10 h-10 text-gray-700 mx-auto mb-3" />
          <h3 className="text-sm font-medium text-gray-400 mb-1">{search ? 'No matching AARs' : 'No debriefs yet'}</h3>
          <p className="text-xs text-gray-600 mb-4">{search ? 'Try different keywords.' : 'Start your first debrief with Chief.'}</p>
          {!search && (
            <Link href="/dashboard/debrief" className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium rounded-lg transition-colors">
              <MessageSquarePlus className="w-4 h-4" />Start Debrief
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {aars.map((aar) => {
            const actionCount = aar.action_items?.[0]?.count || 0;
            return (
              <Link key={aar.id} href={`/dashboard/${aar.id}`}
                className="block border border-gray-800 rounded-lg bg-gray-900/50 hover:bg-gray-900/80 hover:border-gray-700 transition-colors p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-200 mb-1 truncate">{aar.summary || 'In progress...'}</p>
                    <div className="flex items-center gap-3 flex-wrap">
                      {aar.incident_type && <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-gray-800 text-gray-400">{aar.incident_type}</span>}
                      {aar.incident_date && <span className="text-xs text-gray-600">{formatDate(aar.incident_date)}</span>}
                      {actionCount > 0 && <span className="text-xs text-gray-600">{actionCount} action item{actionCount !== 1 ? 's' : ''}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={cn('text-xs px-2 py-0.5 rounded flex items-center gap-1',
                      aar.status === 'final' ? 'bg-emerald-900/30 text-emerald-400'
                        : aar.status === 'review' ? 'bg-amber-900/30 text-amber-400'
                        : 'bg-gray-800 text-gray-500')}>
                      {aar.status === 'final' ? <><CheckCircle className="w-3 h-3" /> Final</>
                        : aar.status === 'review' ? <><Clock className="w-3 h-3" /> Review</>
                        : <><MessageSquare className="w-3 h-3" /> Active</>}
                    </span>
                    <span className="text-xs text-gray-600">{formatRelativeTime(aar.created_at)}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}
            className="px-3 py-1.5 text-xs text-gray-400 border border-gray-800 rounded disabled:opacity-40 hover:text-gray-200">Previous</button>
          <span className="text-xs text-gray-600">Page {page} of {totalPages}</span>
          <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}
            className="px-3 py-1.5 text-xs text-gray-400 border border-gray-800 rounded disabled:opacity-40 hover:text-gray-200">Next</button>
        </div>
      )}
    </div>
  );
}
