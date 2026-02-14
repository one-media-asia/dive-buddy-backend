import React from 'react';

export default function TopSelling({ items }: { items: any[] }) {
  return (
    <div className="p-4 border rounded">
      <h3 className="font-semibold mb-2">Top Selling Items</h3>
      <ul className="space-y-2">
        {items && items.length ? items.map((it:any, idx:number) => (
          <li key={idx} className="flex justify-between">
            <div>{it.item}</div>
            <div className="text-sm text-muted-foreground">Qty: {it.quantity} — ${Number(it.revenue || 0).toFixed(2)}</div>
          </li>
        )) : <li className="text-sm text-muted-foreground">No sales yet</li>}
      </ul>
    </div>
  );
}
