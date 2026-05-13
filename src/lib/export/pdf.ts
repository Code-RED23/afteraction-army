import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 11, fontFamily: 'Helvetica', color: '#1a1a1a' },
  header: { marginBottom: 20, borderBottomWidth: 2, borderBottomColor: '#4a6741', paddingBottom: 12 },
  title: { fontSize: 22, fontFamily: 'Helvetica-Bold', color: '#1a1a1a', marginBottom: 4 },
  subtitle: { fontSize: 10, color: '#6b7280' },
  metaRow: { flexDirection: 'row', gap: 16, marginBottom: 16, paddingVertical: 8, backgroundColor: '#f9fafb', padding: 10, borderRadius: 4 },
  metaItem: { flex: 1 },
  metaLabel: { fontSize: 8, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 },
  metaValue: { fontSize: 10, color: '#374151' },
  summaryBox: { backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0', borderRadius: 4, padding: 10, marginBottom: 16 },
  summaryText: { fontSize: 10, color: '#166534', lineHeight: 1.5 },
  section: { marginBottom: 14 },
  sectionTitle: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: '#4a6741', marginBottom: 6, paddingBottom: 4, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  sectionBody: { fontSize: 10, color: '#374151', lineHeight: 1.6 },
  actionHeader: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: '#4a6741', marginBottom: 8, paddingBottom: 4, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  actionItem: { flexDirection: 'row', marginBottom: 6, paddingVertical: 4, paddingHorizontal: 6, backgroundColor: '#f9fafb', borderRadius: 3 },
  actionPriority: { width: 50, fontSize: 8, textTransform: 'uppercase', fontFamily: 'Helvetica-Bold' },
  actionDesc: { flex: 1, fontSize: 10, color: '#374151' },
  actionAssigned: { width: 80, fontSize: 9, color: '#6b7280', textAlign: 'right' },
  footer: { position: 'absolute', bottom: 20, left: 40, right: 40, flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#e5e7eb', paddingTop: 8 },
  footerText: { fontSize: 8, color: '#9ca3af' },
});

const priorityColors: Record<string, string> = {
  high: '#dc2626',
  medium: '#d97706',
  low: '#6b7280',
};

interface AARDocumentProps {
  aar: {
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
  };
  unitName?: string;
}

export function AARDocument({ aar, unitName }: AARDocumentProps) {
  const sections = [
    { title: '1. What Was Planned? (Mission/Intent)', content: aar.what_was_planned },
    { title: '2. What Actually Happened? (Execution)', content: aar.what_happened },
    { title: '3. Why the Difference? (Root Causes)', content: aar.why_difference },
    { title: '4. Sustain / Improve', content: aar.sustain_improve },
  ];

  const formatDate = (d: string | null | undefined) => {
    if (!d) return 'N/A';
    return new Date(d).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  return React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: 'LETTER', style: styles.page },
      // Header
      React.createElement(
        View,
        { style: styles.header },
        React.createElement(Text, { style: styles.title }, 'After Action Review'),
        React.createElement(Text, { style: styles.subtitle }, unitName || 'AfterAction Army'),
      ),
      // Metadata row 1
      React.createElement(
        View,
        { style: styles.metaRow },
        React.createElement(
          View,
          { style: styles.metaItem },
          React.createElement(Text, { style: styles.metaLabel }, 'Date'),
          React.createElement(Text, { style: styles.metaValue }, formatDate(aar.mission_date)),
        ),
        React.createElement(
          View,
          { style: styles.metaItem },
          React.createElement(Text, { style: styles.metaLabel }, 'Mission Type'),
          React.createElement(Text, { style: styles.metaValue }, aar.mission_type || 'N/A'),
        ),
        React.createElement(
          View,
          { style: styles.metaItem },
          React.createElement(Text, { style: styles.metaLabel }, 'Unit'),
          React.createElement(Text, { style: styles.metaValue }, aar.unit_designation || 'N/A'),
        ),
        React.createElement(
          View,
          { style: styles.metaItem },
          React.createElement(Text, { style: styles.metaLabel }, 'Location / Grid'),
          React.createElement(Text, { style: styles.metaValue }, [aar.location, aar.grid_reference].filter(Boolean).join(' / ') || 'N/A'),
        ),
      ),
      // Metadata row 2 (if applicable)
      (aar.operation_name || aar.training_event)
        ? React.createElement(
            View,
            { style: { ...styles.metaRow, marginTop: -8 } },
            React.createElement(
              View,
              { style: styles.metaItem },
              React.createElement(Text, { style: styles.metaLabel }, 'Operation'),
              React.createElement(Text, { style: styles.metaValue }, aar.operation_name || 'N/A'),
            ),
            React.createElement(
              View,
              { style: styles.metaItem },
              React.createElement(Text, { style: styles.metaLabel }, 'Training Event'),
              React.createElement(Text, { style: styles.metaValue }, aar.training_event || 'N/A'),
            ),
          )
        : null,
      // Summary
      aar.summary
        ? React.createElement(
            View,
            { style: styles.summaryBox },
            React.createElement(Text, { style: styles.summaryText }, aar.summary),
          )
        : null,
      // Sections
      ...sections.map((s) =>
        React.createElement(
          View,
          { key: s.title, style: styles.section },
          React.createElement(Text, { style: styles.sectionTitle }, s.title),
          React.createElement(Text, { style: styles.sectionBody }, s.content || 'No content recorded.'),
        ),
      ),
      // Action Items
      aar.action_items && aar.action_items.length > 0
        ? React.createElement(
            View,
            { style: styles.section },
            React.createElement(Text, { style: styles.actionHeader }, `Action Items (${aar.action_items.length})`),
            ...aar.action_items.map((item, i) =>
              React.createElement(
                View,
                { key: i, style: styles.actionItem },
                React.createElement(
                  Text,
                  { style: { ...styles.actionPriority, color: priorityColors[item.priority] || '#6b7280' } },
                  item.priority,
                ),
                React.createElement(Text, { style: styles.actionDesc }, item.description),
                React.createElement(Text, { style: styles.actionAssigned }, item.assigned_to || ''),
              ),
            ),
          )
        : null,
      // Footer
      React.createElement(
        View,
        { style: styles.footer, fixed: true },
        React.createElement(Text, { style: styles.footerText }, `Generated by AfterAction Army`),
        React.createElement(Text, { style: styles.footerText }, new Date().toLocaleDateString()),
      ),
    ),
  );
}
