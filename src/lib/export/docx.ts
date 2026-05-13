import {
  Document,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  HeadingLevel,
  BorderStyle,
  ShadingType,
  Packer,
} from 'docx';

interface AARData {
  summary?: string | null;
  incident_date?: string | null;
  incident_type?: string | null;
  unit?: string | null;
  location?: string | null;
  status?: string;
  what_was_planned?: string | null;
  what_happened?: string | null;
  why_difference?: string | null;
  sustain_improve?: string | null;
  action_items?: {
    description: string;
    priority: string;
    assigned_to?: string | null;
    status?: string;
  }[];
}

export async function generateDocx(aar: AARData, agencyName?: string): Promise<Buffer> {
  const formatDate = (d: string | null | undefined) => {
    if (!d) return 'N/A';
    return new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  const sections = [
    { title: '1. What Was Planned?', content: aar.what_was_planned },
    { title: '2. What Actually Happened?', content: aar.what_happened },
    { title: '3. Why the Difference?', content: aar.why_difference },
    { title: '4. Sustain / Improve', content: aar.sustain_improve },
  ];

  const children: Paragraph[] = [];

  // Title
  children.push(
    new Paragraph({
      children: [new TextRun({ text: 'After Action Review', bold: true, size: 36, color: '1a1a1a' })],
      heading: HeadingLevel.TITLE,
      spacing: { after: 100 },
    }),
  );

  // Agency name
  children.push(
    new Paragraph({
      children: [new TextRun({ text: agencyName || 'AfterAction AI', size: 20, color: '6b7280' })],
      spacing: { after: 300 },
    }),
  );

  // Metadata table
  const metaTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: ['Date', 'Type', 'Unit', 'Location'].map(
          (label) =>
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: label, bold: true, size: 16, color: '9ca3af' })] })],
              width: { size: 25, type: WidthType.PERCENTAGE },
              shading: { type: ShadingType.SOLID, color: 'f3f4f6' },
              borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
            }),
        ),
      }),
      new TableRow({
        children: [
          formatDate(aar.incident_date),
          aar.incident_type || 'N/A',
          aar.unit || 'N/A',
          aar.location || 'N/A',
        ].map(
          (value) =>
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: value, size: 20 })] })],
              width: { size: 25, type: WidthType.PERCENTAGE },
              borders: { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } },
            }),
        ),
      }),
    ],
  });

  children.push(new Paragraph({ children: [] }));

  // Summary
  if (aar.summary) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: aar.summary, italics: true, size: 20, color: '92400e' })],
        spacing: { before: 200, after: 200 },
        shading: { type: ShadingType.SOLID, color: 'fffbeb' },
      }),
    );
  }

  // AAR Sections
  for (const section of sections) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: section.title, bold: true, size: 24, color: 'b45309' })],
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 100 },
      }),
    );
    children.push(
      new Paragraph({
        children: [new TextRun({ text: section.content || 'No content recorded.', size: 20, color: '374151' })],
        spacing: { after: 200 },
      }),
    );
  }

  // Action Items
  if (aar.action_items && aar.action_items.length > 0) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: `Action Items (${aar.action_items.length})`, bold: true, size: 24, color: 'b45309' })],
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 100 },
      }),
    );

    const actionTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: ['Priority', 'Description', 'Assigned To', 'Status'].map(
            (label) =>
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: label, bold: true, size: 18 })], alignment: AlignmentType.LEFT })],
                shading: { type: ShadingType.SOLID, color: 'f3f4f6' },
              }),
          ),
        }),
        ...aar.action_items.map(
          (item) =>
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: item.priority.toUpperCase(), size: 18, bold: true, color: item.priority === 'high' ? 'dc2626' : item.priority === 'medium' ? 'd97706' : '6b7280' })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: item.description, size: 18 })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: item.assigned_to || '', size: 18, color: '6b7280' })] })] }),
                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: item.status || 'open', size: 18 })] })] }),
              ],
            }),
        ),
      ],
    });

    children.push(new Paragraph({ children: [] }));
    // Action table added separately
    const doc = new Document({
      sections: [{ children: [...children, metaTable, new Paragraph({ children: [] }), actionTable] }],
    });
    return Buffer.from(await Packer.toBuffer(doc));
  }

  const doc = new Document({
    sections: [{ children: [...children.slice(0, 2), metaTable, ...children.slice(2)] }],
  });
  return Buffer.from(await Packer.toBuffer(doc));
}
