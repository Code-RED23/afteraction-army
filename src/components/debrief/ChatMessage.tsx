'use client';

import { Shield, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatMessageProps {
  role: 'chief' | 'user';
  content: string;
  isStreaming?: boolean;
}

export function ChatMessage({ role, content, isStreaming }: ChatMessageProps) {
  const isChief = role === 'chief';

  return (
    <div className={cn('flex gap-3', isChief ? 'items-start' : 'items-start flex-row-reverse')}>
      {/* Avatar */}
      <div className={cn(
        'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
        isChief
          ? 'bg-amber-900/40 border border-amber-800/40'
          : 'bg-gray-800 border border-gray-700'
      )}>
        {isChief ? (
          <Shield className="w-4 h-4 text-amber-400" />
        ) : (
          <User className="w-4 h-4 text-gray-400" />
        )}
      </div>

      {/* Message */}
      <div className={cn(
        'max-w-[80%] rounded-xl px-4 py-3',
        isChief
          ? 'bg-gray-900 border border-gray-800'
          : 'bg-amber-900/20 border border-amber-800/30'
      )}>
        {isChief && (
          <p className="text-xs font-semibold text-amber-400 mb-1.5">Chief</p>
        )}
        <div className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
          {content}
          {isStreaming && (
            <span className="inline-block w-2 h-4 bg-amber-400/60 ml-1 animate-pulse" />
          )}
        </div>
      </div>
    </div>
  );
}
