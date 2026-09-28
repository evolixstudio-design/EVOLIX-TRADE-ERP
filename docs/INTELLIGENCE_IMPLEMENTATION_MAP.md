# Intelligence Implementation Map

| Intent | Status | Authoritative Data Source | Missing Dependency |
|---|---|---|---|
| SALES_TODAY | NOT_IMPLEMENTABLE_YET | N/A | Sales Module (SalesInvoice) |
| SALES_PERIOD | NOT_IMPLEMENTABLE_YET | N/A | Sales Module (SalesInvoice) |
| CUSTOMER_OUTSTANDING | NOT_IMPLEMENTABLE_YET | N/A | Sales Module (SalesInvoice / BillAllocation) |
| CUSTOMER_OUTSTANDING_DETAIL | NOT_IMPLEMENTABLE_YET | N/A | Sales Module (SalesInvoice / BillAllocation) |
| LOW_STOCK | NOT_IMPLEMENTABLE_YET | N/A | Inventory Module (Reorder levels) |
| CASH_BALANCE | NOT_IMPLEMENTABLE_YET | N/A | Accounting Module (Cash Ledger Vouchers) |
| BANK_BALANCE | NOT_IMPLEMENTABLE_YET | N/A | Accounting Module (Bank Ledger Vouchers) |
| TOP_SELLING_ITEMS | NOT_IMPLEMENTABLE_YET | N/A | Sales Module (SalesInvoiceLines) |
| OPEN_PURCHASE_ORDERS | IMPLEMENTABLE | `PurchaseOrder` | None |
| PENDING_RECEIPTS | IMPLEMENTABLE | `PurchaseOrderLine` | None |
| SUPPLIER_OUTSTANDING | IMPLEMENTABLE | `PurchaseInvoice` | None |
| SALES_RETURN_SUMMARY | NOT_IMPLEMENTABLE_YET | N/A | Sales Returns Module |
| PURCHASE_SUMMARY | IMPLEMENTABLE | `PurchaseInvoice` | None |
| EXPENSE_SUMMARY | NOT_IMPLEMENTABLE_YET | N/A | Accounting Module (Expense Vouchers) |
| PROFIT_SUMMARY | NOT_IMPLEMENTABLE_YET | N/A | Accounting/Sales Modules |
| STOCK_VALUE | NOT_IMPLEMENTABLE_YET | N/A | Inventory Valuation Module |
| RECENT_TRANSACTIONS | IMPLEMENTABLE | `PurchaseInvoice`, `GoodsReceipt` | None |
