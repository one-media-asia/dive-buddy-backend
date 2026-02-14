import React from 'react';
import { useMaintenanceTasks, completeMaintenanceTask } from '@/hooks/useMaintenance';

export default function MaintenancePage() {
  const { tasks, loading } = useMaintenanceTasks();

  async function handleComplete(id: string) {
    await completeMaintenanceTask(id);
    window.location.reload();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Maintenance Tasks</h1>
      {loading && <div>Loading…</div>}
      <div className="space-y-3">
        {tasks.map((t) => (
          <div key={t.id} className="p-3 border rounded">
            <div className="flex justify-between">
              <div>
                <div className="font-medium">{t.gear_stock?.serial_number ?? 'Unit'}</div>
                <div className="text-sm text-muted-foreground">Due: {new Date(t.due_at).toLocaleString()}</div>
                <div className="text-sm">Status: {t.status}</div>
              </div>
              <div>
                {t.status !== 'completed' && <button onClick={() => handleComplete(t.id)} className="btn primary">Mark Completed</button>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
