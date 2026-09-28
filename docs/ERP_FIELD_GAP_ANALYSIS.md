# ERP FIELD GAP ANALYSIS

This document analyzes gaps between the intended state of EVOLIX Trade (as defined in the Master specifications and competitor matrix) and its current implementation state. 

## CURRENT IMPLEMENTED ENGINES
1. **Module 01: Architecture** - Repositories, Database Schema, and Monorepo setup.
2. **Module 02: Purchasing Core** - PO, GRN, Purchase Invoices, Item Master, Party Master, Godowns.
3. **Module 03: Accounting Core** - Ledger Accounts, Vouchers, Voucher Lines, Posting Service, Trial Balance, RBAC & Isolation.
4. **Module 00: Intelligence Layer** - AST parsing and natural language querying base.

## GAPS TO COMPETITOR PARITY (e.g. Marg/Vyapar)

### 1. Sales & Receivables (Module 04 / 05)
**Gap:** The entire outbound flow (Sales Order -> Delivery Challan -> Sales Invoice -> Receipt) is currently missing.
**Requirement:** Implement Sales controllers mapping directly to `StockMovement` (OUT) and `Voucher` (Debtor AR).
**Priority:** Critical / Immediate.

### 2. Inventory Intelligence & Stock Balances
**Gap:** We have `StockMovement`, but no dynamic fast-read `StockBalance` aggregation or Reorder Level alerts.
**Requirement:** Build background aggregation or view-based reports summarizing Qty at Godown level. Integrate Batch/Expiry/Serial rules.
**Priority:** High.

### 3. GST & Taxation Compliance
**Gap:** Invoices are structured to accept tax lines, but there is no automated GSTR-1, 2, or 3B extraction engine. E-Invoicing (IRN) logic is absent.
**Requirement:** Create Tax extraction logic from `PurchaseInvoiceLine` and `SalesInvoiceLine` `tax_snapshot_json` payloads.
**Priority:** High.

### 4. Banking & Cash Management
**Gap:** Vouchers can handle Cash/Bank manually, but there is no dedicated Bank Reconciliation workflow or Cheque printing module.
**Requirement:** Build Bank Reconciliation UI linking bank statement imports to existing Vouchers.
**Priority:** Medium.

### 5. Point of Sale (POS)
**Gap:** No high-speed retail checkout interface or shift management.
**Requirement:** Build POS specific APIs for quick, bundled "Invoice + Payment" transactions.
**Priority:** Medium.

### 6. Field Sales & Distribution
**Gap:** Areas, Routes, and Salesman Tracking are missing. Commission structures do not exist.
**Requirement:** Map Route Masters, link to Customers, track Salesman per Invoice for commission ledger posting.
**Priority:** Low.

### 7. Manufacturing (BOM)
**Gap:** Complete absence of multi-level Bill of Materials and Production workflows.
**Requirement:** Build Production engines that consume raw material via `StockMovement` (OUT) and yield finished goods (IN).
**Priority:** Low.

## ARCHITECTURAL GAPS
1. **Fiscal Year Locks:** The current Accounting Core validates open FY strings structurally but does not have a cron or engine enforcing Month-End or Year-End locks mathematically.
2. **Opening Balances:** As noted in Module 03 Forensic Report, a structured workflow for inserting Opening Balances cleanly via the PostingService without distorting the current year's P&L is undocumented.

## CONCLUSION
EVOLIX Trade's foundation is architecturally superior to legacy systems (strict single source of truth, no double-data entry), but it requires immediate build-out of the Sales and Taxation engines to reach minimum viable competitor parity.
