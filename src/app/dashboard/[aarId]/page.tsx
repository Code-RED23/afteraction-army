'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Download, FileText, CheckCircle, Loader2, Plus, Trash2, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ChatMessage } from '@/components/debrief/ChatMessage';
import type { AARWithActionItems, ActionItem } from '@/types';

const SECTIONS = [
  { key: 'what_was_planned', label: '1. What Was Planned?' },
  { key: 'what_happened', label: '2. What Actually Happened?' },
  { key: 'why_difference', label: '3. Why the Difference?' },
  { key: 'sustain_improve', label: '4. Sustain / Improve' },
] as const;

export default function AARReviewPage() {
  const params = useParams();
  const router = useRouter();
  const aarId = params.aarId as string;
  const [aar, setAar] = useState<AARWithActionItems | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [convoOpen, setConvoOpen] = useState(false);
  const saveTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/aar/${aarId}`);
      if (!res.ok) { router.push('/dashboard'); return; }
      setAar((await res.json()).aar);
      setLoading(false);
    })();
  }, [aarId, router]);

  const debouncedSave = useCallback((updates: Record<string, unknown>) => {
    if (saveTimeout.current) clearTimeout(saveTimeout.current);
    setSaved(false);
    saveTimeout.current = setTimeout(async () => {
      setSaving(true);
      await fetch(`/api/aar/${aarId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates) });
      setSaving(false); setSaved(true); setTimeout(() => setSaved(false), 2000);
    }, 1000);
  }, [aarId]);

  function updateField(field: string, value: string) {
    if (!aar) return;
    setAar({ ...aar, [field]: value });
    debouncedSave({ [field]: value });
  }

  function updateActionItem(i: number, field: string, value: string) {
    if (!aar) return;
    const items = [...aar.action_items];
    items[i] = { ...items[i], [field]: value };
    setAar({ ...aar, action_items: items });
    debouncedSave({ action_items: items });
  }

  function addActionItem() {
    if (!aar) return;
    const item: ActionItem = { id: crypto.randomUUID(), aar_id: aarId, description: '', assigned_to: null, due_date: null, status: 'open', priority: 'medium', source_section: null };
    const items = [...aar.action_items, item];
    setAar({ ...aar, action_items: items });
    debouncedSave({ action_items: items });
  }

  function removeActionItem(i: number) {
    if (!aar) return;
    const items = aar.action_items.filter((_, idx) => idx !== i);
    setAar({ ...aar, action_items: items });
    debouncedSave({ action_items: items });
  }

  async function finalize() {
    await fetch(`/api/aar/${aarId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'final' }) });
    setAar(aar ? { ...aar, status: 'final' } : null);
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 text-amber-400 animate-spin" /></div>;
  if (!aar) return null;

  const conversation = aar.conversation || [];

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-300"><ArrowLeft className="w-4 h-4" />Back</Link>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500 flex items-center gap-1.5">
            {saving && <><Loader2 className="w-3 h-3 animate-spin" /> Saving...</>}
            {saved && <><CheckCircle className="w-3 h-3 text-emerald-400" /> Saved</>}
          </span>
          <a href={`/api/aar/${aarId}/export?format=pdf`} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-400 border border-gray-800 rounded-lg hover:text-gray-200"><Download className="w-3.5 h-3.5" />PDF</a>
          <a href={`/api/aar/${aarId}/export?format=docx`} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-400 border border-gray-800 rounded-lg hover:text-gray-200"><FileText className="w-3.5 h-3.5" />Word</a>
          {aar.status !== 'final' && (
            <button onClick={finalize} className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs bg-amber-600 hover:bg-amber-500 text-white font-medium rounded-lg"><CheckCircle className="w-3.5 h-3.5" />Finalize</button>
          )}
        </div>
      </div>

      {/* Status + type */}
      <div className="flex items-center gap-3 mb-4">
        <span className={cn('text-xs font-mono px-2 py-0.5 rounded', aar.status === 'final' ? 'bg-emerald-900/30 text-emerald-400 border border-emerald-800/40' : 'bg-amber-900/30 text-amber-400 border border-amber-800/40')}>
          {aar.status === 'final' ? 'Finalized' : 'In Review'}
        </span>
        {aar.incident_type && <span className="text-xs font-mono px-2 py-0.5 rounded bg-gray-800 text-gray-400">{aar.incident_type}</span>}
      </div>

      {/* Metadata */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Date', field: 'incident_date', type: 'date' },
          { label: 'Type', field: 'incident_type', type: 'text', placeholder: 'e.g. Structure Fire' },
          { label: 'Unit', field: 'unit', type: 'text', placeholder: 'e.g. Engine 7' },
          { label: 'Location', field: 'location', type: 'text', placeholder: 'e.g. 123 Main St' },
        ].map((f) => (
          <div key={f.field}>
            <label className="text-xs text-gray-600 block mb-1">{f.label}</label>
            <input type={f.type} value={(aar as unknown as Record<string, string | null>)[f.field] || ''} onChange={(e) => updateField(f.field, e.target.value)} placeholder={f.placeholder}
              className="w-full px-2.5 py-1.5 bg-gray-900 border border-gray-800 rounded text-sm text-gray-200 placeholder-gray-700 focus:outline-none focus:ring-1 focus:ring-amber-500/40" />
          </div>
        ))}
      </div>

      {aar.summary && <div className="bg-amber-950/20 border border-amber-900/30 rounded-lg p-4 mb-6"><p className="text-sm text-amber-300">{aar.summary}</p></div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {SECTIONS.map((s) => (
            <div key={s.key} className="border border-gray-800 rounded-lg bg-gray-900/50">
              <div className="px-4 py-3 border-b border-gray-800"><h3 className="text-sm font-semibold text-gray-200">{s.label}</h3></div>
              <textarea value={(aar[s.key] as string) || ''} onChange={(e) => updateField(s.key, e.target.value)} rows={6}
                className="w-full px-4 py-3 bg-transparent text-sm text-gray-300 resize-y focus:outline-none" />
            </div>
          ))}
        </div>

        <div className="space-y-4">
          {/* Action Items */}
          <div className="border border-gray-800 rounded-lg bg-gray-900/50">
            <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-200">Action Items ({aar.action_items.length})</h3>
              <button onClick={addActionItem} className="p-1 text-gray-500 hover:text-amber-400"><Plus className="w-4 h-4" /></button>
            </div>
            <div className="p-3 space-y-2 max-h-80 overflow-y-auto">
              {aar.action_items.length === 0 && <p className="text-xs text-gray-600 text-center py-4">No action items.</p>}
              {aar.action_items.map((item, i) => (
                <div key={item.id} className="bg-gray-800/40 rounded-lg p-3 space-y-2">
                  <div className="flex items-start gap-2">
                    <input type="checkbox" checked={item.status === 'closed'} onChange={(e) => updateActionItem(i, 'status', e.target.checked ? 'closed' : 'open')} className="mt-0.5" />
                    <input type="text" value={item.description} onChange={(e) => updateActionItem(i, 'description', e.target.value)}
                      className={cn('flex-1 bg-transparent text-sm focus:outline-none', item.status === 'closed' ? 'text-gray-600 line-through' : 'text-gray-300')} placeholder="Action item..." />
                    <button onClick={() => removeActionItem(i)} className="p-0.5 text-gray-600 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                  <div className="flex gap-2 ml-6">
                    <select value={item.priority} onChange={(e) => updateActionItem(i, 'priority', e.target.value)}
                      className="text-xs bg-gray-900 border border-gray-800 rounded px-1.5 py-0.5 text-gray-400 focus:outline-none">
                      <option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
                    </select>
                    <input type="text" value={item.assigned_to || ''} onChange={(e) => updateActionItem(i, 'assigned_to', e.target.value)} placeholder="Assign..."
                      className="text-xs bg-gray-900 border border-gray-800 rounded px-1.5 py-0.5 text-gray-400 placeholder-gray-700 focus:outline-none flex-1" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Debrief Transcript */}
          {conversation.length > 0 && (
            <div className="border border-gray-800 rounded-lg bg-gray-900/50">
              <button onClick={() => setConvoOpen(!convoOpen)} className="w-full px-4 py-3 flex items-center justify-between text-sm font-semibold text-gray-200">
                <span className="flex items-center gap-2"><MessageSquare className="w-4 h-4 text-amber-400" />Debrief Conversation</span>
                {convoOpen ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
              </button>
              {convoOpen && (
                <div className="px-4 pb-4 max-h-96 overflow-y-auto space-y-3">
                  {conversation.map((msg: { id: string; role: 'chief' | 'user'; content: string }, i: number) => (
                    <ChatMessage key={msg.id || i} role={msg.role} content={msg.content} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
