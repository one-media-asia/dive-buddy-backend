import React from 'react';
import { createMaintenanceTask } from '@/hooks/useMaintenance';

export default function GearStockItem({ stock }: { stock: any }) {
  async function scheduleMaintenance() {
    const due = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();
    await createMaintenanceTask({ gear_stock_id: stock.id, due_at: due, notes: 'Scheduled via UI' });
    alert('Maintenance scheduled');
    window.location.reload();
  }

  return (
    <div className="p-3 border rounded">
      <div className="flex justify-between">
        <div>
          <div className="font-medium">{stock.serial_number ?? 'Unit'}</div>
          <div className="text-sm text-muted-foreground">Status: {stock.status}</div>
          <div className="text-sm text-muted-foreground">Last maintenance: {stock.last_maintenance_at ?? '—'}</div>
        </div>
        <div>
          <button onClick={scheduleMaintenance} className="btn">Schedule Maintenance</button>
        </div>
      </div>
    </div>
  );
}
