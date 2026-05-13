import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth';
import { createServiceClient } from '@/lib/supabase/server';
import React from 'react';

export async function GET(req: NextRequest, { params }: { params: Promise<{ aarId: string }> }) {
  try {
    const ctx = await getAuthContext();
    const { aarId } = await params;
    const supabase = createServiceClient();

    const { data: aar } = await supabase
      .from('aars')
      .select('*, action_items(*)')
      .eq('id', aarId)
      .eq('platoon_id', ctx.platoonId)
      .single();

    if (!aar) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const { data: platoon } = await supabase.from('platoons').select('name').eq('id', ctx.platoonId).single();

    const format = req.nextUrl.searchParams.get('format') || 'pdf';

    if (format === 'docx') {
      const { generateDocx } = await import('@/lib/export/docx');
      const buffer = await generateDocx(aar, platoon?.name);
      return new Response(new Uint8Array(buffer), {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'Content-Disposition': `attachment; filename="AAR-${aarId.slice(0, 8)}.docx"`,
        },
      });
    }

    // PDF
    const { renderToBuffer } = await import('@react-pdf/renderer');
    const { AARDocument } = await import('@/lib/export/pdf');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const element = React.createElement(AARDocument, { aar, unitName: platoon?.name });
    const buffer = await renderToBuffer(element as any);
    return new Response(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="AAR-${aarId.slice(0, 8)}.pdf"`,
      },
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Export failed' }, { status: 500 });
  }
}
