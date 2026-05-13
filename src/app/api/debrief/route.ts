import { NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase/server';
import { CHIEF_SYSTEM_PROMPT } from '@/lib/ai/chief';
import Anthropic from '@anthropic-ai/sdk';

function getAnthropic() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

export const maxDuration = 120;

// POST /api/debrief — Send a message to Chief and get streaming response
export async function POST(req: Request) {
  try {
    const ctx = await getAuthContext();
    const { aarId, message, conversation } = await req.json();

    const supabase = createServiceClient();

    // Verify AAR belongs to this agency
    const { data: aar } = await supabase
      .from('aars')
      .select('id, agency_id')
      .eq('id', aarId)
      .eq('agency_id', ctx.agencyId)
      .single();

    if (!aar) {
      return NextResponse.json({ error: 'AAR not found' }, { status: 404 });
    }

    // Find similar past AARs for institutional memory
    let similarContext = '';
    try {
      const { data: pastAARs } = await supabase
        .from('aars')
        .select('summary, incident_type, incident_date, what_was_planned, sustain_improve')
        .eq('agency_id', ctx.agencyId)
        .eq('status', 'final')
        .order('created_at', { ascending: false })
        .limit(5);

      if (pastAARs && pastAARs.length > 0) {
        similarContext = '\n\n## RECENT AGENCY AARS (for institutional memory):\n' +
          pastAARs.map((p, i) =>
            `${i + 1}. [${p.incident_date || 'undated'}] ${p.incident_type || 'Incident'}: ${p.summary || 'No summary'}\n   Key lesson: ${p.sustain_improve?.slice(0, 200) || 'N/A'}`
          ).join('\n');
      }
    } catch {
      // Ignore — institutional memory is a nice-to-have
    }

    // Build Claude messages from conversation history
    const claudeMessages = conversation.map((msg: { role: string; content: string }) => ({
      role: msg.role === 'chief' ? 'assistant' : 'user',
      content: msg.content,
    }));

    // Add the new user message
    claudeMessages.push({ role: 'user', content: message });

    const anthropic = getAnthropic();

    // Stream response from Claude
    const stream = anthropic.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: CHIEF_SYSTEM_PROMPT + similarContext,
      messages: claudeMessages,
    });

    // Convert to ReadableStream for the client
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          const response = await stream.finalMessage();
          const fullText = response.content
            .filter((block): block is Anthropic.TextBlock => block.type === 'text')
            .map((block) => block.text)
            .join('');

          // Parse the response: conversation part + AAR update
          const [conversationPart, aarUpdatePart] = fullText.split('---AAR_UPDATE---');

          // Send conversation text as stream
          controller.enqueue(encoder.encode(JSON.stringify({
            type: 'text',
            content: conversationPart?.trim() || fullText,
          }) + '\n'));

          // Send AAR update if present
          if (aarUpdatePart) {
            try {
              const aarUpdate = JSON.parse(aarUpdatePart.trim());
              controller.enqueue(encoder.encode(JSON.stringify({
                type: 'aar_update',
                content: aarUpdate,
              }) + '\n'));
            } catch {
              // If JSON parsing fails, just skip the AAR update
            }
          }

          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
