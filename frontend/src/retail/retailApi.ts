/**
 * EVOLIX Retail V1 — API Abstraction Layer
 * 
 * This file serves as the bridge between the simple Retail UI
 * and the complex ERP backend. 
 * 
 * DO NOT calculate accounting or stock logic here. 
 * Pass actions to the backend which acts as the single source of truth.
 */
import axios from 'axios';

// TODO: Replace with your actual configured axios instance from EVOLIX common utils
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
});

// ── TYPES ─────────────────────────────────────────────────────────
export interface RetailItem {
  id: string;
  name: string;
  sku: string;
  selling_price: number;
  purchase_price: number;
  unit: string;
  current_stock: number;
  barcode?: string;
  low_stock_threshold?: number;
  active: boolean;
}

export interface RetailCustomer {
  id: string;
  name: string;
  mobile?: string;
  outstanding_amount: number;
  active: boolean;
}

export interface RetailKhataTransaction {
  id: string;
  type: 'SALE' | 'PAYMENT' | 'PURCHASE';
  date: string;
  amount: number;
  balance_after: number;
  reference: string;
  reference_id?: string;
  attachment?: { id: string } | null;
}

export interface RetailSupplier {
  id: string;
  name: string;
  mobile?: string;
  outstanding_amount: number;
  active: boolean;
}

export interface RetailPurchase {
  id: string;
  document_number: string;
  document_date: string;
  grand_total: number;
  outstanding_amount: number;
  party: { id: string; name: string };
  status: string;
  attachment?: { id: string } | null;
}

export interface RetailNeed {
  id: string;
  name: string;
  quantity: number;
  priority: string;
  status: string;
  customer?: { name: string };
  preferred_supplier?: { name: string };
  attachment?: { id: string } | null;
}

/**
 * ── BILLING / POS ───────────────────────────────────────────────
 */

export const posApi = {
  lookupBarcode: async (sku: string) => {
    // Maps to: GET /api/v1/erp/pos/barcode/:sku
    return api.get(`/erp/pos/barcode/${sku}`);
  },

  postSale: async (payload: {
    items: Array<{ item_id: string; quantity: number; rate: number; discount_amount: number }>;
    customer_id?: string;
    payment_splits: Array<{ method: string; amount: number }>;
    total_amount: number;
    discount: number;
  }) => {
    // Maps to: POST /api/v1/erp/pos/sale
    return api.post('/erp/pos/sale', payload);
  },
  
  holdBill: async (branchId: string, items: any[]) => {
    // Maps to: POST /api/v1/erp/pos/held-bills
    return api.post('/erp/pos/held-bills', { branch_id: branchId, items });
  }
};

/**
 * ── ITEMS & STOCK ───────────────────────────────────────────────
 * 
 * Note: While /inventory/stock exists, basic CRUD for Items
 * requires new backend endpoints (e.g. /api/v1/items).
 */

export const itemApi = {
  getStock: async () => {
    // Maps to: GET /api/v1/inventory/stock
    return api.get('/inventory/stock');
  },

  getItems: async (search?: string) => {
    // Maps to: GET /api/v1/retail/items
    const params = search ? { search } : {};
    return api.get<{ data: RetailItem[] }>('/retail/items', { params });
  },

  createItem: async (payload: { name: string; selling_price: number; opening_stock?: number; [key: string]: any }) => {
    // Maps to: POST /api/v1/retail/items
    return api.post<{ data: RetailItem }>('/retail/items', payload);
  }
};

/**
 * ── CUSTOMERS & KHATA ───────────────────────────────────────────
 * 
 * Note: Customer creation and simple payments require dedicated
 * Retail endpoints to hide complex ERP voucher/ledger logic.
 */

export const khataApi = {
  getOutstanding: async (partyId: string) => {
    // Maps to: GET /api/v1/accounting/parties/:id/outstanding
    return api.get(`/accounting/parties/${partyId}/outstanding`);
  },

  getCustomers: async (search?: string) => {
    // Maps to: GET /api/v1/retail/customers
    const params = search ? { search } : {};
    return api.get<{ data: RetailCustomer[] }>('/retail/customers', { params });
  },

  createCustomer: async (payload: { name: string; mobile?: string }) => {
    // Maps to: POST /api/v1/retail/customers
    return api.post<{ data: RetailCustomer }>('/retail/customers', payload);
  },

  receivePayment: async (partyId: string, payload: { amount: number; payment_method: string; note?: string }) => {
    // Maps to: POST /api/v1/retail/customers/:id/payments
    return api.post(`/retail/customers/${partyId}/payments`, payload);
  },
  
  getTimeline: async (partyId: string) => {
    // Maps to: GET /api/v1/retail/customers/:id/khata
    return api.get<{ data: { customer: RetailCustomer; balance: number; transactions: RetailKhataTransaction[] } }>(`/retail/customers/${partyId}/khata`);
  }
};

/**
 * ── SUPPLIERS & KHATA (PHASE 2) ─────────────────────────────────
 */
export const supplierApi = {
  getSuppliers: async (search?: string) => {
    const params = search ? { search } : {};
    return api.get<{ data: RetailSupplier[] }>('/retail/suppliers', { params });
  },

  createSupplier: async (payload: { name: string; mobile?: string }) => {
    return api.post<{ data: RetailSupplier }>('/retail/suppliers', payload);
  },

  paySupplier: async (partyId: string, payload: { amount: number; payment_method: string; note?: string }) => {
    return api.post(`/retail/suppliers/${partyId}/payments`, payload);
  },

  getTimeline: async (partyId: string) => {
    return api.get<{ data: { supplier: RetailSupplier; balance: number; transactions: RetailKhataTransaction[] } }>(`/retail/suppliers/${partyId}/khata`);
  }
};

/**
 * ── PURCHASES (PHASE 2) ─────────────────────────────────────────
 */
export const purchaseApi = {
  getPurchases: async () => {
    return api.get<{ data: RetailPurchase[] }>('/retail/purchases');
  },

  createPurchase: async (payload: any) => {
    return api.post<{ data: RetailPurchase }>('/retail/purchases', payload);
  }
};

/**
 * ── NEED LIST (PHASE 2) ─────────────────────────────────────────
 */
export const needListApi = {
  getNeeds: async () => {
    return api.get<{ data: RetailNeed[] }>('/retail/needs');
  },

  createNeed: async (payload: any) => {
    return api.post<{ data: RetailNeed }>('/retail/needs', payload);
  },

  updateNeedStatus: async (id: string, status: string) => {
    return api.post(`/retail/needs/${id}/status`, { status });
  }
};

/**
 * ── DASHBOARD ───────────────────────────────────────────────────
 */

export const dashboardApi = {
  getDashboard: async () => {
    // Maps to: GET /api/v1/retail/home
    return api.get('/retail/home');
  }
};

/**
 * -- EXPENSES (PHASE 3) -------------------------------------------
 */
export const expenseApi = {
  getExpenses: async (params?: any) => {
    return api.get('/retail/expenses', { params });
  },

  getSummary: async () => {
    return api.get('/retail/expenses/summary');
  },

  createExpense: async (payload: any) => {
    return api.post('/retail/expenses', payload);
  },

  cancelExpense: async (id: string) => {
    return api.delete(`/retail/expenses/${id}`);
  },

  getCategories: async () => {
    return api.get('/retail/expense-categories');
  },

  createCategory: async (payload: { name: string; icon?: string }) => {
    return api.post('/retail/expense-categories', payload);
  }
};
