'use client';

import { cn } from '@/lib/utils';
import type { LiveAARState } from '@/types';
import { FileText, CheckCircle, AlertTriangle, Minus } from 'lucide-react';

interface LiveAARProps {
  aar: LiveAARState;
  phase: string;
}

const sections = [
  { key: 'what_was_planned', label: '1. What Was Planned?', phases: ['opening', 'what_happened'] },
  { key: 'what_happened', label: '2. What Actually Happened?', phases: ['what_happened', 'decisions'] },
  { key: 'why_difference', label: '3. Why the Difference?', phases: ['challenges'] },
  { key: 'sustain_improve', label: '4. Sustain / Improve', phases: ['wins', 'actions'] },
] as const;

export function LiveAAR({ aar, phase }: LiveAARProps) {
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-green-400" />
          <h3 className="text-sm font-semibold text-gray-200">Live AAR Document</h3>
        </div>
        <span className="text-xs font-mono px-2 py-0.5 rounded bg-green-900/30 text-green-400 border border-green-800/30">
          {phase || 'opening'}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Summary */}
        {aar.summary && (
          <div className="bg-green-950/20 border border-green-900/30 rounded-lg p-3">
            <p className="text-xs text-green-300/60 uppercase tracking-wider mb-1">Summary</p>
            <p className="text-sm text-green-200">{aar.summary}</p>
          </div>
        )}

        {/* Mission type + tags */}
        {(aar.mission_type || aar.tags.length > 0) && (
          <div className="flex gap-2 flex-wrap">
            {aar.mission_type && (
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-gray-800 text-gray-300">
                {aar.mission_type}
              </span>
            )}
            {aar.tags.map((tag, i) => (
              <span key={i} className="text-xs font-mono px-2 py-0.5 rounded bg-gray-800/60 text-gray-500">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* AAR Sections — build live */}
        {sections.map((section) => {
          const content = aar[section.key];
          const isActivePhase = (section.phases as readonly string[]).includes(phase);
          const hasContent = !!content;

          return (
            <div
              key={section.key}
              className={cn(
                'border rounded-lg transition-all duration-500',
                isActivePhase
                  ? 'border-green-800/50 bg-green-950/10 shadow-[0_0_15px_rgba(34,197,94,0.05)]'
                  : hasContent
                  ? 'border-gray-800 bg-gray-900/50'
                  : 'border-gray-800/50 bg-gray-900/20'
              )}
            >
              <div className="px-3 py-2 border-b border-gray-800/50 flex items-center gap-2">
                {isActivePhase && (
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                )}
                <h4 className={cn(
                  'text-xs font-semibold uppercase tracking-wider',
                  isActivePhase ? 'text-green-400' : hasContent ? 'text-gray-400' : 'text-gray-600'
                )}>
                  {section.label}
                </h4>
              </div>
              <div className="px-3 py-2.5 min-h-[3rem]">
                {hasContent ? (
                  <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">{content}</p>
                ) : (
                  <p className="text-xs text-gray-700 italic">
                    {isActivePhase ? 'Building from conversation...' : 'Waiting for discussion...'}
                  </p>
                )}
              </div>
            </div>
          );
        })}

        {/* Action Items */}
        {aar.action_items.length > 0 && (
          <div className="border border-gray-800 rounded-lg bg-gray-900/50">
            <div className="px-3 py-2 border-b border-gray-800/50">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-green-400">
                Action Items ({aar.action_items.length})
              </h4>
            </div>
            <div className="p-3 space-y-2">
              {aar.action_items.map((item, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className={cn(
                    'w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5',
                    item.priority === 'high' ? 'bg-red-900/40 text-red-400'
                      : item.priority === 'medium' ? 'bg-amber-900/40 text-amber-400'
                      : 'bg-gray-800 text-gray-500'
                  )}>
                    {item.priority === 'high' ? <AlertTriangle className="w-2.5 h-2.5" />
                      : item.priority === 'medium' ? <Minus className="w-2.5 h-2.5" />
                      : <CheckCircle className="w-2.5 h-2.5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-300">{item.description}</p>
                    {item.assigned_to && (
                      <p className="text-xs text-gray-600 mt-0.5">{item.assigned_to}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
