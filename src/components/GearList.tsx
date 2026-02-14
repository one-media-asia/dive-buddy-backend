import React, { useState } from 'react';
import { useGearItems, createGearItem, getGearStock } from '@/hooks/useGear';

export default function GearList() {
  const { items, loading } = useGearItems();
  const [name, setName] = useState('');

  async function handleAdd() {
    if (!name) return;
    await createGearItem({ name });
    setName('');
    window.location.reload();
  }

  async function showStock(id: string) {
    const { data } = await getGearStock(id);
    alert(JSON.stringify(data ?? [], null, 2));
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-3">Gear Catalog</h2>
      <div className="mb-3">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="New gear name" className="input mr-2" />
        <button onClick={handleAdd} className="btn">Add</button>
      </div>
      {loading && <div>Loading…</div>}
      <div className="space-y-2">
        {items.map((it) => (
          <div key={it.id} className="p-3 border rounded flex justify-between">
            <div>
              <div className="font-medium">{it.name}</div>
              <div className="text-sm text-muted-foreground">{it.category}</div>
            </div>
            <div>
              <button onClick={() => showStock(it.id)} className="btn">Stock</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
