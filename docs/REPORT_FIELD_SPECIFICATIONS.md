# REPORT FIELD SPECIFICATIONS

Reports in EVOLIX Trade do NOT store their own truth. They aggregate and derive data dynamically from authoritative transactional engines (Accounting, Inventory, Sales, Purchases). 

## 1. SALES REGISTER
**Purpose:** Provides a chronological list of all sales invoices issued.
**Authoritative Source:** `PurchaseInvoice` (Header) + `PurchaseInvoiceLine` + `Voucher`
**Permissions:** `report.sales.view`

| Column | Derived From | Calculation | Drill-down |
|---|---|---|---|
| Date | `SalesInvoice.document_date` | — | Daily Sales Report |
| Invoice No. | `SalesInvoice.document_number` | — | Sales Invoice |
| Customer | `SalesInvoice.party_id -> Party.name` | — | Customer Ledger |
| Taxable Value | `SalesInvoiceLine.taxable_value` (Sum) | Σ(Qty * Rate - Discount) | — |
| CGST | `SalesInvoiceLine.tax_snapshot` | Σ CGST | — |
| SGST | `SalesInvoiceLine.tax_snapshot` | Σ SGST | — |
| IGST | `SalesInvoiceLine.tax_snapshot` | Σ IGST | — |
| Total Value | `SalesInvoice.grand_total` | Taxable + Tax Amount | — |

**Filters:** Date Range, Customer, Branch, Salesman

---

## 2. STOCK LEDGER (Item Movement)
**Purpose:** Tracks in and out movements of a specific item to calculate closing balance.
**Authoritative Source:** `StockMovement`
**Permissions:** `report.inventory.view`

| Column | Derived From | Calculation | Drill-down |
|---|---|---|---|
| Date | `StockMovement.business_date` | — | — |
| Particulars | `StockMovement.source_document_type` | — | Source Document (e.g. GRN) |
| Doc No. | `StockMovement.source_document_id` | Document lookup | Source Document |
| IN Qty | `StockMovement.quantity_delta` | If > 0 | — |
| OUT Qty | `StockMovement.quantity_delta` | If < 0 | — |
| Closing Qty | Dynamic Aggregation | Previous Balance + IN - OUT | — |

**Filters:** Date Range, Godown, Item Category, Brand

---

## 3. CUSTOMER OUTSTANDING (Ageing)
**Purpose:** Shows unpaid invoices grouped by customer and aged by days past due.
**Authoritative Source:** `SalesInvoice` (where `outstanding_amount` > 0) OR `BillAllocation` over `VoucherLine`.
**Permissions:** `report.ar.view`

| Column | Derived From | Calculation | Drill-down |
|---|---|---|---|
| Customer | `Party.name` | — | Customer Ledger |
| Total Outstanding | `SalesInvoice.outstanding_amount` | Σ Outstanding | Customer Statement |
| 0-30 Days | `SalesInvoice.due_date` | Σ Outstanding where DateDiff <= 30 | Invoice List |
| 31-60 Days | `SalesInvoice.due_date` | Σ Outstanding where DateDiff 31-60 | Invoice List |
| 61-90 Days | `SalesInvoice.due_date` | Σ Outstanding where DateDiff 61-90 | Invoice List |
| > 90 Days | `SalesInvoice.due_date` | Σ Outstanding where DateDiff > 90 | Invoice List |

**Filters:** As of Date, Customer Group, Area, Salesman

---

## 4. TRIAL BALANCE
**Purpose:** Mathematical proof that Total Debits = Total Credits across all ledgers.
**Authoritative Source:** `VoucherLine` (where `Voucher.status` = 'POSTED')
**Permissions:** `report.accounting.view`

| Column | Derived From | Calculation | Drill-down |
|---|---|---|---|
| Account Code | `LedgerAccount.code` | — | General Ledger |
| Account Name | `LedgerAccount.name` | — | General Ledger |
| Debit Balance | `VoucherLine.debit` | Σ Dr - Σ Cr (If Normal Balance = DEBIT and > 0) | General Ledger |
| Credit Balance | `VoucherLine.credit` | Σ Cr - Σ Dr (If Normal Balance = CREDIT and > 0) | General Ledger |

**Filters:** As of Date, Branch

---

## 5. PROFIT & LOSS STATEMENT
**Purpose:** Calculates Net Profit or Loss over a fiscal period.
**Authoritative Source:** `VoucherLine` linked to REVENUE and EXPENSE accounts.
**Permissions:** `report.financials.view`

**Grouping:**
1. Trading Account (Sales, Direct Incomes vs COGS, Direct Expenses) -> Gross Profit
2. P&L Account (Gross Profit + Indirect Incomes vs Indirect Expenses) -> Net Profit

| Row Item | Derived From | Calculation | Drill-down |
|---|---|---|---|
| Sales Revenue | Ledgers mapped to REVENUE | Σ Credit - Σ Debit | Trial Balance -> GL |
| Cost of Goods Sold | Ledgers mapped to DIRECT EXPENSE | Σ Debit - Σ Credit | Trial Balance -> GL |
| Gross Profit | — | Revenue - COGS | — |
| Operating Expenses | Ledgers mapped to EXPENSE | Σ Debit - Σ Credit | Trial Balance -> GL |
| Net Profit | — | Gross Profit - Operating Expenses | — |

**Filters:** Date Range, Branch
