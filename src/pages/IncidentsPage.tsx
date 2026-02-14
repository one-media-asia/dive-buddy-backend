import React from 'react';
import useIncidents from '@/hooks/useIncidents';
import IncidentForm from '@/components/IncidentForm';

export default function IncidentsPage() {
  const { incidents, loading, resolveIncident } = useIncidents();

  async function handleCreated(inc: any) {
    // no-op, data is already prepended by hook
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Incidents</h1>
        <p className="page-description">Report incidents and view history</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-1 p-4 border rounded">
          <IncidentForm onCreated={handleCreated} />
        </div>
        <div className="col-span-2 p-4 border rounded">
          <h3 className="font-semibold mb-3">Recent Incidents</h3>
          {loading && <div>Loading…</div>}
          <div className="space-y-3">
            {incidents.map((i:any) => (
              <div key={i.id} className="p-3 border rounded">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="font-medium">{i.description}</div>
                    <div className="text-sm text-muted-foreground">Reported: {new Date(i.reported_at).toLocaleString()}</div>
                  </div>
                  <div className="text-sm capitalize">{i.severity}</div>
                </div>
                {i.actions_taken && <div className="text-sm mb-2"><strong>Actions:</strong> {JSON.stringify(i.actions_taken)}</div>}
                {i.resolved_at ? (
                  <div className="text-sm text-muted-foreground">Resolved: {new Date(i.resolved_at).toLocaleString()}</div>
                ) : (
                  <div><button className="btn" onClick={() => resolveIncident(i.id)}>Mark Resolved</button></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
