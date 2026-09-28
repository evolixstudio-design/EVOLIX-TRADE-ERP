# ARCHITECTURE.md — EVOLIX Trade ERP

**Status:** Authoritative architecture specification  
**Applies to:** EVOLIX Trade ERP / Wholesale + Retail ERP  
**Audience:** Developers, Antigravity, Copilot, reviewers, deployment/support engineers

---

# 1. Purpose

This document defines the required technical architecture for EVOLIX Trade ERP.

All implementation work must follow this document unless the project owner explicitly approves an architectural change.

The product is a **Multi-Tenant SaaS ERP Platform**.

Core business functions are designed to operate securely in the cloud, serving multiple independent organizations from a single centralized deployment.

## Connected ERP Principle

EVOLIX Trade operates as ONE CONNECTED BUSINESS SYSTEM, not a collection of isolated modules.

**Core principle:** ENTER A BUSINESS EVENT ONCE → AUTOMATICALLY PROPAGATE ALL VALID BUSINESS EFFECTS.

**Sales Integration Principle:**
Sales must NOT maintain independent:
- stock truth
- accounting truth
- receivable truth
- dashboard truth
- reporting truth

Sales creates the business event and delegates authoritative effects to:
Sales Posting
→ InventoryPostingService
→ AccountingPostingService
→ Receivable/AR
→ Audit/Lineage

Do not introduce duplicate ledgers or manually maintained balances.

```text
USER
  ↓
RBAC / SCOPE (company, branch, godown, permissions)
  ↓
BUSINESS TRANSACTION (invoice, receipt, transfer, etc.)
  ↓
VALIDATION (master data, stock, credit, period, permissions)
  ↓
BUSINESS EVENT (atomic posting within single DB transaction)
  ↓
DOMAIN EFFECTS (all within same DB transaction)
  ├── Inventory (stock movements)
  ├── Customer/Supplier (outstanding/payable)
  ├── Cash/Bank (balance changes)
  ├── Accounting (voucher + lines, debit = credit)
  ├── Tax/GST (tax snapshots, output/input tax)
  └── Audit (who, what, when, from where)
  ↓
REPORTING / READ MODELS (derived from authoritative data)
  ↓
INTELLIGENCE / DRILL-DOWN (metric → entity → transaction → lines → effects)
```

**Transaction IDs / Correlation / Linkage:**
- Every accounting voucher carries `source_document_type` + `source_document_id`
- Every stock movement carries `source_document_type` + `source_document_id` + `source_line_id`
- Every bill allocation carries `reference_document_type` + `reference_document_id`
- Cancellation/reversal documents link to the original
- This ensures complete lineage from any downstream effect back to the source business event

**No Duplicated Independent Business Truths:**
- There is ONE stock truth: `stock_movements` (with `stock_balance_projection` as rebuildable cache)
- There is ONE accounting truth: `vouchers` + `voucher_lines`
- There is ONE outstanding truth: `bill_allocations` against `voucher_lines`
- Reports, dashboards, and intelligence ALL derive from these same sources
- A sales invoice must not have one stock truth and another unrelated stock truth

See BUSINESS_WORKFLOW.md, TRANSACTION_WORKFLOW.md, and BUSINESS_EVENT_IMPACT_MATRIX.md for detailed workflow specifications.


---

# 2. Architectural Principles

1. EVOLIX Trade is a strict Multi-Tenant SaaS platform.
2. PostgreSQL is the central, shared transactional source of truth for all tenants.
3. Tenant Data Isolation is strictly enforced server-side.
4. All financial transactions must be atomic.
5. All stock transactions must be movement-based.
6. All data is scoped by Organization (Tenant), Company, and Branch server-side.
7. Business logic belongs in backend domain/services, not in React components.
8. External integrations are asynchronous and retry-safe.
9. Posted financial documents are immutable from an ordinary user's perspective.
10. Every sensitive action is permissioned and auditable.
11. Production/runtime code must never depend on `scratchpad/`.

---

# 2.1 Multi-Tenant Planes

The architecture distinguishes two distinct execution planes:

**PLATFORM LEVEL (NOT YET IMPLEMENTED)**
- Platform identity (Super Admin)
- Platform administration
- Tenant lifecycle (Creation, Suspension)
- Plans, Subscriptions, Feature Entitlements
- Platform Audit

**TENANT ERP LEVEL (DESIGNED & IMPLEMENTED)**
- Organization (SaaS Tenant identity)
- Companies & Branches
- Users, Roles, Permissions
- ERP Transactions (Sales, Purchase, Inventory, Accounting, Payments)
- Reports & Intelligence

---

# 3. High-Level Architecture

```text
                         EVOLIX CLOUD PLATFORM
        ┌────────────────────────────────────────────────────────────┐
        │ ┌──────────────────────┐   ┌─────────────────────────────┐ │
        │ │ Platform Control     │   │ Tenant A (Al Noor Hardware) │ │
        │ │ - Super Admin        │   │ - ERP Services              │ │
        │ │ - Billing/Plans      │   │ - Dedicated Data Scope      │ │
        │ └──────────────────────┘   └─────────────────────────────┘ │
        │ ┌──────────────────────┐   ┌─────────────────────────────┐ │
        │ │ Tenant B (XYZ Trade) │   │ Shared Infrastructure       │ │
        │ │ - ERP Services       │   │ - PostgreSQL Database       │ │
        │ │ - Dedicated Scope    │   │ - Background Workers        │ │
        │ └──────────────────────┘   └─────────────────────────────┘ │
        └──────────────────────────────┬─────────────────────────────┘
                                       │ HTTPS / TLS
                  ┌────────────────────┴────────────────────┐
                  │                                         │
            Super Admin Browser                        Tenant Browsers
```

---

# 4. Technology Stack

## 4.1 Backend

- Node.js
- NestJS
- Prisma ORM
- TypeScript
- PostgreSQL
- Vitest

Backend responsibilities:

- authentication
- authorization
- company/branch isolation
- business rules
- transaction posting
- accounting
- inventory
- tax calculations
- pricing
- approvals
- integrations
- backup metadata
- sync metadata
- reporting APIs
- audit

---

# 5. Frontend

- React
- TypeScript
- Tailwind CSS or equivalent approved utility system
- TanStack Query
- strict TypeScript
- browser/PWA first
- optional Tauri/Electron wrapper only if later required

Frontend responsibilities:

- user interaction
- data entry
- responsive layouts
- keyboard workflows
- validation feedback
- loading/error/empty states
- permissions for navigation visibility

Frontend must NOT be authoritative for:

- accounting calculations
- tax calculations
- stock availability
- credit limits
- posted document totals
- permission enforcement
- final invoice posting

---

# 6. Database

Primary database:

```text
PostgreSQL (Shared Multi-Tenant)
```

Development:

```text
Local PostgreSQL instance
```

Production:

```text
Cloud Managed PostgreSQL (e.g., AWS RDS, Supabase)
```

The database relies on application-level foreign keys (`organization_id`, `company_id`) and strict server-side context resolution to enforce isolation. Future iterations may adopt Row-Level Security (RLS) for defense-in-depth.

---

# 7. Application Layering

Backend structure:

```text
API / Controllers
      ↓
Application Services
      ↓
Domain Services
      ↓
Repositories / Data Access
      ↓
PostgreSQL
```

Recommended layout:

```text
backend/app/
├── api/
├── core/
├── db/
├── models/
├── schemas/
├── services/
├── modules/
├── integrations/
├── reports/
├── workers/
└── security/
```

Rules:

- API routes remain thin.
- Domain calculations never live directly in route functions.
- Database queries never live directly in React.
- Modules may depend on shared core services.
- Circular dependencies between modules are prohibited.

---

# 8. Module Boundaries

Primary bounded areas:

```text
foundation
identity
company
configuration
masters
accounting
inventory
purchase
sales
pos
orders
returns
pricing
promotions
banking
credit
tax
barcode
dispatch
delivery
field_sales
retailer_portal
pharmacy
manufacturing
reports
notifications
backup
sync
licensing
printing
```

Modules communicate through service contracts and domain events where appropriate.

---

# 9. Core Reusable Services

The following must be implemented centrally:

```text
NumberSeriesService
PostingService
AccountingService
StockService
PricingService
PromotionService
TaxService
CreditService
ApprovalService
AuditService
NotificationService
PrintService
BackupService
SyncService
IntegrationJobService
```

No module may duplicate these responsibilities.

---

# 10. Transaction Architecture

Financial and stock posting must happen in one local database transaction.

Example sales invoice posting:

```text
BEGIN
  validate invoice
  validate user permission
  validate period
  validate party
  validate credit exposure
  validate stock
  calculate pricing
  calculate GST
  reserve invoice number
  insert invoice
  insert invoice lines
  insert stock movements
  insert accounting voucher
  insert voucher lines
  insert audit event
  insert outbox events
COMMIT
```

External API calls must happen after commit.

---

# 11. Document Lifecycle

Generic state model:

```text
DRAFT
  ↓
PENDING_APPROVAL
  ↓
APPROVED
  ↓
POSTED
  ↓
CANCELLED / REVERSED
```

Rules:

- draft can be edited;
- approved may require reapproval after material modification;
- posted cannot be freely edited;
- correction uses amendment/reversal;
- cancellation is audited;
- original posted values remain historically visible.

---

# 12. SaaS Cloud Behavior

Core ERP workflows run centrally in the cloud:

- login (JWT based, strictly verified)
- sales billing
- purchase entry
- POS billing
- stock transfer
- stock lookup
- ledger lookup
- receipt/payment entry
- reporting

Integration with external systems (GST, Email, WhatsApp) leverages cloud webhooks and background jobs.

---

# 13. Background Jobs

Background jobs include:

- cloud backup
- notification delivery
- tax integration
- remote sync
- report generation
- cleanup
- update checks
- license refresh

Every job must be:

- idempotent
- retry-safe
- observable
- auditable where business-critical
- capable of terminal failure status

---

# 14. Outbox Pattern

Transactions that require external sync must write an outbox event in the same database transaction.

Example:

```text
Sales invoice posted
        ↓
SyncEvent created
        ↓
DB transaction commits
        ↓
Worker reads SyncEvent
        ↓
Cloud API
```

This prevents:

```text
invoice saved but sync event lost
```

---

# 15. Sync Architecture

Each site has:

- `site_id`
- event sequence
- sync checkpoint
- outbox
- inbox
- retry state

Every synchronized entity uses globally unique identifiers.

Conflict rules are entity-specific.

Never use last-write-wins for stock or accounting.

---

# 16. Multi-Branch Design

Two models:

## 16.1 Central-only

Suitable only for customers with reliable connectivity.

## 16.2 Local-first branch model

Preferred.

```text
Branch A Server
      │
      ├──── Cloud Sync ────┐
      │                    │
Branch B Server            │
      │                    │
      └──── Cloud Sync ────┤
                           ▼
                   Central Reporting
```

Each branch keeps operating during internet outage.

Branch-specific numbering avoids collisions.

---

# 17. Identity Architecture

Authentication is local-capable.

User:

```text
User
Role
Permission
Session
PasswordHistory
MFASecret
RecoveryCode
```

Authorization always runs server-side.

---

# 18. Permission Model

Permission string:

```text
module.resource.action
```

Examples:

```text
sales.invoice.create
sales.invoice.post
sales.invoice.cancel
inventory.adjustment.post
accounts.voucher.post
reports.profit_loss.view
admin.backup.restore
```

Optional scopes:

```text
OWN
BRANCH
GODOWN
COMPANY
ALL_COMPANIES
```

---

# 19. Company Isolation

Every transactional query must include company scope.

Branch/godown constraints also apply.

A user must never access another company's data by modifying:

- URL
- request body
- query parameter
- API call
- export request
- report filter

---

# 20. Accounting Architecture

Accounting uses double-entry vouchers.

```text
Voucher
VoucherLine
LedgerAccount
BillAllocation
CostCenter
```

Invariant:

```text
SUM(debit) == SUM(credit)
```

Business modules call a centralized posting engine.

---

# 21. Inventory Architecture

Inventory source of truth:

```text
StockMovement
```

Projected stock:

```text
StockBalanceProjection
```

Projection may be rebuilt.

Never directly change a current stock field without a stock movement.

---

# 22. Pricing Architecture

Pricing engine resolves:

```text
Party contract
→ Price list
→ Quantity slab
→ Scheme
→ Discount
→ Tax
→ Charges
→ Round-off
```

Applied pricing rules must be traceable.

---

# 23. Tax Architecture

Use adapters.

```text
TaxService
  ├─ GSTCalculator
  ├─ GSTINValidator
  ├─ EInvoiceAdapter
  └─ EWayBillAdapter
```

Government/provider API details do not belong in sales logic.

---

# 24. Reporting Architecture

Transactional queries must not be allowed to overload billing.

Use:

- indexes
- pagination
- optimized query models
- aggregates
- materialized projections where justified
- async export for large reports

Future cloud reporting may use a read model.

---

# 25. Print Architecture

Printing should support:

- browser print
- local print bridge
- thermal printers
- A4
- A5
- labels
- receipt printers

Printing failure never rolls back a posted invoice.

---

# 26. Backup Architecture

```text
PostgreSQL
   ↓
Backup Engine
   ↓
Encrypted Archive
   ├─ Local Backup Disk
   └─ Cloud Backup
```

Backup must capture:

- app version
- schema version
- checksum
- timestamp
- site
- company metadata
- verification status

---

# 27. Restore Architecture

Restore must use maintenance mode.

```text
verify backup
→ snapshot current environment
→ restore
→ migrations
→ integrity checks
→ restart
→ health checks
```

---

# 28. Installer Architecture

Server installer:

```text
EVOLIX-ERP-Server-Setup.exe
```

It configures:

- PostgreSQL
- backend service
- frontend hosting
- worker
- backup service
- local hostname
- firewall
- first admin
- backup path

Client systems normally require only a browser/PWA.

Optional print bridge/client installer may be used.

---

# 29. Windows Services

Recommended:

```text
EvolixERP
EvolixWorker
EvolixBackupAgent
EvolixPrintBridge
```

Services restart automatically after failure/reboot.

---

# 30. Configuration

Configuration uses a typed registry.

Scopes:

```text
SYSTEM
ORGANIZATION
COMPANY
BRANCH
USER
```

Configuration changes are audited.

---

# 31. API Standard

Base:

```text
/api/v1
```

Guidelines:

- RESTful resources
- stable error codes
- explicit posting endpoints
- idempotency
- optimistic concurrency
- pagination
- search endpoints
- no generic SQL endpoints

Example:

```text
POST /sales/invoices
POST /sales/invoices/{id}/post
POST /sales/invoices/{id}/cancel
GET  /inventory/stock
POST /inventory/transfers
GET  /accounts/ledger
```

---

# 32. Error Contract

Example:

```json
{
  "code": "NEGATIVE_STOCK_NOT_ALLOWED",
  "message": "Insufficient stock for this invoice.",
  "details": {
    "item_id": "...",
    "available": "4.000",
    "requested": "6.000"
  }
}
```

Never expose stack traces.

---

# 33. Concurrency

Protect:

- invoice numbering
- stock allocation
- batch stock
- cashier closing
- credit exposure
- period closing
- sync checkpoints

Database-level protections are mandatory.

---

# 34. Security

Required:

- secure password hashing
- MFA for privileged users optional
- TLS
- secure cookies/tokens
- file validation
- dependency scanning
- signed releases
- encrypted backups
- no DB port exposed publicly
- no plaintext secrets

---

# 35. Observability

Local admin health screen:

```text
API
Database
Disk
Worker
Backup
Cloud Sync
Tax Integrations
Printer
License
Version
Migrations
```

---

# 36. Performance Targets

Local environment target:

- product search p95 < 200 ms
- normal invoice save p95 < 800 ms
- barcode processing < 150 ms
- standard report < 2 sec where practical
- 100k+ items
- 100k+ parties
- 1M+ transaction lines
- 50 concurrent users baseline
- 10 concurrent billing operators baseline

---

# 37. Recommended Production Hardware

Baseline office server:

- Windows 11 Pro or Windows Server
- modern 4+ core CPU
- 16 GB RAM recommended
- NVMe SSD
- gigabit LAN
- UPS
- external/NAS backup target recommended

---

# 38. Development Environment

Local development only:

```text
PostgreSQL
Python
Node.js
npm
VS Code / Antigravity
```

Databases:

```text
evolix_trade_dev
evolix_trade_test
```

Never use unrelated production databases.

---

# 39. Temporary Files

All disposable scripts/files go to:

```text
scratchpad/
```

Examples:

- migration experiments
- one-off audits
- generated validation outputs
- temporary exports
- debugging helpers

Production code must never import from `scratchpad/`.

---

# 40. Architectural Acceptance Criteria

The architecture is acceptable only if:

- internet outage does not stop local billing;
- posting is atomic;
- stock uses movement records;
- accounting stays balanced;
- permissions are server-side;
- company isolation is enforced;
- external integrations are asynchronous;
- backups are encrypted and testable;
- branch sync is idempotent;
- no unrelated database is used;
- production code does not depend on scratchpad.

---

# 41. Architecture Change Process

Any change affecting:

- database authority
- local-first behavior
- posting engine
- accounting
- stock
- sync
- authorization
- backup/restore

requires explicit documented approval and an update to this file.
