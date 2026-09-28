# INTELLIGENCE_ARCHITECTURE.md — EVOLIX Deterministic Intelligence Core

**Status:** Architecture target from Day 0; implemented incrementally  
**Core rule:** Intelligence reads authoritative ERP domains and never becomes a second ledger or stock system.

---

# 1. Purpose

EVOLIX should not merely store transactions. It should help the owner understand:

- What changed?
- Why did it change?
- What needs attention?
- What should I investigate?
- What stock may need reordering?
- Which stock is slow/non-moving?
- Which customers are overdue?
- Where is margin falling?
- Which supplier rates changed?

This architecture prepares the product for deterministic intelligence first and conversational AI later.

---

# 2. High-Level Architecture

```text
 Sales ───────────┐
 Purchases ───────┤
 Inventory ───────┤
 Accounting ──────┤
 Receipts/Payment ┤
 Parties ─────────┤
 Returns ─────────┤
 Pricing/Schemes ─┤
 Dispatch/Routes ─┘
         │
         ▼
 AUTHORITATIVE ERP DOMAINS
         │
         ▼
 ┌──────────────────────────────┐
 │ EVOLIX INTELLIGENCE CORE    │
 │                              │
 │ Metric Service               │
 │ Trend Service                │
 │ Inventory Intelligence       │
 │ Customer Intelligence        │
 │ Supplier Intelligence        │
 │ Margin Intelligence          │
 │ Credit Intelligence          │
 │ Alert Service                │
 │ Recommendation Service       │
 └─────────────┬────────────────┘
               │
       ┌───────┼────────┐
       ▼       ▼        ▼
 Dashboard  Reports   Alerts
       │       │        │
       └───────┴────────┘
               │
               ▼
        Source Drill-down
```

---

# 3. Implementation Stages

## Stage A — Intelligence Readiness

Begins immediately.

Do not build dashboards first. Preserve the data needed later.

Required qualities:

- immutable posted history;
- explicit status/state transitions;
- historical price/cost/tax snapshots;
- business dates;
- source-document lineage;
- company/branch/godown scope;
- Decimal-safe quantities/money;
- audit identity;
- cancellation/reversal references;
- report-friendly indexes;
- stable domain services.

## Stage B — Deterministic Metrics

Implement only after source domains exist.

Examples:

- sales totals/trends;
- stock velocity;
- gross margin;
- ageing;
- payment mix;
- supplier purchase-rate trends.

## Stage C — Alerts and Recommendations

Rules must be explicit/configurable.

Examples:

- low stock;
- possible overstock;
- near expiry;
- overdue receivables;
- credit exposure;
- unusual return rate;
- falling margin;
- supplier rate increase.

## Stage D — Conversational Assistant

The AI assistant calls typed report/intelligence tools and explains results.

---

# 4. Core Service Contracts

Plan for these service responsibilities. Do not create empty services merely to satisfy naming.

## MetricService

Owns reusable metric definitions and metadata.

A metric definition should know:

- code;
- title;
- unit;
- definition;
- source domains;
- supported dimensions;
- supported periods;
- permission required;
- drill-down contract.

## IntelligenceService

Coordinates multi-domain read-only intelligence requests.

## InventoryIntelligenceService

Examples:

- average daily sales;
- stock cover days;
- fast/slow/non-moving classification;
- dead-stock value;
- reorder suggestion inputs/results;
- near-expiry exposure;
- shortage risk.

## CustomerIntelligenceService

Examples:

- sales trend;
- purchase frequency;
- average order value;
- last purchase date;
- profitability;
- inactivity;
- order reduction trend.

## SupplierIntelligenceService

Examples:

- last purchase rate;
- rate trend;
- supplier comparison;
- delivery/shortage observations later;
- claim history later.

## MarginIntelligenceService

Examples:

- gross margin by invoice/item/category/customer/route/salesman;
- margin leakage;
- discount/override impact.

## CreditIntelligenceService

Examples:

- outstanding;
- overdue ageing;
- collection performance;
- credit utilization;
- exposure trend;
- unallocated receipts/PDC context when applicable.

## AlertService

Owns deterministic alert generation/deduplication/lifecycle.

## RecommendationService

Produces explainable suggestions. Recommendations never auto-post business transactions.

---

# 5. Retail Intelligence Target

Examples:

- today's sales;
- sales vs yesterday;
- sales vs comparable weekday;
- hourly sales pattern;
- average bill value;
- items per bill;
- top products/categories;
- fast/slow/non-moving items;
- gross margin and margin %;
- margin by item/category;
- low-margin invoices;
- stockout risk;
- excess stock;
- inventory days/stock cover;
- reorder suggestions;
- near expiry;
- dead-stock value;
- return rate;
- payment mix;
- discount/price-override trends.

---

# 6. Wholesale / Distribution Intelligence Target

Examples:

- customer sales trend;
- purchase frequency;
- last purchase;
- average order value;
- outstanding and overdue amount;
- ageing;
- collection performance;
- credit utilization;
- customer profitability;
- margin by route/salesman;
- customer inactivity/reduction trend;
- party-specific rate history;
- supplier rate history/comparison;
- purchase-rate variance;
- inventory velocity;
- reorder suggestion;
- potential overstock/shortage;
- route/beat/salesman performance;
- scheme effectiveness;
- discount/free-quantity effectiveness.

---

# 7. Metric Result Contract

A production metric result should conceptually expose:

```text
metric_code
title
value
unit
period_start
period_end
business_timezone
company_id
branch_id optional
godown_id optional
comparison_value optional
comparison_period optional
delta optional
delta_percent optional
source_record_count
calculated_at
freshness
explanation
permission_code
drilldown_type
drilldown_filters
```

Not every field must be a DB column. This is an API/domain contract concept.

---

# 8. Reconciliation / Explainability

Every metric must have a documented formula.

Examples:

```text
Net Sales = posted sales taxable/revenue amount - valid posted returns/reversals
Gross Profit = Net Sales - historical COGS
Stock Value = current base quantity × authoritative valuation cost
Receivable = posted receivable documents - valid allocations/credits/reversals
```

Formulas must match Accounting and Inventory rules in their authoritative docs.

Do not duplicate financial truth in a separate intelligence table unless it is explicitly a rebuildable projection/cache.

---

# 9. Read Models / Caching

Start with direct indexed queries where performance is acceptable.

Introduce projections/materialized aggregates only when measured need exists.

Any cache/projection must be:

- rebuildable;
- clearly non-authoritative;
- company scoped;
- freshness-labelled;
- transaction/event driven where needed;
- reconciliable to source truth.

Heavy intelligence jobs must not block billing.

---

# 10. Alert Model Principles

An alert should include:

```text
alert_type
severity
company/branch scope
target entity
triggered_at
metric/value
threshold/rule
human explanation
source/drilldown
status: open/acknowledged/resolved/dismissed
```

Avoid noisy duplicate alerts. Use deduplication/window rules.

---

# 11. Recommendation Principles

A recommendation must state:

- what is suggested;
- why;
- relevant inputs;
- confidence only if meaningfully defined;
- what workflow the user can open;
- whether it is merely informational or action-ready.

Never let an unexplained statistical/LLM score become a hard business rule.

---

# 12. Performance

Intelligence must respect the ERP's local performance requirements.

- No per-row API calls from dashboard cards.
- No browser loading 100k records for analytics.
- Use server-side aggregation.
- Add indexes based on measured queries.
- Run heavy exports asynchronously.
- Do not allow dashboard refresh to degrade invoice posting.
