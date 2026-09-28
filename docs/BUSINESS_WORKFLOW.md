# BUSINESS_WORKFLOW.md — EVOLIX Trade ERP

**Purpose:** Master business operating workflow. This document defines how EVOLIX Trade ERP functions as ONE CONNECTED BUSINESS SYSTEM.

**Core Principle:**

> ENTER A BUSINESS EVENT ONCE → AUTOMATICALLY PROPAGATE ALL VALID BUSINESS EFFECTS.

A transaction must not become an isolated record. The ERP must maintain a single authoritative business truth.

---

# A. BUSINESS SETUP

Before daily operations begin, the following hierarchy must be established:

```text
Organization
  └── Company
        ├── Branch(es)
        │     └── Godown(s)
        ├── Financial Year(s)
        ├── Chart of Accounts / Ledger setup
        ├── Tax Configuration
        └── Number Series
```

Users are assigned to the Organization with role-based permissions scoped to Company, Branch, or Godown as appropriate.

Setup sequence:

```text
1. Create Organization
2. Create Company (legal entity, GSTIN, PAN, timezone, FY start month)
3. Create Branch(es) under Company
4. Create Godown(s) under Branch
5. Create Financial Year (start/end, active status)
6. Seed Chart of Accounts and Ledger Groups
7. Configure Tax Classes (GST rates, HSN)
8. Configure Number Series (invoice, purchase, receipt, etc.)
9. Create Users and assign Roles with appropriate permissions
10. Enter Opening Balances (stock, customer, supplier, cash, bank)
```

**Status:** Steps 1–5, 9 are implemented (Module 01 + 02). Steps 6–8, 10 are roadmap items (Module 03–06).

---

# B. MASTER DATA

Master data must be established before transactional operations:

| Master | Purpose | Module |
|--------|---------|--------|
| Products/Items | SKU, name, unit, category, brand, HSN, tax class, rates | 04 |
| Customers | Party (customer type), address, GSTIN, credit terms, price list | 04 |
| Suppliers | Party (supplier type), address, GSTIN, payment terms | 04 |
| Ledger Accounts | Chart of accounts for accounting postings | 05 |
| Units of Measure | Primary/alternate units, conversion factors | 04 |
| Tax Classes | GST rates, HSN codes, effective dates | 04 |
| Price Lists | Customer/supplier specific pricing | 04/13 |
| Categories/Brands | Product classification | 04 |
| Godowns | Stock locations (already in Module 02) | 02 ✓ |
| Salespersons/Routes/Areas | Sales territory data | 04 |

Opening balances (stock, customer/supplier outstanding, cash/bank) bridge the gap between the old system and EVOLIX.

---

# C. DAILY BUSINESS FLOW

The complete lifecycle of a business day:

```text
OPEN BUSINESS DAY
       │
       ├── Review Dashboard
       │     ├── Yesterday's summary
       │     ├── Outstanding receivables/payables
       │     ├── Low stock alerts
       │     └── Near-expiry warnings
       │
       ├── PURCHASE CYCLE
       │     ├── Purchase Order (optional)
       │     ├── Receive Goods → Stock Increase → Godown
       │     ├── Purchase Invoice → Supplier Payable → Accounting → Tax
       │     └── Audit trail recorded
       │
       ├── SALES CYCLE
       │     ├── Sales Order (optional, wholesale)
       │     ├── Delivery/Challan (optional)
       │     ├── Sales Invoice → Stock Decrease → Customer Receivable → Accounting → Tax
       │     └── Audit trail recorded
       │
       ├── RECEIPTS & PAYMENTS
       │     ├── Customer Receipt → Receivable Decrease → Cash/Bank Increase → Accounting
       │     ├── Supplier Payment → Payable Decrease → Cash/Bank Decrease → Accounting
       │     └── Audit trail recorded
       │
       ├── STOCK OPERATIONS
       │     ├── Stock Transfer (Godown → Godown)
       │     ├── Stock Adjustment (with reason and approval)
       │     └── Stock Count / Physical Verification
       │
       ├── RETURNS
       │     ├── Sales Return → Stock Increase → Customer Balance Adjustment → Accounting → Tax
       │     └── Purchase Return → Stock Decrease → Supplier Balance Adjustment → Accounting → Tax
       │
       ├── REPORTS
       │     ├── Sales register, Purchase register
       │     ├── Stock summary, Stock ledger
       │     ├── Customer/Supplier ledger
       │     ├── Cash/Bank book
       │     ├── Day book
       │     └── GST reports
       │
       └── CLOSE BUSINESS DAY
             ├── Cashier shift close (POS)
             ├── Day-end summary
             └── Backup
```

---

# D. WHOLESALE FLOW

Wholesale transactions follow a multi-step lifecycle supporting partial fulfillment:

## Sales Side

```text
Quotation (optional)
    │
    ▼
Sales Order
    │ (partial/full conversion)
    ▼
Delivery Challan (optional, goods dispatched without invoice)
    │
    ▼
Sales Invoice
    │
    ├── Stock Decrease (from specified godown)
    ├── Customer Receivable (if credit sale)
    ├── Cash/Bank (if cash/immediate payment)
    ├── Accounting Voucher (Sales, Tax, Receivable/Cash)
    ├── GST Effect (Output CGST/SGST or IGST)
    └── Audit Event
    │
    ▼
Credit Note / Debit Note (if adjustment needed)
    │
    ▼
Customer Receipt (against outstanding invoices)
    │
    ├── Receivable Decrease
    ├── Cash/Bank Increase
    ├── Accounting Voucher
    └── Bill Allocation (ageing updated)
```

## Purchase Side

```text
Purchase Requirement / Purchase Order (optional)
    │
    ▼
Goods Receipt / Purchase Challan (optional, goods received before invoice)
    │
    ▼
Purchase Invoice
    │
    ├── Stock Increase (into specified godown)
    ├── Supplier Payable
    ├── Accounting Voucher (Inventory/Purchase, Tax, Payable/Cash)
    ├── GST Effect (Input CGST/SGST or IGST)
    ├── Landed Cost allocation (if applicable)
    └── Audit Event
    │
    ▼
Supplier Payment (against outstanding invoices)
    │
    ├── Payable Decrease
    ├── Cash/Bank Decrease
    ├── Accounting Voucher
    └── Bill Allocation
```

---

# E. RETAIL FLOW

Retail transactions follow a faster, simplified path. Do not force wholesale complexity onto simple retail transactions.

```text
Customer (walk-in or registered)
    │
    ▼
Sales Invoice / POS Transaction
    │
    ├── Stock Decrease (from POS godown / default godown)
    ├── Immediate Payment (cash / card / UPI / split)
    ├── Cash/Bank Increase
    ├── Accounting Voucher (Sales, Tax, Cash/Bank)
    ├── GST Effect
    ├── Receipt printed
    └── Audit Event
```

Key differences from wholesale:
- No mandatory Sales Order step
- Payment typically immediate (no credit cycle)
- Simplified party record (walk-in customer)
- Cashier shift tracking (open/close, cash variance)
- Hold/resume bill capability
- Barcode-driven item entry

---

# F. RETURNS

## Sales Return

```text
Sales Return
    │
    ├── Stock Increase (to specified godown)
    │     └── Saleable vs. Damaged classification
    ├── Customer Balance Adjustment (outstanding reduced / credit issued)
    ├── Accounting Voucher (Dr Sales Return / Output GST Reversal, Cr Customer)
    ├── Tax Adjustment (Output GST reversed)
    ├── Link to original invoice (if known)
    └── Audit Event
```

## Purchase Return

```text
Purchase Return
    │
    ├── Stock Decrease (from specified godown)
    ├── Supplier Balance Adjustment (payable reduced / debit note)
    ├── Accounting Voucher (Dr Supplier, Cr Purchase Return / Input GST Reversal)
    ├── Tax Adjustment (Input GST reversed)
    ├── Link to original purchase invoice (if known)
    └── Audit Event
```

---

# G. STOCK TRANSFER

```text
Godown A (source)
    │
    ├── Stock Decrease (TRANSFER_OUT movement)
    │
    ▼
Stock Transfer Document
    │
    ▼
Godown B (destination)
    │
    └── Stock Increase (TRANSFER_IN movement)
```

Rules:
- Total company stock does NOT change during a transfer
- Transfer must be a balanced operation: OUT quantity = IN quantity
- Inter-branch transfers may use dispatch/receive workflow with in-transit state
- Transfer discrepancies (sent ≠ received) require reason/action
- No accounting effect for intra-company transfers (same legal entity)
- Audit event recorded

---

# H. PAYMENTS

## Customer Receipt

```text
Customer Receipt
    │
    ├── Customer Outstanding Decreases
    ├── Cash/Bank Increases
    ├── Accounting Voucher (Dr Cash/Bank, Cr Customer)
    ├── Bill Allocation (specific invoices marked as paid/partially paid)
    └── Audit Event
```

## Supplier Payment

```text
Supplier Payment
    │
    ├── Supplier Payable Decreases
    ├── Cash/Bank Decreases
    ├── Accounting Voucher (Dr Supplier, Cr Cash/Bank)
    ├── Bill Allocation (specific invoices marked as paid/partially paid)
    └── Audit Event
```

Supported payment modes: Cash, Bank Transfer, Cheque, UPI, Card, PDC (Post-Dated Cheque)

PDC has special accounting treatment (see ACCOUNTING_RULES.md §25).

---

# I. ACCOUNTING

**Design principle:** Business users should enter business transactions. The system should automatically create valid accounting effects.

Users should NOT have to duplicate normal sales/purchases/payments manually into accounting.

```text
BUSINESS TRANSACTION (source of truth)
    │
    ▼
PostingService (centralized)
    │
    ├── Determines posting profile (which ledgers to debit/credit)
    ├── Creates Voucher + VoucherLine(s)
    ├── Enforces: SUM(debit) == SUM(credit)
    ├── Links voucher to source transaction (source_document_type, source_document_id)
    └── All within same database transaction (atomicity)
```

Manual journal vouchers remain available for:
- Adjustments not tied to a business transaction
- Opening balances
- Corrections (with privileged permission)
- Contra entries (cash ↔ bank)

See ACCOUNTING_RULES.md for complete posting rules per transaction type.

---

# J. TAX / GST

Transaction data must feed applicable tax/GST records and reports according to configured rules.

```text
Sales Invoice Line
    │
    ├── Tax Class → HSN Code + GST Rate
    ├── Place of Supply → Intra-state (CGST+SGST) or Inter-state (IGST)
    ├── Tax amounts calculated and stored on line
    ├── Tax snapshot preserved (rate at time of transaction)
    └── Feeds GST reports (GSTR-1, GSTR-3B, etc.)
```

Tax configuration is data-driven, not hardcoded. Legal thresholds and rates must be configurable and effective-dated.

e-Invoice and e-Way Bill integrations are asynchronous and happen after posting.

---

# K. REPORTING

Reports derive from authoritative transactional data. They never create a separate truth.

| Category | Reports |
|----------|---------|
| Sales | Register, Item-wise, Customer-wise, Salesperson-wise, Margin |
| Purchase | Register, Item-wise, Supplier-wise |
| Stock | Summary, Ledger, Godown-wise, Batch/Expiry, Valuation, Ageing, Movement |
| Customer | Ledger, Outstanding, Ageing |
| Supplier | Ledger, Outstanding, Ageing |
| Cash/Bank | Cash Book, Bank Book, Bank Reconciliation |
| Accounting | Day Book, Ledger, Trial Balance, P&L, Balance Sheet |
| Tax/GST | Output Tax, Input Tax, GSTR-1, GSTR-3B |
| Management | Daily Business Summary, Profit Analysis, Branch Comparison |

---

# L. INTELLIGENCE

The owner should be able to drill from any metric to the source transaction.

```text
Dashboard
    │
    ▼
Metric (e.g., "Today's Sales: ₹2,45,000")
    │
    ▼
Business Entity (e.g., Top Customers, Top Products)
    │
    ▼
Transaction List (e.g., Invoices for Customer X)
    │
    ▼
Transaction Detail (Invoice #1234)
    │
    ├── Transaction Lines (items, quantities, rates, tax)
    ├── Related Stock Movements (which godown, batch)
    ├── Related Accounting Voucher (debit/credit entries)
    └── Audit Trail (who created, when, from where)
```

The system must explain WHERE a number came from.

Intelligence is built on top of authoritative ERP domains. It does NOT create a second ledger, stock system, or balance truth. See INTELLIGENCE_ARCHITECTURE.md for full design.
