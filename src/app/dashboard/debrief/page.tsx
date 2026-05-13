'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Send, Loader2, Mic, MicOff, CheckCircle } from 'lucide-react';
import { ChatMessage } from '@/components/debrief/ChatMessage';
import { LiveAAR } from '@/components/debrief/LiveAAR';
import { CHIEF_OPENING } from '@/lib/ai/chief';
import type { ConversationMessage, DebriefPhase, LiveAARState } from '@/types';

const EMPTY_AAR: LiveAARState = {
  what_was_planned: '',
  what_happened: '',
  why_difference: '',
  sustain_improve: '',
  summary: '',
  mission_type: '',
  tags: [],
  action_items: [],
};

export default function DebriefPage() {
  const router = useRouter();
  const [aarId, setAarId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [liveAAR, setLiveAAR] = useState<LiveAARState>(EMPTY_AAR);
  const [phase, setPhase] = useState<string>('opening');
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [listening, setListening] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Initialize: create AAR and show Chief's opening
  useEffect(() => {
    async function init() {
      const res = await fetch('/api/aar', { method: 'POST' });
      const { aar } = await res.json();
      setAarId(aar.id);

      // Chief's opening message
      const opening: ConversationMessage = {
        id: crypto.randomUUID(),
        role: 'chief',
        content: CHIEF_OPENING,
        timestamp: Date.now(),
        phase: 'opening',
      };
      setMessages([opening]);
    }
    init();
  }, []);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Voice input via Web Speech API
  const toggleVoice = useCallback(() => {
    if (listening && recognitionRef.current) {
      recognitionRef.current.stop();
      setListening(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice input is not supported in this browser. Try Chrome.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setInput((prev) => {
        // Replace interim results with final
        const lastResult = event.results[event.results.length - 1];
        if (lastResult.isFinal) {
          return prev + transcript + ' ';
        }
        return prev;
      });
    };

    recognition.onend = () => setListening(false);
    recognition.start();
    recognitionRef.current = recognition;
    setListening(true);
  }, [listening]);

  // Send message to Chief
  async function sendMessage() {
    if (!input.trim() || !aarId || sending) return;

    const userMsg: ConversationMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
      timestamp: Date.now(),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setSending(true);

    // Stop voice if active
    if (listening && recognitionRef.current) {
      recognitionRef.current.stop();
      setListening(false);
    }

    try {
      const res = await fetch('/api/debrief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aarId,
          message: userMsg.content,
          conversation: updatedMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        let fullResponse = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n').filter(Boolean);

          for (const line of lines) {
            try {
              const parsed = JSON.parse(line);

              if (parsed.type === 'text') {
                fullResponse = parsed.content;
              } else if (parsed.type === 'aar_update') {
                const update = parsed.content;

                // Update phase
                if (update.phase) setPhase(update.phase);

                // Merge AAR updates (progressively build the document)
                setLiveAAR((prev) => ({
                  what_was_planned: update.what_was_planned || prev.what_was_planned,
                  what_happened: update.what_happened || prev.what_happened,
                  why_difference: update.why_difference || prev.why_difference,
                  sustain_improve: update.sustain_improve || prev.sustain_improve,
                  summary: update.summary || prev.summary,
                  mission_type: update.mission_type || update.incident_type || prev.mission_type,
                  tags: update.tags?.length > 0 ? update.tags : prev.tags,
                  action_items: update.action_items?.length > 0 ? update.action_items : prev.action_items,
                }));

                if (update.is_complete) setIsComplete(true);
              }
            } catch {
              // Skip unparseable lines
            }
          }
        }

        // Add Chief's response
        if (fullResponse) {
          const chiefMsg: ConversationMessage = {
            id: crypto.randomUUID(),
            role: 'chief',
            content: fullResponse,
            timestamp: Date.now(),
            phase: phase as DebriefPhase,
          };
          setMessages((prev) => [...prev, chiefMsg]);
        }
      }
    } catch {
      // Add error message
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: 'chief', content: 'Sorry, I had a hiccup. Can you repeat that?', timestamp: Date.now() },
      ]);
    }

    setSending(false);
    inputRef.current?.focus();
  }

  // Finalize debrief
  async function finalize() {
    if (!aarId) return;
    setFinalizing(true);

    await fetch(`/api/aar/${aarId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...liveAAR,
        status: 'review',
        conversation: messages,
        action_items: liveAAR.action_items.map((ai) => ({
          description: ai.description,
          priority: ai.priority,
          assigned_to: ai.assigned_to,
          source_section: ai.source_section,
        })),
      }),
    });

    router.push(`/dashboard/${aarId}`);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      {/* LEFT: Conversation with Chief */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-gray-800">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <ChatMessage key={msg.id} role={msg.role} content={msg.content} />
          ))}
          {sending && (
            <ChatMessage role="chief" content="" isStreaming />
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="border-t border-gray-800 p-4">
          {isComplete && (
            <div className="mb-3 bg-green-950/20 border border-green-900/30 rounded-lg p-3 flex items-center justify-between">
              <p className="text-sm text-green-300">AAR complete. Ready to finalize?</p>
              <button onClick={finalize} disabled={finalizing}
                className="flex items-center gap-2 px-4 py-1.5 bg-green-700 hover:bg-green-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors">
                {finalizing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                {finalizing ? 'Saving...' : 'Finalize AAR'}
              </button>
            </div>
          )}

          <div className="flex gap-2">
            {/* Voice button */}
            <button onClick={toggleVoice}
              className={`p-3 rounded-lg border transition-colors shrink-0 ${
                listening
                  ? 'bg-red-900/30 border-red-800/50 text-red-400 animate-pulse'
                  : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-gray-200'
              }`}>
              {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            {/* Text input */}
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={listening ? 'Listening... speak naturally' : 'Talk to First Sergeant... (Enter to send, Shift+Enter for new line)'}
              rows={1}
              className="flex-1 px-4 py-3 bg-gray-900 border border-gray-800 rounded-lg text-sm text-gray-200 placeholder-gray-600 resize-none focus:outline-none focus:ring-2 focus:ring-green-500/40"
            />

            {/* Send button */}
            <button onClick={sendMessage} disabled={!input.trim() || sending}
              className="p-3 bg-green-700 hover:bg-green-600 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-lg transition-colors shrink-0">
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>

          {listening && (
            <p className="text-xs text-red-400 mt-2 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              Voice active — speak naturally, then press Send when ready
            </p>
          )}
        </div>
      </div>

      {/* RIGHT: Live AAR Document */}
      <div className="w-96 xl:w-[28rem] hidden lg:flex flex-col bg-gray-900/30">
        <LiveAAR aar={liveAAR} phase={phase} />
      </div>
    </div>
  );
}
