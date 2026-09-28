# ACCOUNTING_RULES.md — EVOLIX Trade ERP

**Purpose:** Define financial posting rules and accounting invariants.

This document controls accounting behavior. Antigravity must not invent alternate accounting logic.

## Business Event → Accounting Effect Separation

The BUSINESS EVENT is the source. The ACCOUNTING POSTING is a derived effect.

```text
BUSINESS EVENT (source of truth)
  │  Sales Invoice, Purchase Invoice, Receipt, Payment,
  │  Sales Return, Purchase Return, Stock Adjustment, etc.
  │
  ▼
PostingService (centralized accounting engine)
  │
  ├── Determines posting profile (which ledgers to Dr/Cr)
  ├── Creates Voucher + VoucherLine(s)
  ├── Enforces: SUM(debit) == SUM(credit)
  ├── Links voucher to source: source_document_type + source_document_id
  └── All within same DB transaction as business event
```

**Rules:**
- Business modules call the centralized PostingService; they do not create random ledger rows
- The posting profile (configuration) determines which ledger accounts are debited/credited
- Future developers must understand: the transaction is the authoritative business event; the voucher is its accounting representation
- Any undefined accounting rule must be marked: `TBD — REQUIRES BUSINESS RULE DECISION`
- See BUSINESS_EVENT_IMPACT_MATRIX.md for the complete mapping of events to accounting effects


---

# 1. Accounting Model

EVOLIX uses double-entry bookkeeping.

Golden invariant:

```text
TOTAL DEBIT = TOTAL CREDIT
```

for every posted voucher.

No posted voucher may violate this rule.

---

# 2. Core Objects

```text
AccountGroup
LedgerAccount
Voucher
VoucherLine
BillAllocation
CostCenter
```

---

# 3. Account Nature

Primary nature:

```text
ASSET
LIABILITY
INCOME
EXPENSE
EQUITY
```

---

# 4. Core Ledger Groups

Recommended default groups:

Assets:
- Cash
- Bank
- Accounts Receivable
- Inventory
- Input GST
- Advances
- Fixed Assets

Liabilities:
- Accounts Payable
- Output GST
- TDS/TCS Payable
- Loans
- Duties & Taxes

Income:
- Sales
- Other Income
- Discounts Received

Expense:
- Purchase/COGS depending accounting design
- Freight
- Discount Allowed
- Salary
- Rent
- Utilities
- Bank Charges
- Round-off

Equity:
- Capital
- Retained Earnings

---

# 5. Posting Architecture

Business modules do not directly create random ledger rows.

They call:

```text
PostingService
```

Posting profile determines accounts.

---

# 6. Cash Sale

Example:

Net sale:

```text
Taxable       1,000
GST             180
Total         1,180
```

Entry:

```text
Dr Cash                  1,180
    Cr Sales             1,000
    Cr Output GST          180
```

---

# 7. Credit Sale

```text
Dr Customer              1,180
    Cr Sales             1,000
    Cr Output GST          180
```

Bill allocation:

```text
Customer outstanding +1,180
Due date calculated from credit terms
```

---

# 8. Sale with Discount

Example:

```text
Gross           1,000
Discount          100
Taxable           900
GST               162
Total           1,062
```

Two supported policies:

## Net Revenue Policy

```text
Dr Customer             1,062
    Cr Sales              900
    Cr Output GST         162
```

## Separate Discount Ledger Policy

If configured:

```text
Dr Customer             1,062
Dr Discount Allowed       100
    Cr Gross Sales      1,000
    Cr Output GST         162
```

One policy must be configured consistently.

---

# 9. Cash Purchase

Example:

```text
Inventory       1,000
Input GST         180
Total           1,180
```

Entry:

```text
Dr Inventory             1,000
Dr Input GST               180
    Cr Cash              1,180
```

---

# 10. Credit Purchase

```text
Dr Inventory             1,000
Dr Input GST               180
    Cr Supplier          1,180
```

Outstanding payable:

```text
Supplier +1,180
```

---

# 11. Sales Return

Return against original invoice.

Example:

```text
Taxable return    500
GST                90
Total             590
```

Credit customer:

```text
Dr Sales Return / Sales Reversal    500
Dr Output GST Reversal               90
    Cr Customer                     590
```

Inventory cost reversal is handled according to inventory costing policy.

---

# 12. Purchase Return

```text
Dr Supplier                     590
    Cr Purchase Return / Inventory   500
    Cr Input GST Reversal              90
```

Exact inventory/expense account depends on configured accounting method.

---

# 13. Customer Receipt

Customer owes 10,000 and pays 4,000 cash:

```text
Dr Cash                  4,000
    Cr Customer          4,000
```

Bill allocation reduces selected invoices.

---

# 14. Bank Receipt

```text
Dr Bank                  4,000
    Cr Customer          4,000
```

---

# 15. Supplier Payment

```text
Dr Supplier              4,000
    Cr Cash/Bank         4,000
```

---

# 16. Advance from Customer

```text
Dr Cash/Bank             5,000
    Cr Customer Advance  5,000
```

When allocated to invoice:

```text
Dr Customer Advance
    Cr Customer
```

or equivalent bill allocation policy.

Do not treat advance as sales revenue.

---

# 17. Advance to Supplier

```text
Dr Supplier Advance
    Cr Cash/Bank
```

---

# 18. Sales Freight

If charged to customer:

```text
Dr Customer/Cash
    Cr Freight Recovery / Sales Charges
    Cr applicable GST
```

If freight is absorbed by company:

```text
Dr Freight Expense
    Cr Cash/Payable
```

---

# 19. Purchase Freight / Landed Cost

If capitalized into inventory:

```text
Dr Inventory
    Cr Freight Payable/Cash
```

If expensed:

```text
Dr Freight Inward Expense
    Cr Cash/Payable
```

Policy must be explicit.

---

# 20. Round-Off

Small difference:

```text
Dr/Cr Round Off
```

Round-off tolerance is configurable.

No unexplained balancing entry allowed.

---

# 21. Credit Note

Customer credit note:

```text
Dr relevant income/tax reversal
    Cr Customer
```

Reason and tax treatment required.

---

# 22. Debit Note

Supplier debit:

```text
Dr Supplier
    Cr relevant expense/inventory/input tax adjustment
```

---

# 23. Journal Voucher

Journal can post any permitted balanced accounting transaction.

Restrictions:

- privileged permission
- backdated journal controlled
- closed periods blocked
- every line has ledger
- debit/credit mutually exclusive per line where practical
- narration required above risk threshold if configured

---

# 24. Contra

Cash to bank:

```text
Dr Bank
    Cr Cash
```

Bank to cash:

```text
Dr Cash
    Cr Bank
```

Bank to bank:

```text
Dr Destination Bank
    Cr Source Bank
```

---

# 25. Cheques / PDC

Receiving PDC should not always be treated as cleared bank balance.

Recommended:

```text
Dr PDC Receivable
    Cr Customer
```

On clearing:

```text
Dr Bank
    Cr PDC Receivable
```

On bounce:

```text
Dr Customer
    Cr PDC Receivable
```

Actual policy may vary by accounting configuration.

---

# 26. Customer Opening Balance

Receivable:

```text
Dr Customer
    Cr Opening Balance Equity / Suspense Opening
```

Payable:

```text
Dr Opening Balance Equity / Suspense Opening
    Cr Customer
```

Opening process must balance globally.

---

# 27. Supplier Opening Balance

Payable:

```text
Dr Opening Balance Equity
    Cr Supplier
```

---

# 28. Inventory Opening

Inventory opening must reconcile with opening accounting.

Example:

```text
Dr Inventory
    Cr Opening Stock Equity
```

Final implementation depends on year-opening model.

---

# 29. GST

Sales:

```text
Output CGST
Output SGST
Output IGST
Output Cess
```

Purchases:

```text
Input CGST
Input SGST
Input IGST
Input Cess
```

Tax ledger mapping is configuration-driven.

---

# 30. Intra-State Sale

Example 18%:

```text
Dr Customer             1,180
    Cr Sales            1,000
    Cr Output CGST         90
    Cr Output SGST         90
```

---

# 31. Inter-State Sale

```text
Dr Customer             1,180
    Cr Sales            1,000
    Cr Output IGST        180
```

---

# 32. TDS / TCS

TDS/TCS must be feature-gated and effective-dated.

Do not hardcode legal thresholds.

Posting profiles depend on current statutory configuration.

---

# 33. Cost of Goods Sold

Two approaches are possible:

## Perpetual inventory

At sale:

```text
Dr COGS
    Cr Inventory
```

Recommended for real-time profitability.

## Periodic valuation

COGS determined by period calculation.

EVOLIX preferred architecture: **perpetual inventory**, where business requirements permit.

---

# 34. Costing Method

Supported roadmap:

- weighted average
- FIFO
- batch-specific cost
- standard cost later

One company uses one configured primary valuation rule per inventory context unless explicitly designed otherwise.

---

# 35. Negative Stock

If negative stock is allowed:

- cost valuation behavior must be deterministic;
- later inward must correctly resolve provisional costing if required;
- negative-stock transactions are auditable.

Default recommendation:

```text
warn/block unless privileged override
```

---

# 36. Posted Document Immutability

Posted invoice accounting entries are not edited in place.

Correction:

```text
cancel/reverse
→ corrected document
```

or approved amendment model.

---

# 37. Cancellation

Cancellation must create financial reversal, not delete history.

Original voucher remains visible.

Example:

```text
ORIGINAL
Dr Customer
    Cr Sales
    Cr Tax

REVERSAL
Dr Sales
Dr Tax
    Cr Customer
```

---

# 38. Period Locking

Periods:

```text
OPEN
SOFT_LOCKED
TAX_LOCKED
CLOSED
```

Rules:

- ordinary users cannot post to locked period;
- privileged override requires reason;
- closed period requires reopen workflow;
- reopen is audited.

---

# 39. Bill-Wise Accounting

Customer/supplier transactions support references:

```text
NEW_REFERENCE
AGAINST_REFERENCE
ADVANCE
ON_ACCOUNT
```

Required for ageing.

---

# 40. Ageing

Ageing uses due date.

Buckets configurable:

```text
Current
1-30
31-60
61-90
91-180
180+
```

---

# 41. Profit Reports

Gross profit uses:

```text
Net Sales
- COGS
= Gross Profit
```

P&L:

```text
Gross Profit
+ Other Income
- Operating Expenses
= Net Profit
```

---

# 42. Balance Sheet

Must satisfy:

```text
Assets = Liabilities + Equity
```

Any mismatch is a critical integrity error.

---

# 43. Cost Centers

Optional allocation:

- branch
- department
- project
- salesperson
- warehouse

Cost center does not replace ledger account.

---

# 44. Cashier Shift Accounting

POS cash shift:

```text
opening cash
+ cash sales
+ cash receipts
+ cash in
- cash refunds
- cash out
= expected cash
```

Variance:

```text
counted - expected
```

Variance requires reason if outside tolerance.

---

# 45. Bank Reconciliation

Reconciliation does not modify posted voucher amount.

It links:

```text
bank statement line
↔ voucher line
```

---

# 46. Foreign Currency

Future-ready design:

Store:

```text
transaction currency
exchange rate
base currency amount
```

Do not implement without full gain/loss rules.

---

# 47. Rounding

Use Decimal.

Rounding configuration:

- quantity precision
- rate precision
- tax precision
- invoice precision

Never use float.

---

# 48. Posting Failure

If accounting posting fails:

```text
business transaction must not partially post
```

Entire local transaction rolls back.

---

# 49. Audit

Audit:

- manual journal
- cancellation
- period reopen
- backdated posting
- ledger mapping change
- opening balance edit
- financial export

---

# 50. Accounting Tests

Required:

- cash sale
- credit sale
- purchase
- sale return
- purchase return
- receipt
- payment
- discount
- freight
- GST intra-state
- GST inter-state
- cancellation
- round-off
- opening
- PDC
- period lock
- concurrent posting

For every test:

```text
sum debit == sum credit
```

---

# 51. Accounting Data Integrity Tests

Automated jobs/tests must detect:

- unbalanced voucher
- voucher without source where required
- posted invoice without voucher
- duplicate posting
- orphan bill allocation
- closed period mutation

---

# 52. Configuration

Posting profiles map business events to ledgers.

Example:

```text
SALE_REVENUE → Sales Ledger
OUTPUT_CGST → Output CGST
OUTPUT_SGST → Output SGST
OUTPUT_IGST → Output IGST
INVENTORY → Inventory Asset
COGS → Cost of Goods Sold
ROUND_OFF → Round Off
```

---

# 53. Accounting Acceptance Criteria

Accounting module is production-ready only when:

- all vouchers balance;
- posted sales/purchase have accounting links;
- cancellation reverses correctly;
- ageing reconciles to control accounts;
- trial balance is balanced;
- balance sheet balances;
- P&L reconciles;
- period locks work;
- permissions work;
- company isolation works.
