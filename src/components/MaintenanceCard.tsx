import React from 'react';

export default function MaintenanceCard({ counts }: { counts: { due: number; overdue: number } }) {
  return (
    <div className="p-4 border rounded">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-muted-foreground">Maintenance</div>
          <div className="text-2xl font-bold">{counts.due}</div>
          <div className="text-sm">Overdue: <span className="font-medium text-rose-600">{counts.overdue}</span></div>
        </div>
        <div>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8V4m0 0a4 4 0 110 8V4zM6 20h12" /></svg>
        </div>
      </div>
    </div>
  );
}
