import { PrismaService } from '../database/prisma.service';
import { IntelligenceContext, IntelligenceResponse, IntentContract } from './interfaces';

// Helper to create an unimplemented intent
const createUnimplementedIntent = (intentCode: string, requiredPermission: string, missingDependency: string): IntentContract => ({
  intentCode,
  displayName: intentCode.replace(/_/g, ' '),
  description: `Resolves ${intentCode}`,
  requiredPermission,
  authoritativeDataSource: 'N/A',
  handle: async (context: IntelligenceContext): Promise<IntelligenceResponse> => ({
    intent: intentCode,
    success: false,
    generatedAt: new Date().toISOString(),
    error: 'NOT_IMPLEMENTABLE_YET',
    missing_dependency: missingDependency
  })
});

export const getIntents = (prisma: PrismaService): IntentContract[] => [
  createUnimplementedIntent('SALES_TODAY', 'sales.read', 'Sales Module (SalesInvoice)'),
  createUnimplementedIntent('SALES_PERIOD', 'sales.read', 'Sales Module (SalesInvoice)'),
  createUnimplementedIntent('CUSTOMER_OUTSTANDING', 'sales.read', 'Sales Module (SalesInvoice / BillAllocation)'),
  createUnimplementedIntent('CUSTOMER_OUTSTANDING_DETAIL', 'sales.read', 'Sales Module (SalesInvoice / BillAllocation)'),
  createUnimplementedIntent('LOW_STOCK', 'inventory.read', 'Inventory Module (Reorder levels)'),
  createUnimplementedIntent('CASH_BALANCE', 'accounting.read', 'Accounting Module (Cash Ledger)'),
  createUnimplementedIntent('BANK_BALANCE', 'accounting.read', 'Accounting Module (Bank Ledger)'),
  createUnimplementedIntent('TOP_SELLING_ITEMS', 'sales.read', 'Sales Module (SalesInvoiceLines)'),
  createUnimplementedIntent('SALES_RETURN_SUMMARY', 'sales.read', 'Sales Returns Module'),
  createUnimplementedIntent('EXPENSE_SUMMARY', 'accounting.read', 'Accounting Module (Expense Vouchers)'),
  createUnimplementedIntent('PROFIT_SUMMARY', 'accounting.read', 'Accounting/Sales Modules'),
  createUnimplementedIntent('STOCK_VALUE', 'inventory.read', 'Inventory Valuation Module'),

  {
    intentCode: 'OPEN_PURCHASE_ORDERS',
    displayName: 'Open Purchase Orders',
    description: 'Shows total value and count of open purchase orders',
    requiredPermission: 'purchasing.read',
    authoritativeDataSource: 'PurchaseOrder',
    handle: async (context: IntelligenceContext): Promise<IntelligenceResponse> => {
      const orders = await prisma.purchaseOrder.findMany({
        where: {
          company_id: context.organizationId,
          ...(context.branchId ? { branch_id: context.branchId } : {}),
          status: { in: ['CONFIRMED', 'PARTIALLY_RECEIVED'] }
        },
        include: { party: true }
      });

      const totalValue = orders.reduce((sum, o) => sum + Number(o.total), 0);

      return {
        intent: 'OPEN_PURCHASE_ORDERS',
        success: true,
        answer: {
          headline: 'Open Purchase Orders',
          value: totalValue.toFixed(2),
          currency: 'KWD', // Assuming KWD based on docs
          summary: `${orders.length} open orders pending receipt.`
        },
        sources: orders.map(o => ({
          type: 'PurchaseOrder',
          id: o.id,
          reference: o.document_number,
          label: `PO to ${o.party.name} for ${Number(o.total).toFixed(2)}`
        })),
        scope: { organizationId: context.organizationId, branchId: context.branchId },
        generatedAt: new Date().toISOString()
      };
    }
  },

  {
    intentCode: 'PENDING_RECEIPTS',
    displayName: 'Pending Receipts',
    description: 'Shows items pending receipt',
    requiredPermission: 'purchasing.read',
    authoritativeDataSource: 'PurchaseOrderLine',
    handle: async (context: IntelligenceContext): Promise<IntelligenceResponse> => {
      const lines = await prisma.purchaseOrderLine.findMany({
        where: {
          purchase_order: {
            company_id: context.organizationId,
            ...(context.branchId ? { branch_id: context.branchId } : {}),
            status: { in: ['CONFIRMED', 'PARTIALLY_RECEIVED'] }
          }
        },
        include: { item: true, purchase_order: true }
      });

      const pendingLines = lines.filter(l => Number(l.ordered_quantity) > Number(l.received_quantity));
      const totalPendingQty = pendingLines.reduce((sum, l) => sum + (Number(l.ordered_quantity) - Number(l.received_quantity)), 0);

      return {
        intent: 'PENDING_RECEIPTS',
        success: true,
        answer: {
          headline: 'Pending Receipts',
          value: totalPendingQty.toFixed(2),
          summary: `${pendingLines.length} item lines pending receipt.`
        },
        sources: pendingLines.map(l => ({
          type: 'PurchaseOrderLine',
          id: l.id,
          reference: l.purchase_order.document_number,
          label: `${l.item.name} (${Number(l.ordered_quantity) - Number(l.received_quantity)} pending)`
        })),
        scope: { organizationId: context.organizationId, branchId: context.branchId },
        generatedAt: new Date().toISOString()
      };
    }
  },

  {
    intentCode: 'SUPPLIER_OUTSTANDING',
    displayName: 'Supplier Outstanding',
    description: 'Shows total amount owed to suppliers',
    requiredPermission: 'purchasing.read',
    authoritativeDataSource: 'PurchaseInvoice',
    handle: async (context: IntelligenceContext): Promise<IntelligenceResponse> => {
      const invoices = await prisma.purchaseInvoice.findMany({
        where: {
          company_id: context.organizationId,
          ...(context.branchId ? { branch_id: context.branchId } : {}),
          status: 'POSTED',
          outstanding_amount: { gt: 0 }
        },
        include: { party: true }
      });

      const totalOutstanding = invoices.reduce((sum, inv) => sum + Number(inv.outstanding_amount), 0);

      return {
        intent: 'SUPPLIER_OUTSTANDING',
        success: true,
        answer: {
          headline: 'Total Payable',
          value: totalOutstanding.toFixed(2),
          currency: 'KWD',
          summary: `${invoices.length} unpaid invoices.`
        },
        sources: invoices.map(inv => ({
          type: 'PurchaseInvoice',
          id: inv.id,
          reference: inv.document_number,
          label: `Invoice from ${inv.party.name} (Owe ${Number(inv.outstanding_amount).toFixed(2)})`
        })),
        scope: { organizationId: context.organizationId, branchId: context.branchId },
        generatedAt: new Date().toISOString()
      };
    }
  },

  {
    intentCode: 'PURCHASE_SUMMARY',
    displayName: 'Purchase Summary',
    description: 'Summarizes posted purchase invoices',
    requiredPermission: 'purchasing.read',
    authoritativeDataSource: 'PurchaseInvoice',
    handle: async (context: IntelligenceContext): Promise<IntelligenceResponse> => {
      const invoices = await prisma.purchaseInvoice.findMany({
        where: {
          company_id: context.organizationId,
          ...(context.branchId ? { branch_id: context.branchId } : {}),
          status: 'POSTED'
        }
      });

      const totalPurchases = invoices.reduce((sum, inv) => sum + Number(inv.grand_total), 0);

      return {
        intent: 'PURCHASE_SUMMARY',
        success: true,
        answer: {
          headline: 'Total Purchases',
          value: totalPurchases.toFixed(2),
          currency: 'KWD',
          summary: `Total of ${invoices.length} posted purchase invoices.`
        },
        sources: invoices.map(inv => ({
          type: 'PurchaseInvoice',
          id: inv.id,
          reference: inv.document_number,
          label: `Invoice ${inv.document_number} for ${Number(inv.grand_total).toFixed(2)}`
        })),
        scope: { organizationId: context.organizationId, branchId: context.branchId },
        generatedAt: new Date().toISOString()
      };
    }
  },

  {
    intentCode: 'RECENT_TRANSACTIONS',
    displayName: 'Recent Transactions',
    description: 'Shows recently posted ERP transactions',
    requiredPermission: 'purchasing.read',
    authoritativeDataSource: 'PurchaseInvoice,GoodsReceipt',
    handle: async (context: IntelligenceContext): Promise<IntelligenceResponse> => {
      const invoices = await prisma.purchaseInvoice.findMany({
        where: { company_id: context.organizationId, ...(context.branchId ? { branch_id: context.branchId } : {}), status: 'POSTED' },
        orderBy: { posted_at: 'desc' },
        take: 5
      });

      const receipts = await prisma.goodsReceipt.findMany({
        where: { company_id: context.organizationId, ...(context.branchId ? { branch_id: context.branchId } : {}), status: 'POSTED' },
        orderBy: { posted_at: 'desc' },
        take: 5
      });

      const combined = [
        ...invoices.map(i => ({ type: 'PurchaseInvoice', date: i.posted_at || i.document_date, id: i.id, ref: i.document_number, label: 'Purchase Invoice' })),
        ...receipts.map(r => ({ type: 'GoodsReceipt', date: r.posted_at || r.document_date, id: r.id, ref: r.document_number, label: 'Goods Receipt' }))
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

      return {
        intent: 'RECENT_TRANSACTIONS',
        success: true,
        answer: {
          headline: 'Recent Transactions',
          value: combined.length.toString(),
          summary: `Showing ${combined.length} recent transactions.`
        },
        sources: combined.map(c => ({
          type: c.type,
          id: c.id,
          reference: c.ref,
          label: `${c.label} ${c.ref} on ${c.date.toISOString().split('T')[0]}`
        })),
        scope: { organizationId: context.organizationId, branchId: context.branchId },
        generatedAt: new Date().toISOString()
      };
    }
  }
];
