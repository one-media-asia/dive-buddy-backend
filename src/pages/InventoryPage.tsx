import React, { useEffect, useState } from 'react';
import GearList from '@/components/GearList';
import { getGearStock, createGearStock } from '@/hooks/useGear';
import GearStockItem from '@/components/GearStockItem';

export default function InventoryPage() {
  const [selected, setSelected] = useState<any | null>(null);
  const [stock, setStock] = useState<any[]>([]);

  useEffect(() => {
    if (!selected) return;
    (async () => {
      const { data } = await getGearStock(selected.id);
      setStock(data ?? []);
    })();
  }, [selected]);

  async function addStock() {
    if (!selected) return;
    await createGearStock({ gear_item_id: selected.id, serial_number: `SN-${Date.now()}` });
    const { data } = await getGearStock(selected.id);
    setStock(data ?? []);
  }

  return (
    <div className="grid grid-cols-3 gap-6">
      <div className="col-span-1">
        <GearList />
      </div>
      <div className="col-span-2">
        <h2 className="text-xl font-semibold mb-3">Stock</h2>
        {!selected && <div className="text-sm text-muted-foreground">Select a gear item to view stock (use Gear Catalog)</div>}
        {selected && (
          <div>
            <div className="mb-3 flex items-center justify-between">
              <div className="font-medium">{selected.name}</div>
              <div>
                <button onClick={addStock} className="btn">Add Unit</button>
              </div>
            </div>
            <div className="space-y-2">
              {stock.map((s) => <GearStockItem key={s.id} stock={s} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
