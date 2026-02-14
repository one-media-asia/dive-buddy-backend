import { supabase } from '@/integrations/supabase/client';
import jsPDF from 'jspdf';

export async function fetchTopItems(days = 30, limit = 5) {
  const { data } = await supabase.rpc('pos_top_items', { days, limit_val: limit });
  return data || [];
}

export function exportToCSV(rows: any[], filename = 'export.csv') {
  if (!rows || !rows.length) return;
  const keys = Object.keys(rows[0]);
  const csv = [keys.join(','), ...rows.map(r => keys.map(k => JSON.stringify(r[k] ?? '')).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function exportToPDF(title: string, rows: any[], filename = 'export.pdf') {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  doc.setFontSize(14);
  doc.text(title, 40, 40);
  doc.setFontSize(10);
  let y = 70;
  rows.forEach(r => {
    const line = Object.values(r).join(' | ');
    doc.text(line, 40, y);
    y += 16;
    if (y > 740) {
      doc.addPage();
      y = 40;
    }
  });
  doc.save(filename);
}

export default { fetchTopItems, exportToCSV, exportToPDF };
