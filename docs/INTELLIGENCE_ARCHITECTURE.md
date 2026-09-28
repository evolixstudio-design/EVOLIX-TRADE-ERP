# INTELLIGENCE_ARCHITECTURE.md — EVOLIX Trade ERP

**Purpose:** Define how EVOLIX answers business questions from authoritative data WITHOUT requiring AI for core ERP correctness.

**Core Rule:** Intelligence reads authoritative ERP domains and never becomes a second ledger or stock system.

---

# 1. Intelligence Chain

Every business question answered by EVOLIX must follow this chain:

```text
AUTHORITATIVE FACT (posted transaction in PostgreSQL)
    │
    ▼
SOURCE TRANSACTION (invoice, receipt, movement, voucher)
    │
    ▼
BUSINESS EFFECT (stock changed, balance changed, ledger posted)
    │
    ▼
ACTOR (which user performed the action)
    │
    ▼
TARGET ENTITY (which customer, item, godown, branch)
    │
    ▼
TIMESTAMP (business_date + created_at)
    │
    ▼
SCOPE (company_id, branch_id, godown_id, financial_year_id)
    │
    ▼
CORRELATION / LINKAGE (source_document_type + source_document_id)
    │
    ▼
REPORT (aggregated, filtered, formatted for user)
    │
    ▼
DRILL-DOWN (user clicks metric → sees transactions → sees lines → sees effects)
```

---

# 2. Example: Customer Outstanding

```text
Question: "How much does Customer X owe us?"

Answer derivation:
    │
    ├── Posted Sales Invoices (bill allocations with NEW_REFERENCE)
    │     → sum of outstanding amounts per invoice
    │
    ├── Minus: Posted Receipts (bill allocations AGAINST_REFERENCE)
    │     → sum of allocated amounts
    │
    ├── Minus: Posted Sales Returns (credit adjustments)
    │     → sum of return totals
    │
    ├── Minus: Credit Notes
    │     → sum of credit note amounts
    │
    └── = Current Outstanding Balance
         │
         ├── Drill-down: list of unpaid/partially-paid invoices
         ├── Each invoice: lines, dates, amounts, payments received
         └── Ageing: bucketed by days past due date
```

---

# 3. Example: Stock Quantity

```text
Question: "How much of Item Y is in Godown Z?"

Answer derivation:
    │
    ├── Stock Movements where item_id=Y, godown_id=Z
    │     SUM(quantity_delta) grouped by movement_type
    │
    ├── = Current Stock
    │     (also available from StockBalanceProjection for performance)
    │
    └── Drill-down:
         ├── Opening stock entries
         ├── Purchase inward movements → linked purchase invoices
         ├── Sale outward movements → linked sales invoices
         ├── Return movements → linked return documents
         ├── Transfer in/out → linked transfer documents
         └── Adjustment movements → linked adjustment documents with reasons
```

---

# 4. Example: Sales Analysis

```text
Question: "What were our sales this month?"

Answer derivation:
    │
    ├── Posted Sales Invoices where document_date in period
    │     → SUM(grand_total), SUM(taxable_amount), COUNT(*)
    │
    └── Drill-down dimensions:
         ├── By Customer (party_id)
         ├── By Item (invoice lines → item_id)
         ├── By Category (item → category_id)
         ├── By Branch (branch_id)
         ├── By Godown (invoice lines → godown_id)
         ├── By Salesperson (salesperson_id)
         ├── By Date (document_date)
         └── Each dimension → list of invoices → invoice detail → lines → effects
```

---

# 5. Data Requirements for Intelligence

Intelligence requires the following data qualities, which must be preserved from Module 00 onward:

| Quality | Description | Where Enforced |
|---------|-------------|----------------|
| Immutable posted history | Posted documents cannot be silently edited | PostingService, document lifecycle |
| Explicit status transitions | Draft → Posted → Cancelled with timestamps | Status field + audit events |
| Historical snapshots | Tax rate, cost rate, price at time of transaction | `tax_snapshot_json`, `cost_rate_snapshot`, `pricing_trace_json` on transaction lines |
| Business dates | `document_date` separate from `created_at` | All transaction headers |
| Source lineage | Every derived record links back to source | `source_document_type` + `source_document_id` on vouchers, stock movements |
| Company/branch/godown scope | Every record carries scope identifiers | Foreign keys on all transactional tables |
| Decimal safety | NUMERIC for money and quantity, never float | Database schema + application layer |
| Audit identity | Who did what, when, from where | `audit_logs` table |
| Cancellation references | Reversed records link to originals | Reversal voucher links, reverse movement links |

---

# 6. Intelligence Layers

## Layer 1: Direct Queries (Start Here)

Use indexed queries against authoritative tables. No separate analytics store needed initially.

```text
Sales Register → SELECT from sales_invoices + sales_invoice_lines
Stock Summary → SELECT from stock_balance_projection
Customer Ledger → SELECT from voucher_lines + bill_allocations
Trial Balance → SELECT from voucher_lines GROUP BY ledger_account_id
```

## Layer 2: Deterministic Metrics (Module 17+)

Implement after transactional modules are stable:

- Sales totals and trends
- Stock velocity / days of cover
- Gross margin by item/customer/branch
- Outstanding ageing
- Payment mix analysis
- Supplier purchase-rate trends

## Layer 3: Alerts and Recommendations (Module 17+)

Rules-based, configurable:

- Low stock alert (current < reorder_level)
- Near expiry alert (expiry_date < today + threshold)
- Overdue receivable alert (due_date < today)
- Credit limit breach warning
- Unusual return rate
- Falling margin trend

## Layer 4: Conversational AI (Optional, Future)

The AI assistant calls typed report/intelligence services and explains results to the owner.

**AI is OPTIONAL.** Core ERP correctness must NEVER depend on AI or cloud services.

---

# 7. Read Models and Projections

| Projection | Source | Purpose |
|-----------|--------|---------|
| `stock_balance_projection` | Rebuilt from `stock_movements` | Fast stock lookups without scanning movement history |
| Bill allocation outstanding | Computed from `bill_allocations` | Fast outstanding/ageing without re-aggregating vouchers |

Rules for projections:
- Rebuildable from source data
- Clearly labeled as non-authoritative cache
- Company-scoped
- Updated atomically with source changes
- Include `updated_at` freshness marker
- Reconcilable to source truth via rebuild utility

---

# 8. Performance Rules

- No per-row API calls from dashboard cards
- No browser loading 100k records for analytics
- Use server-side aggregation
- Add indexes based on measured queries
- Run heavy exports asynchronously
- Dashboard refresh must not degrade invoice posting performance

---

# 9. No Separate Business Truth

```text
                    ┌──────────────────────┐
                    │   AUTHORITATIVE      │
                    │   TRANSACTION DATA   │
                    │   (PostgreSQL)       │
                    └──────────┬───────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
         Reports         Intelligence       Dashboards
              │                │                │
              └────────────────┼────────────────┘
                               │
                          ALL READ FROM
                          SAME SOURCE
```

There is only ONE stock truth (stock_movements).
There is only ONE accounting truth (vouchers + voucher_lines).
There is only ONE outstanding truth (bill_allocations).

Reports, dashboards, metrics, and intelligence all derive from these.

They never create a competing truth.
