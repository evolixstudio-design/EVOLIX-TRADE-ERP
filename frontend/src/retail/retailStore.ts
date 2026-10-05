/**
 * EVOLIX Retail V1 — Retail State Store
 * 
 * IMPORTANT: This store contains MOCK DATA and TEMPORARY UI logic
 * to allow UI testing while backend endpoints are being built.
 * DO NOT implement permanent ERP business logic (like stock posting,
 * ledger updates, or accounting entries) in this file.
 * The backend is the single source of truth.
 * 
 * Uses Zustand for simple, performant UI state management.
 */
import { create } from 'zustand';

// ── Types ──────────────────────────────────────────────

export interface RetailItem {
  id: string;
  name: string;
  sku: string;
  selling_price: number;
  purchase_price: number;
  mrp?: number;
  current_stock: number;
  unit: string;
  category?: string;
  barcode?: string;
  hsn?: string;
  gst_rate?: number;
  low_stock_threshold?: number;
  active: boolean;
}

export interface BillLineItem {
  item_id: string;
  name: string;
  rate: number;
  quantity: number;
  discount_amount: number;
  unit: string;
  total: number;
}

export interface Customer {
  id: string;
  name: string;
  mobile?: string;
  gstin?: string;
  address?: string;
  balance: number; // positive = they owe us
}

export interface PaymentSplit {
  method: 'CASH' | 'UPI' | 'BANK';
  amount: number;
}

export interface CompletedSale {
  invoice_number: string;
  amount: number;
  payment_mode: string;
  customer_name: string;
  items_count: number;
  timestamp: Date;
}

export interface KhataTransaction {
  id: string;
  type: 'sale' | 'payment' | 'return';
  amount: number;
  date: string;
  description: string;
  running_balance: number;
}

// ── Bill Store ─────────────────────────────────────────

interface BillState {
  items: BillLineItem[];
  customer: Customer | null;
  discount: number;
  addItem: (item: RetailItem, qty?: number) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, qty: number) => void;
  updateDiscount: (itemId: string, discount: number) => void;
  setCustomer: (customer: Customer | null) => void;
  setBillDiscount: (discount: number) => void;
  getSubtotal: () => number;
  getTotal: () => number;
  getItemCount: () => number;
  clearBill: () => void;
}

export const useBillStore = create<BillState>((set, get) => ({
  items: [],
  customer: null,
  discount: 0,

  addItem: (item, qty = 1) => {
    if (item.current_stock <= 0) return; // Prevent adding out-of-stock items
    set((state) => {
      const existing = state.items.find((i) => i.item_id === item.id);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.item_id === item.id
              ? { ...i, quantity: i.quantity + qty, total: (i.quantity + qty) * i.rate - i.discount_amount }
              : i
          ),
        };
      }
      const newItem: BillLineItem = {
        item_id: item.id,
        name: item.name,
        rate: item.selling_price,
        quantity: qty,
        discount_amount: 0,
        unit: item.unit || 'PCS',
        total: item.selling_price * qty,
      };
      return { items: [...state.items, newItem] };
    });
  },

  removeItem: (itemId) => {
    set((state) => ({ items: state.items.filter((i) => i.item_id !== itemId) }));
  },

  updateQuantity: (itemId, qty) => {
    if (qty <= 0) {
      get().removeItem(itemId);
      return;
    }
    set((state) => ({
      items: state.items.map((i) =>
        i.item_id === itemId
          ? { ...i, quantity: qty, total: qty * i.rate - i.discount_amount }
          : i
      ),
    }));
  },

  updateDiscount: (itemId, discount) => {
    set((state) => ({
      items: state.items.map((i) =>
        i.item_id === itemId
          ? { ...i, discount_amount: discount, total: i.quantity * i.rate - discount }
          : i
      ),
    }));
  },

  setCustomer: (customer) => set({ customer }),

  setBillDiscount: (discount) => set({ discount }),

  getSubtotal: () => {
    return get().items.reduce((sum, i) => sum + i.quantity * i.rate, 0);
  },

  getTotal: () => {
    const subtotal = get().items.reduce((sum, i) => sum + i.total, 0);
    return Math.max(0, subtotal - get().discount);
  },

  getItemCount: () => {
    return get().items.reduce((sum, i) => sum + i.quantity, 0);
  },

  clearBill: () => set({ items: [], customer: null, discount: 0 }),
}));

// ── Sale Completion Store ──────────────────────────────

interface SaleCompleteState {
  completedSale: CompletedSale | null;
  setCompletedSale: (sale: CompletedSale) => void;
  clearCompletedSale: () => void;
}

export const useSaleCompleteStore = create<SaleCompleteState>((set) => ({
  completedSale: null,
  setCompletedSale: (sale) => set({ completedSale: sale }),
  clearCompletedSale: () => set({ completedSale: null }),
}));

// ── MOCK DATA (TEMPORARY until APIs are ready) ─────────
// (Removed DEMO_ITEMS, DEMO_CUSTOMERS, DEMO_KHATA_TRANSACTIONS in favor of actual API calls)

