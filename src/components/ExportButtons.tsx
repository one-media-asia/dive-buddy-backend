import React from 'react';
import { exportToCSV, exportToPDF } from '@/hooks/usePOS';

export default function ExportButtons({ rows, title }: { rows: any[]; title: string }) {
  return (
    <div className="flex gap-2">
      <button className="btn" onClick={() => exportToCSV(rows, `${title.replace(/\s+/g,'_')}.csv`)}>Export CSV</button>
      <button className="btn" onClick={() => exportToPDF(title, rows, `${title.replace(/\s+/g,'_')}.pdf`)}>Export PDF</button>
    </div>
  );
}
