import { supabase } from '@/integrations/supabase/client';
import jsPDF from 'jspdf';

export interface Equipment {
  id: string;
  name: string;
  category: string;
  sku?: string;
  price: number;
  quantity_in_stock: number;
  reorder_level: number;
  supplier?: string;
  description?: string;
  barcode?: string;
  created_at: string;
  updated_at: string;
}

export interface TransactionItem {
  id: string;
  transaction_id: string;
  equipment_id: string;
  equipment_name?: string;
  category?: string;
  sku?: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface Transaction {
  id: string;
  transaction_number: string;
  diver_id?: string;
  diver_name?: string;
  diver_email?: string;
  booking_id?: string;
  booking_invoice?: string;
  type: string;
  status: string;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  notes?: string;
  items?: TransactionItem[];
  created_at: string;
}

export interface Payment {
  id: string;
  transaction_id: string;
  transaction_number: string;
  transaction_total: number;
  amount: number;
  payment_method: string;
  payment_status: string;
  reference_number?: string;
  notes?: string;
  created_at: string;
}

export interface POSSummary {
  today: {
    transaction_count: number;
    total_sales: number;
    total_paid: number;
    payment_count: number;
  };
  low_stock_items: Equipment[];
}

// Legacy Supabase functions
export async function fetchTopItems(days = 30, limit = 5) {
  const { data } = await supabase.rpc('pos_top_items', { days, limit_val: limit });
  return data || [];
}

// Equipment operations
export const equipment = {
  list: async () => {
    const response = await fetch('/api/equipment');
    const data = await response.json();
    return { data, error: null };
  },

  get: async (id: string) => {
    const response = await fetch(`/api/equipment/${id}`);
    const data = await response.json();
    return { data, error: null };
  },

  create: async (item: Partial<Equipment>) => {
    const response = await fetch('/api/equipment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
    const data = await response.json();
    return { data, error: null };
  },

  update: async (id: string, item: Partial<Equipment>) => {
    const response = await fetch(`/api/equipment/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
    const data = await response.json();
    return { data, error: null };
  },

  delete: async (id: string) => {
    const response = await fetch(`/api/equipment/${id}`, {
      method: 'DELETE',
    });
    const data = await response.json();
    return { data, error: null };
  },
};

// Transaction operations
export const transactions = {
  list: async () => {
    const response = await fetch('/api/transactions');
    const data = await response.json();
    return { data, error: null };
  },

  get: async (id: string) => {
    const response = await fetch(`/api/transactions/${id}`);
    const data = await response.json();
    return { data, error: null };
  },

  create: async (transaction: {
    diver_id?: string;
    booking_id?: string;
    items: Array<{ equipment_id: string; quantity: number; unit_price: number }>;
    tax?: number;
    discount?: number;
    notes?: string;
  }) => {
    const response = await fetch('/api/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(transaction),
    });
    const data = await response.json();
    return { data, error: null };
  },
};

// Payment operations
export const payments = {
  list: async () => {
    const response = await fetch('/api/payments');
    const data = await response.json();
    return { data, error: null };
  },

  create: async (payment: {
    transaction_id: string;
    amount: number;
    payment_method?: string;
    reference_number?: string;
    notes?: string;
  }) => {
    const response = await fetch('/api/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payment),
    });
    const data = await response.json();
    return { data, error: null };
  },
};

// POS summary
export const pos = {
  getSummary: async () => {
    const response = await fetch('/api/pos/summary');
    const data = await response.json();
    return { data, error: null };
  },
};

// Export functions
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

export default { fetchTopItems, exportToCSV, exportToPDF, equipment, transactions, payments, pos };
