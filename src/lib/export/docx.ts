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
  mission_date?: string | null;
  mission_type?: string | null;
  operation_name?: string | null;
  unit_designation?: string | null;
  location?: string | null;
  grid_reference?: string | null;
  training_event?: string | null;
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

export async function generateDocx(aar: AARData, unitName?: string): Promise<Buffer> {
  const formatDate = (d: string | null | undefined) => {
    if (!d) return 'N/A';
    return new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const sections = [
    { title: '1. What Was Planned? (Mission/Intent)', content: aar.what_was_planned },
    { title: '2. What Actually Happened? (Execution)', content: aar.what_happened },
    { title: '3. Why the Difference? (Root Causes)', content: aar.why_difference },
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

  // Unit name
  children.push(
    new Paragraph({
      children: [new TextRun({ text: unitName || 'AfterAction Army', size: 20, color: '6b7280' })],
      spacing: { after: 300 },
    }),
  );

  // Metadata table
  const metaLabels = ['Date', 'Mission Type', 'Unit', 'Location'];
  const metaValues = [
    formatDate(aar.mission_date),
    aar.mission_type || 'N/A',
    aar.unit_designation || 'N/A',
    [aar.location, aar.grid_reference].filter(Boolean).join(' / ') || 'N/A',
  ];

  const metaTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: metaLabels.map(
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
        children: metaValues.map(
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

  // Operation / training event row
  if (aar.operation_name || aar.training_event) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: 'Operation: ', bold: true, size: 18, color: '6b7280' }),
          new TextRun({ text: aar.operation_name || 'N/A', size: 18 }),
          new TextRun({ text: '   Training Event: ', bold: true, size: 18, color: '6b7280' }),
          new TextRun({ text: aar.training_event || 'N/A', size: 18 }),
        ],
        spacing: { before: 100, after: 200 },
      }),
    );
  }

  // Summary
  if (aar.summary) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: aar.summary, italics: true, size: 20, color: '166534' })],
        spacing: { before: 200, after: 200 },
        shading: { type: ShadingType.SOLID, color: 'f0fdf4' },
      }),
    );
  }

  // AAR Sections
  for (const section of sections) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: section.title, bold: true, size: 24, color: '4a6741' })],
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
        children: [new TextRun({ text: `Action Items (${aar.action_items.length})`, bold: true, size: 24, color: '4a6741' })],
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
