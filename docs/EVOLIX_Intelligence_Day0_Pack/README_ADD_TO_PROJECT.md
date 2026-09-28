# EVOLIX Intelligence Day-0 Pack

**Purpose:** Add intelligence-readiness to EVOLIX Trade ERP from the first module without making AI a dependency of core ERP operation.

Copy every file in this pack into the root engineering-docs area of the EVOLIX project (or `/docs` if that is the project convention).

## Required read order for Antigravity

1. `EVOLIX_Trade_ERP_PRD.md`
2. `BRAIN.md`
3. Existing core engineering docs (`ARCHITECTURE.md`, `MODULE_ROADMAP.md`, `DATABASE_SCHEMA.md`, `RBAC_MATRIX.md`, `ACCOUNTING_RULES.md`, `INVENTORY_RULES.md`)
4. `MODULE_COMPLETION_QA_GATE.md`
5. **This intelligence pack**
   - `BRAIN_INTELLIGENCE_ADDENDUM.md`
   - `INTELLIGENCE_ARCHITECTURE.md`
   - `ENGINEERING_EXECUTION_PROTOCOL.md`
   - `INTELLIGENCE_READINESS_GATE.md`
   - `AI_BUSINESS_ASSISTANT_ARCHITECTURE.md`
   - `MODULE_ROADMAP_INTELLIGENCE_PATCH.md`

## Core principle

EVOLIX has two intelligence layers:

1. **Engineering intelligence** — forces every module to be designed with company scope, RBAC, accounting, stock, GST, audit, offline behavior, concurrency, migrations, reporting and future AI-readiness in mind.
2. **Business intelligence** — deterministic metrics, trends, alerts, explanations and recommendations derived from authoritative ERP data.

A future **EVOLIX AI Business Assistant** may provide natural-language chat, multilingual questions, follow-up context and PDF reports. It must call safe ERP/report tools and must never use arbitrary SQL or bypass RBAC.

## Day-0 rule

Do not build all intelligence services immediately. Build the **data quality, contracts, traceability and service boundaries** that make them possible later.

Core billing, inventory, accounting, purchase, printing and LAN operation must continue even if cloud/AI/WhatsApp is unavailable.
