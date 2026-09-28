# MODULE_ROADMAP_INTELLIGENCE_PATCH.md — Intelligence Integration

**Purpose:** Add intelligence-readiness to the existing EVOLIX module roadmap without reordering the core dependency chain.

---

# 1. Apply to Every Existing Module

Every module from Foundation onward must additionally pass:

1. `ENGINEERING_EXECUTION_PROTOCOL.md`
2. `MODULE_COMPLETION_QA_GATE.md`
3. `INTELLIGENCE_READINESS_GATE.md`

Do not create a separate intelligence database truth during early modules.

---

# 2. Day-0 Foundation Additions

During Foundation, ensure:

- stable versioned API conventions;
- correlation IDs;
- structured errors;
- i18n base;
- business date/timezone utilities planned;
- Decimal conventions documented;
- report/export folder/service boundaries reserved;
- read-only intelligence/report code cannot bypass company scope;
- worker architecture supports future metric/alert jobs;
- audit/provenance conventions are defined.

Do not build AI chat yet.

---

# 3. Module-Specific Intelligence Readiness

## Identity/RBAC
Prepare permission enforcement reusable by future report/AI tools.

## Company/Financial Year
Preserve company/branch/FY/timezone/business-date context.

## Configuration
Use typed settings so intelligence thresholds can later be configured safely.

Examples later:
- slow-moving days;
- dead-stock days;
- stock-cover threshold;
- near-expiry days;
- overdue attention buckets.

## Masters
Preserve stable IDs, aliases/search fields, categories/brands/manufacturers, routes/salesmen and archive history needed for analysis.

## Accounting
Build reconciliable, balanced posted history so profit/cash/receivable intelligence reads accounting truth rather than re-inventing it.

## Inventory
Preserve immutable stock movement, valuation/cost references, godown/batch context and movement source lineage.

## Purchase
Preserve supplier/rate/free-qty/landed-cost history and source line references.

## Sales
Preserve item/party/rate/discount/scheme/tax/cost snapshots, salesperson/route and payment context needed for profitability/trend analysis.

## POS
Preserve cashier/shift/payment mix/hourly transaction facts.

## Pricing/Schemes
Store applied-rule trace so intelligence can explain discount/scheme impact.

## Credit/Outstanding
Preserve allocations, ageing dates, credit limits, overrides and collection history.

## Reports/MIS
This is where deterministic MetricService/IntelligenceService can become a formal implemented module, backed by authoritative prior domains.

---

# 4. Add Future Intelligence Phases

Add these roadmap targets after the core ERP/report foundation is mature.

## Module/Phase — Deterministic Intelligence Core

Scope:
- metric registry;
- retail intelligence;
- wholesale/distribution intelligence;
- inventory velocity;
- margin analysis;
- customer/supplier trends;
- credit/collection attention;
- explainable alerts;
- recommendations;
- source drill-down;
- saved intelligence filters.

Acceptance:
- every metric documented;
- permission scoped;
- company/branch/godown safe;
- reconciles to source data;
- no mutation of ERP truth;
- heavy queries do not block billing.

## Module/Phase — EVOLIX AI Business Assistant

Build after trusted reports/intelligence exist.

Order:
1. in-app EVOLIX Messenger;
2. read-only typed tools;
3. multilingual questions;
4. contextual follow-ups;
5. tables/charts;
6. PDF/XLSX report generation;
7. proactive permissioned alerts;
8. WhatsApp Business adapter;
9. carefully approved action tools.

The AI phase is not allowed to bypass missing report/domain APIs using raw SQL.
