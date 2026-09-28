# ENGINEERING_EXECUTION_PROTOCOL.md — Antigravity Module Execution Intelligence

**Status:** Mandatory workflow for every module/task  
**Goal:** Prevent feature-only implementation and force whole-system reasoning before code changes.

---

# 1. Before Coding — Impact Matrix

For every meaningful task, Antigravity must produce a short impact matrix.

```text
MODULE / TASK:

Ownership:
- organization:
- company:
- branch:
- godown:
- financial year:

RBAC:
- read permission:
- create permission:
- modify permission:
- post permission:
- cancel/reverse permission:
- sensitive visibility:

Accounting impact:
- none / yes
- voucher/posting profile:
- reversal impact:

Inventory impact:
- none / yes
- movement types:
- quantity/cost implications:

GST/tax impact:
- none / yes
- snapshot requirements:

Audit:
- events:
- reason required?:

Offline behavior:
- must work on LAN without internet?:
- external integration deferred?:

Concurrency/idempotency:
- duplicate-submit risk:
- locking/constraint requirement:

Migration:
- schema change?:
- index/backfill?:

Reporting/intelligence:
- facts produced:
- drill-down source:
- historical snapshots needed:

Tests:
- unit:
- integration:
- API/E2E:
- regression:
```

If a category is not applicable, explicitly say `N/A`.

---

# 2. Smallest Coherent Change

Do not solve one screen by bypassing architecture.

Examples:

- Do not calculate GST only in React.
- Do not update stock totals directly from Sales.
- Do not create a second customer-balance engine in Reports.
- Do not let AI query raw tables to avoid building report services.
- Do not implement a one-off approval table when the shared approval engine exists.

Prefer the smallest change that remains coherent with shared services.

---

# 3. Service Reuse Check

Before adding business logic, inspect whether it belongs to or reuses:

- NumberSeriesService
- PostingService
- TaxService
- StockService
- PricingService
- PromotionService
- CreditService
- ApprovalService
- AuditService
- PrintService
- NotificationService
- BackupService
- SyncService
- IntegrationJobService

Future/read-only services:

- MetricService
- IntelligenceService
- AlertService
- RecommendationService

Do not duplicate their rules in controllers/components.

---

# 4. Data-for-the-Future Check

Before finalizing schema/API design, ask:

- Will a future report be able to reconstruct the historical truth?
- Will an owner be able to drill down from a KPI to source transactions?
- Will cancellation/reversal remain visible?
- Is the original rate/tax/cost preserved where history requires it?
- Is company/branch/godown context preserved?
- Can an AI/report tool use a stable service rather than raw SQL?

If not, fix the domain model now rather than inventing analytics later.

---

# 5. Implementation Sequence

For each module:

```text
Read requirements/docs
→ inspect existing code
→ produce impact matrix
→ define data/migration
→ define permissions
→ implement backend domain/service
→ implement API
→ implement frontend
→ add tests
→ run module tests
→ run affected regression
→ run MODULE_COMPLETION_QA_GATE
→ run INTELLIGENCE_READINESS_GATE
→ fix discovered issues
→ start backend/frontend
→ provide URLs + local test credentials
→ provide manual checklist
→ WAIT for user verification
```

Do not automatically continue to the next module.

---

# 6. Mandatory Regression Rule

If shared domain logic changes, rerun representative earlier workflows.

Examples:

Sales touches Party + Item + Stock + Accounting + Tax.

Purchase touches Supplier + Stock + Cost + Accounting + Tax.

Payment touches Party + Ledger + Outstanding + Banking/Cash.

Reporting changes do not get permission to mutate these domains.

---

# 7. Completion Report Addition

Every module completion report must contain:

```text
INTELLIGENCE READINESS:
- facts produced:
- historical snapshots preserved:
- source lineage:
- drill-down possible:
- company/branch/godown scope:
- Decimal safety:
- cancellation/reversal lineage:
- report/API reuse:
- future AI tool safe?:
- unresolved intelligence debt:
```

Any unresolved issue that could make future reports materially wrong is a completion blocker.
