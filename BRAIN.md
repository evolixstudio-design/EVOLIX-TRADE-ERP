# BRAIN.md — EVOLIX Trade ERP Engineering Brain

> This file is the persistent engineering contract for AI coding assistants and developers working on EVOLIX Trade ERP.
> Read this file before planning or modifying the codebase.

---

## 1. Product Identity

**Product:** EVOLIX Trade ERP  
**Category:** Local-first hybrid ERP for wholesale, retail, distribution, pharmacy/FMCG and light manufacturing.

This is a **clean-slate EVOLIX product**.

Do not:
- copy Marg ERP code, UI, assets, proprietary database structures, undocumented protocols or trademarks;
- reuse code, schemas, credentials, migrations, seed data or architecture from unrelated production systems;
- connect development code to any unrelated live production database.

Implement business capabilities from our own PRD and lawful/public requirements using original code and UX.

---

## 2. Non-Negotiable Architecture

```text
Office users
   │
   ├─ Browser/PWA / optional thin client
   │
LAN
   │
EVOLIX Server
   ├─ React frontend
   ├─ FastAPI backend
   ├─ PostgreSQL
   ├─ worker/scheduler
   ├─ print bridge
   ├─ backup agent
   └─ sync outbox
          │
          └──── Internet ──── EVOLIX Cloud
                              backup
                              remote owner view
                              branch sync
                              notifications
                              statutory adapters
                              update metadata
```

### Golden rule

**The local office must continue core billing, purchasing, inventory, accounting and printing when the internet is unavailable.**

Do not introduce a cloud dependency into a core posting path.

---

## 3. Preferred Stack

Backend:
- Python
- FastAPI
- SQLAlchemy 2.x
- Alembic
- Pydantic
- PostgreSQL

Frontend:
- React
- TypeScript
- TanStack Query
- accessible component system
- keyboard-first business forms

Tests:
- Pytest
- Vitest
- Playwright

Tooling:
- Ruff
- TypeScript strict mode
- deterministic formatting
- CI gates

Use a local PostgreSQL database for development unless the project owner explicitly authorizes another EVOLIX-specific environment.

---

## 4. Repository Rules

Suggested structure:

```text
/
├─ backend/
│  ├─ app/
│  │  ├─ api/
│  │  ├─ core/
│  │  ├─ db/
│  │  ├─ models/
│  │  ├─ schemas/
│  │  ├─ services/
│  │  ├─ modules/
│  │  ├─ integrations/
│  │  ├─ reports/
│  │  └─ workers/
│  └─ tests/
├─ frontend/
│  ├─ src/
│  │  ├─ app/
│  │  ├─ components/
│  │  ├─ features/
│  │  ├─ lib/
│  │  ├─ routes/
│  │  └─ i18n/
├─ installer/
├─ docs/
├─ scripts/
├─ scratchpad/
└─ BRAIN.md
```

### Scratchpad rule

Temporary:
- audit scripts
- throwaway migrations
- one-off validators
- generated test files
- experiments
- migration exploration
- disposable exports

go in `scratchpad/`.

**Production/runtime code must never depend on `scratchpad/`.**

---

## 5. Work Method for Every Task

Before coding:
1. identify affected module;
2. identify data ownership/company scope;
3. identify permissions;
4. identify accounting impact;
5. identify stock impact;
6. identify tax impact;
7. identify audit requirements;
8. identify offline/cloud behavior;
9. identify migrations;
10. identify tests.

Then produce a short implementation plan.

After coding:
1. run backend tests;
2. run frontend tests;
3. run type/lint checks;
4. run relevant E2E;
5. inspect migration;
6. manually test in running product;
7. update docs;
8. provide a manual testing checklist.

Never call a module complete without the manual checklist.

---

## 6. Data Isolation

Every business entity must have explicit ownership.

At minimum, consider:
- organization
- site
- company
- branch
- financial year
- godown

Never rely only on a UI filter for isolation.

All queries handling tenant/company data must enforce scope server-side.

Security tests must prove:
- Company A cannot read Company B.
- Branch restrictions work.
- Godown restrictions work.
- A forged URL/body cannot bypass scope.
- Reports use the same isolation rules as CRUD endpoints.

---

## 7. Database Rules

### IDs

Use UUID/ULID-style identifiers for distributed entities.

Human document numbers:
- are not primary keys;
- use a separate number-series service;
- must be concurrency-safe;
- may vary by branch/year/document type.

### Money

Never use binary floating point for money.

Use PostgreSQL `NUMERIC` / Python `Decimal`.

### Quantity

Use fixed decimal with item/UOM precision.

### Timestamps

Store UTC for technical timestamps.
Preserve business date separately where required.

### Deletion

Master records referenced by posted transactions are not physically deleted.
Use inactive/archive status.

Posted transaction documents are never physically deleted.

---

## 8. Transaction Posting Engine

The posting service is critical infrastructure.

A business document can be:

- draft
- approved
- posted
- cancelled/reversed

Posting must be **atomic**.

Example invoice post transaction:
1. validate document;
2. validate permissions;
3. validate financial period;
4. validate credit rule;
5. validate stock rule;
6. finalize tax snapshot;
7. reserve/finalize document number;
8. write invoice;
9. write stock movements;
10. write accounting voucher;
11. write audit record;
12. write integration outbox events;
13. commit.

If steps 1–12 do not succeed, do not leave a partially posted invoice.

External APIs are never called inside the critical database transaction.

---

## 9. Accounting Invariants

All posted vouchers:

```text
SUM(debit) == SUM(credit)
```

No exception.

Business modules must use a posting profile/service rather than manually constructing arbitrary ledger entries throughout the codebase.

Required automated invariants:
- sale posts correct receivable/cash + tax + revenue;
- purchase posts correct payable + input tax + inventory/expense;
- returns reverse appropriate effects;
- cancellation produces valid reversal;
- opening balances remain balanced;
- rounding is explicit.

Never "fix" imbalance by silently adding a suspense amount.

---

## 10. Inventory Invariants

Stock is movement-based.

Never treat a mutable `current_stock` field as the only source of truth.

Source:
`StockMovement`

Optional projection/cache:
`StockBalanceProjection`

Movement fields:
- company
- branch
- godown
- item
- batch/serial
- quantity delta
- UOM/base quantity
- business date
- source document
- movement type
- cost layer reference
- created timestamp

For synchronized branches, stock replication is movement/event based.
Never use last-write-wins for stock quantities.

---

## 11. Batch and Expiry

When `item.batch_required = true`:
- every inward/outward stock movement must reference a valid batch unless an explicitly authorized migration/opening path applies.

When `item.expiry_required = true`:
- batch requires expiry.

FEFO is a selection strategy, not a destructive rewrite.
Users with permission may override and the reason is audited.

Expired/blocked batches cannot be sold unless policy + permission explicitly allows it.

---

## 12. Tax Architecture

Core ERP must not know provider-specific details.

Use adapters:

```text
TaxCalculationService
GSTValidationAdapter
EInvoiceAdapter
EWayBillAdapter
GSTReturnExportAdapter
```

Tax configuration must be effective-dated.

Never hardcode a statutory threshold into frontend logic if it can change.

Store the calculation snapshot on posted documents:
- HSN
- rate
- taxable value
- tax components
- place of supply
- rule/version reference

This preserves historical correctness when tax configuration changes later.

---

## 13. GST / External Integration Rule

Flow:

```text
Local document posted
        │
        ├─ commit local transaction
        │
        └─ create IntegrationJob/OutboxEvent
                    │
                    ▼
                worker
                    │
        external provider / government gateway
```

Requirements:
- idempotency
- retries
- exponential backoff
- terminal failure state
- manual retry
- provider request/response audit with secret redaction
- readable error shown to operator

A provider outage must not corrupt the local invoice.

---

## 14. Offline / Hybrid Sync

Local office data is authoritative for local transactions.

Outbox pattern:

```text
business transaction
   └─ same DB transaction writes SyncEvent
          └─ worker sends later
```

Each sync event:
- globally unique id
- source site
- sequence
- entity type/id
- operation/event type
- entity version
- timestamp
- payload/reference
- checksum optional

Consumer must be idempotent.

### Conflict policy

Never invent one global merge strategy.

Examples:
- central price list: central wins
- party phone/name: owner/manual merge
- posted invoice: immutable, no overwrite
- stock: movement events only
- master delete: tombstone/archive
- numbering: branch-specific series

Every conflict has a visible resolution record.

---

## 15. Auth and Security

Implement:
- password hashing with modern KDF
- session management
- optional TOTP
- lockout
- password history
- revoke sessions
- device/session visibility
- audit
- role/permission checks server-side

Never:
- trust frontend permissions;
- store plaintext secrets;
- log access tokens/passwords;
- expose PostgreSQL to internet;
- ship default universal admin credentials in production.

---

## 16. Permission Convention

Permission strings:

```text
<module>.<resource>.<action>
```

Examples:

```text
sales.invoice.read
sales.invoice.create
sales.invoice.post
sales.invoice.cancel
sales.invoice.override_price
sales.invoice.override_credit
purchase.invoice.approve
inventory.adjustment.post
accounts.journal.post
reports.profit_loss.view
admin.backup.restore
```

Do not use a single coarse "admin vs user" check for business operations.

---

## 17. Approval Engine

Use one reusable approval engine.

Do not build separate one-off approval tables for every module.

`ApprovalRequest`:
- target type
- target id
- rule
- requestor
- approver
- status
- reason
- decision comment
- timestamps

Supports:
- discount override
- minimum-rate override
- credit override
- backdated voucher
- stock adjustment
- invoice cancel
- purchase approval
- financial period reopen

---

## 18. Configuration Registry

Do not create hundreds of untracked booleans.

A configuration entry has:
- key
- type
- allowed scope
- default
- validator
- description
- feature dependency
- sensitivity
- audit behavior

Resolution order can be:
`system → organization → company → branch → user`

Only use user override for settings that genuinely belong to a user.

---

## 19. Sales UX Rules

The billing screen is a performance-critical UI.

Must support:
- keyboard-only workflow;
- barcode input;
- quick party search;
- quick item search;
- focus management;
- last rate;
- party price;
- batch selection;
- scheme feedback;
- running total;
- credit status;
- save/post shortcuts;
- print shortcut.

Avoid:
- slow animated transitions;
- unnecessary modal dialogs;
- mandatory mouse usage;
- network round-trip per keystroke;
- fetching huge full master lists.

Use indexed server search + client debouncing/caching.

---

## 20. POS Rules

POS:
- runs against LAN server;
- does not require internet;
- supports barcode-first flow;
- supports hold/resume;
- supports split payment;
- tracks cashier shift;
- supports controlled return/exchange;
- prints locally.

Cash drawer is triggered only after a valid payment/save event based on configuration.

---

## 21. Printing Rules

Printing is operationally critical.

Support:
- A4
- A5
- 80mm
- 58mm where required
- labels

Keep rendering deterministic.

Templates use a constrained system.
Do not execute arbitrary code from customer templates.

Print failures must not roll back an already-posted invoice.
Allow reprint with audit if policy requires it.

---

## 22. Reports

Reports must:
- enforce company/branch permissions;
- use server-side filtering;
- paginate when interactive;
- stream/generate large exports asynchronously;
- use read-optimized queries;
- never mutate business data.

Heavy reports must not block billing.

Consider:
- dedicated read replica in cloud later;
- local materialized projections;
- cached aggregates with explicit freshness.

---

## 23. Backup Rules

A successful `pg_dump` call alone is not enough.

Backup lifecycle:
- start
- dump/snapshot
- encrypt
- checksum
- store local
- optional upload
- verify
- record result
- alert on failure

Keep metadata:
- backup id
- schema/app version
- company/site
- started/completed
- size
- checksum
- destination
- encryption version
- verification state

Periodically perform automated or supervised restore drills.

---

## 24. Restore Rules

Restore is privileged.

Before restore:
- maintenance mode
- verify checksum
- verify compatibility
- snapshot current database if possible

After restore:
- run migrations
- integrity checks
- accounting invariant spot checks
- stock projection verification
- reopen service
- generate report

Never overwrite a live customer database with a test database.

---

## 25. Installer Rules

Server installation must be reproducible.

Installer must:
- verify Windows version;
- verify disk/RAM;
- install/configure prerequisites;
- configure PostgreSQL securely;
- create services;
- configure firewall only for required LAN ports;
- create local TLS;
- initialize database;
- create first admin;
- configure backup;
- run health checks;
- provide recovery instructions.

Do not require users to manually install Python/Node/PostgreSQL in production.

---

## 26. Update System

Updates:
- signed manifest
- signed packages
- schema compatibility check
- pre-update backup
- migration
- health check
- rollback strategy

Never auto-apply a destructive major migration during active billing hours without explicit admin policy.

Local ERP should keep running if update service is offline.

---

## 27. Error Handling

Errors are:
- validation
- permission
- conflict
- business rule
- integration
- infrastructure

Return stable machine codes plus human messages.

Example:

```json
{
  "code": "CREDIT_LIMIT_EXCEEDED",
  "message": "Projected exposure exceeds the customer's credit limit.",
  "details": {
    "limit": "100000.00",
    "projected": "112540.00"
  }
}
```

Do not leak tracebacks to users.

---

## 28. Logging

Diagnostic logs:
- structured
- rotated
- correlation ID
- no secrets

Audit logs:
- separate purpose
- business meaningful
- append-oriented
- cannot be casually purged by normal admins

Do not confuse diagnostic logs with compliance audit.

---

## 29. API Rules

- `/api/v1`
- predictable nouns
- typed schemas
- explicit status transitions
- idempotency header/key for retryable creates
- optimistic concurrency on mutable masters
- filtering/pagination
- stable error codes

Avoid endpoints like:
- `/doEverything`
- arbitrary query execution
- generic unrestricted entity update

---

## 30. Frontend Rules

TypeScript strict.

Keep:
- API layer centralized
- feature modules
- reusable data grids/forms
- route-level permission checks for UX
- server-side permission checks for security
- i18n strings externalized
- no hardcoded API base URLs
- no duplicate domain calculations that can drift from backend

Backend is authoritative for:
- tax
- totals
- stock eligibility
- credit checks
- posting
- permissions

Frontend can preview but must not be authority.

---

## 31. Migration Discipline

Every schema change:
- Alembic migration
- upgrade tested
- downgrade where reasonably safe
- existing data considered
- indexes included
- defaults/backfills explicit

Avoid long blocking table rewrites on production-sized tables.

For risky migrations:
- expand
- backfill
- switch
- contract later

---

## 32. Testing Gates

### Backend
- unit
- service
- database integration
- API
- permission isolation
- accounting invariants
- stock invariants

### Frontend
- unit/component
- forms/validation
- keyboard behavior
- permissions
- error states

### E2E
At minimum:
- create customer
- create item
- purchase stock
- sell stock
- collect payment
- view ledger
- return invoice
- stock transfer
- POS sale
- backup
- restore smoke

### Offline/hybrid
- internet removed while LAN works
- invoice still posts
- print still works
- worker queues
- internet restored
- sync resumes exactly once

---

## 33. Manual Test Checklist Required After Every Module

Always provide the user a checklist with:

1. happy path
2. permissions/RBAC
3. validation/error cases
4. tenant/company isolation
5. branch/godown isolation if relevant
6. English/Hindi behavior
7. responsive/mobile behavior if relevant
8. keyboard workflow
9. printing/export
10. audit history
11. offline behavior
12. restart/recovery behavior
13. module-specific critical scenarios

Include **expected result** for every step.

---

## 34. Module Dependency Order

```text
Foundation
  ↓
Identity/RBAC
  ↓
Company/Financial Year/Config
  ↓
Masters
  ├─────────────┐
  ↓             ↓
Accounting    Inventory
  │             │
  └──────┬──────┘
         ↓
   Sales/Purchase
         ↓
  POS/Barcode/Orders
         ↓
GST/Bank/Credit/Reports
         ↓
Distribution/Delivery
         ↓
Pharma/Batch Advanced
         ↓
Cloud Sync/Multi-Branch
         ↓
Manufacturing/Advanced MIS
```

Do not build advanced modules by bypassing foundation services.

---

## 35. Core Services That Must Be Reused

Build these once:

- `NumberSeriesService`
- `PostingService`
- `TaxService`
- `StockService`
- `PricingService`
- `PromotionService`
- `CreditService`
- `ApprovalService`
- `AuditService`
- `PrintService`
- `NotificationService`
- `BackupService`
- `SyncService`
- `IntegrationJobService`

Do not duplicate their rules inside controllers/components.

---

## 36. Pricing Engine Order

Define deterministic evaluation.

Suggested:
1. explicit contract/party-item rate
2. party price list
3. quantity slab
4. promotional scheme
5. permitted manual discount
6. bill-level discount
7. tax
8. charges/rounding

The exact hierarchy must be configuration-driven where required, but the applied rule trace must be stored.

---

## 37. Document Status Rules

Generic pattern:

```text
DRAFT
  ↓
PENDING_APPROVAL
  ↓
APPROVED
  ↓
POSTED
  ↓
CANCELLED/REVERSED
```

Not every document requires all states.

A posted document:
- cannot be edited as if it were a draft;
- uses amendment/reversal workflow;
- retains original number/history.

---

## 38. Concurrency

Protect:
- invoice numbering
- stock allocation
- batch quantity
- credit exposure
- cashier close
- period close
- sync checkpoints

Use database constraints/transactions/locking, not frontend assumptions.

Test two users posting at the same time.

---

## 39. Search

Master search must support:
- normalized name
- code
- aliases
- barcode
- phone
- GSTIN
- item brand/category
- salt/generic where enabled

Use database indexes/trigram/full-text as appropriate.

Do not load 100k items into a browser dropdown.

---

## 40. Import Engine

All imports:
- stage first
- validate
- preview
- error report
- explicit commit

Import should never silently create duplicate GSTINs/SKUs based only on ambiguous names.

Support idempotent re-import where possible.

---

## 41. Localization

Primary:
- English
- Hindi-ready

Architecture:
- translation keys
- locale-aware date/number
- no concatenated translatable sentences
- print template localization
- user language may override company default

Do not translate accounting/tax identifiers incorrectly; maintain domain glossary.

---

## 42. Performance Budgets

Target:
- item search < 200 ms p95 local
- ordinary invoice save < 800 ms p95 local
- barcode line add < 150 ms after scan handling
- normal reports < 2 sec where practical
- large export asynchronous

Any PR that introduces per-line API calls into invoice entry must be rejected unless justified and measured.

---

## 43. Mobile Apps

Mobile apps are sync clients, not hidden second ERPs.

Field sales:
- order
- collection
- retailer
- visit
- catalogue

Delivery:
- assignments
- status
- POD
- collection

Owner:
- reports
- approvals
- alerts

All mobile mutations use server authorization and idempotency.

---

## 44. Privacy / Location

GPS features:
- optional
- permission based
- purpose-limited
- visible policy
- configurable retention

Do not collect continuous location merely because the device permits it.

---

## 45. Cloud Boundary

Cloud may host:
- backups
- branch synchronization
- remote report projections
- notifications
- update metadata
- licensing
- external integration gateways

Cloud must not:
- become mandatory for local invoice posting;
- own unencrypted customer backup data by accident;
- bypass local permissions;
- mutate local financial transactions without a defined sync command/event.

---

## 46. Feature Flag Strategy

Feature flags are explicit.

Example:
```text
FEATURE_RETAIL_POS
FEATURE_BATCH
FEATURE_EXPIRY
FEATURE_PHARMACY
FEATURE_FIELD_SALES
FEATURE_DELIVERY
FEATURE_MANUFACTURING
FEATURE_MULTI_BRANCH_SYNC
```

A disabled module:
- hides navigation;
- rejects API actions;
- does not break shared core data.

---

## 47. Code Review Questions

Before merging, reviewer asks:

- Does this respect company scope?
- Does it create/modify financial or stock effects?
- Is the transaction atomic?
- Is permission server-side?
- Is audit present?
- Are decimals correct?
- Is concurrency safe?
- Is integration retry-safe?
- Does internet failure break local work?
- Are migrations safe?
- Are tests meaningful?
- Is duplicate domain logic being introduced?
- Is the UI fast for keyboard users?

---

## 48. Prohibited Shortcuts

Never:
- disable foreign keys to "fix" imports;
- use floats for money;
- hard-delete posted invoices;
- edit ledger balances directly;
- edit stock totals directly;
- call external GST APIs inside DB transaction;
- expose arbitrary SQL execution to customers;
- put business logic only in React;
- use admin role as a universal bypass in code;
- ignore failed background jobs;
- mark a test skipped permanently without issue/reason;
- connect to unrelated live databases;
- make runtime depend on `scratchpad/`.

---

## 49. Documentation Required

Maintain:
- architecture
- deployment
- backup/restore
- migration
- API
- permission matrix
- accounting posting rules
- stock movement rules
- tax adapters
- support runbook
- release notes
- customer admin guide

Critical operational knowledge must not exist only in chat history.

---

## 50. Production Support Console

Build an admin-only local support page exposing:
- version
- DB version
- migrations
- uptime
- health
- disk
- backup
- latest restore drill
- sync queue
- failed integration jobs
- license
- printers
- recent errors
- safe diagnostic bundle export

Never expose secrets in diagnostic bundles.

---

## 51. Recovery Philosophy

The ERP is business-critical.

Design every service assuming:
- internet can fail;
- Windows can restart;
- printer can fail;
- GST provider can fail;
- cloud can fail;
- user can double-click;
- user can submit twice;
- power can fail;
- disk can fill;
- one branch can be offline for hours.

Failures must become visible states, not silent corruption.

---

## 52. AI Assistant Response Contract

When asked to implement a module:

1. cite the PRD section being implemented;
2. inspect existing code before proposing replacements;
3. preserve established architecture unless there is a demonstrated issue;
4. produce the smallest coherent change;
5. include migrations;
6. include tests;
7. run checks;
8. report exact files changed;
9. report test results;
10. give a manual test checklist.

If requirements conflict:
- stop and surface the conflict;
- do not silently choose a behavior that risks accounting, stock or tenant isolation.

---

## 53. Current Product North Star

A customer should be able to unplug the internet and still:

- log in locally,
- create a sale,
- scan barcode,
- print invoice,
- make purchase entry,
- transfer stock,
- receive/payment vouchers,
- view local ledger,
- view local stock,
- close cashier shift.

When internet returns:
- backups resume,
- mobile orders sync,
- delivery updates sync,
- remote owner dashboards refresh,
- notification jobs resume,
- statutory integration jobs retry,

with **no duplicate invoices, duplicate stock movements or duplicate accounting entries**.

That is the defining engineering promise of EVOLIX Trade ERP.
