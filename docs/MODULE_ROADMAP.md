# MODULE_ROADMAP.md — EVOLIX Trade ERP

**Purpose:** Define exact development order, dependencies, acceptance gates and completion rules.

---

# 1. Development Philosophy

EVOLIX must be built from foundation upward.

Do not begin with dashboards, advanced reports, mobile apps or cloud sync before the core transaction engine is stable.

## Connected ERP Principle

Modules are NOT isolated features. They build into ONE connected ERP workflow.

Every module that introduces a business transaction must identify:

- **Business capability** — what business operation it enables
- **Transactions introduced** — what new document types are created
- **Upstream dependencies** — which earlier modules it depends on
- **Downstream effects** — what domain effects its transactions produce
- **Inventory effects** — stock movements created
- **Accounting effects** — vouchers/postings created
- **Reporting effects** — what reports this data feeds
- **Intelligence/lineage** — how drill-down traces back to this data

See BUSINESS_WORKFLOW.md and BUSINESS_EVENT_IMPACT_MATRIX.md for the full connected workflow.

Every module must pass:

- implementation
- migrations
- permissions
- audit
- automated tests
- manual testing
- documentation
- regression checks
- **connected business effects verification**

before being marked complete.

---

# 2. Global Module Gate

A module is complete only when:

```text
Database
API
Business logic
Permissions
Audit
Frontend
Validation
Error handling
Automated tests
Manual test checklist
Documentation
```

are all complete.

---

# 3. Phase Overview

```text
00 Foundation
01 Identity & RBAC
02 Company / Financial Year
03 Configuration
04 Masters
05 Accounting Core
06 Inventory Core
07 Purchase
08 Sales
09 POS
10 Orders / Challans
11 Returns & Claims
12 Barcode / Labels
13 Pricing / Schemes
14 Credit / Outstanding
15 Banking / PDC
16 GST / Compliance
17 Reports / MIS
18 Dispatch / Delivery
19 Field Sales
20 Retailer Portal
21 Batch / Expiry
22 Pharmacy
23 Multi-Branch Sync
24 Cloud / Remote Owner
25 Manufacturing
26 Backup / Restore Hardening
27 Installer / Licensing / Updates
28 Production Hardening
```

---

# 4. Module 00 — Foundation

## Objective

Create stable project skeleton.

## Backend

- FastAPI app
- settings
- PostgreSQL connection
- SQLAlchemy
- Alembic
- health endpoint
- error handler
- logging
- request correlation ID

## Frontend

- React + TypeScript
- route skeleton
- API client
- error boundary
- auth-aware app shell
- i18n base
- responsive layout base

## Infrastructure

- `.env.example`
- dev scripts
- lint
- tests
- CI
- scratchpad folder

## Acceptance

- backend starts
- frontend starts
- database migration works
- health check works
- test database isolated

---

# 5. Module 01 — Identity & RBAC

## Backend

- User
- Role
- Permission
- UserRole
- RolePermission
- Session
- password policy
- lockout
- MFA optional
- password history
- session revoke

## Frontend

- login
- logout
- user management
- role management
- permission matrix
- session management

## Critical tests

- unauthorized access blocked
- forged API requests blocked
- expired sessions rejected
- permission inheritance correct

---

# 6. Module 02 — Company & Financial Year

## Features

- organization
- company
- branch
- financial year
- GST/company profile
- document series
- opening/closing controls

## Critical tests

- Company A cannot access Company B
- financial year filter correct
- closed period restrictions work
- branch scope works

---

# 7. Module 03 — Configuration

## Features

- typed settings registry
- company settings
- branch settings
- user settings
- invoice settings
- stock settings
- accounting settings
- language
- printing
- numbering
- branding

## Critical tests

- setting inheritance
- invalid value rejection
- audit history
- company-specific settings

---

# 8. Module 04 — Masters

## Masters

- party
- item
- category
- brand
- manufacturer
- HSN
- tax
- unit
- alternate unit
- godown
- rack
- price list
- bank
- salesperson
- area
- route
- transport
- reason codes

## Critical tests

- duplicate code protection
- GSTIN format checks
- UOM conversion
- item search
- import

---

# 9. Module 05 — Accounting Core

## Business Capability

Double-entry accounting engine. Central posting service that all transaction modules call.

## Transactions Introduced

Receipt, Payment, Contra, Journal Voucher, Opening Balance

## Upstream Dependencies

Module 02 (Company, Branch, Financial Year), Module 04 (Parties for customer/supplier ledgers)

## Features

- chart of accounts
- account groups
- ledgers
- vouchers
- voucher lines
- receipts
- payments
- contra
- journal
- opening balance
- bill allocation

## Downstream Effects

- Receipt → Customer outstanding ↓, Cash/Bank ↑, Bill allocation
- Payment → Supplier payable ↓, Cash/Bank ↓, Bill allocation
- Provides PostingService used by Module 07 (Purchase) and Module 08 (Sales)

## Inventory Effects

None directly. Accounting vouchers are created BY other modules' stock transactions.

## Accounting Effects

This IS the accounting module. All vouchers must satisfy: DEBIT == CREDIT.

## Reporting Effects

Day book, Ledger, Trial Balance, P&L, Balance Sheet, Outstanding/Ageing

## Intelligence/Lineage

Voucher → source_document_type/id traces back to originating business transaction

## Golden invariant

```text
DEBIT == CREDIT
```

## Critical tests

- balanced posting only
- closed period
- cancellation/reversal
- company isolation
- receipt reduces customer outstanding
- payment reduces supplier payable
- bill allocation ageing correct

---

# 10. Module 04 — Inventory Core — APPROVED

## Business Capability

Movement-based inventory tracking. Central StockService that all transaction modules call.

## Transactions Introduced

Stock Transfer, Stock Adjustment, Opening Stock, Stock Count

## Upstream Dependencies

Module 02 (Company, Branch, Godown), Module 04 (Items, Batches, Units)

## Features

- stock movement
- current stock projection
- godown stock
- transfer
- adjustment
- opening stock
- stock ledger

## Downstream Effects

- Provides StockService used by Module 07 (Purchase) and Module 08 (Sales)
- Stock Transfer → TRANSFER_OUT + TRANSFER_IN, net company stock unchanged
- Stock Adjustment → ADJUSTMENT_IN or ADJUSTMENT_OUT, accounting TBD
- Opening Stock → OPENING movement, Dr Inventory Cr Opening Equity

## Inventory Effects

This IS the inventory module. All stock changes are stock movements. Projection is rebuildable cache.

## Accounting Effects

Stock Adjustment → TBD (see ACCOUNTING_RULES.md). Opening Stock → Dr Inventory, Cr Opening Equity.

## Reporting Effects

Stock Summary, Stock Ledger, Godown Stock, Batch/Expiry, Valuation, Movement Register

## Intelligence/Lineage

Movement → source_document_type/id traces to originating transaction

## Critical tests

- movement conservation
- concurrent stock update
- negative stock policy
- transfer balance (OUT = IN)
- projection rebuild matches movements
- godown isolation

---

# 11. Module 07 — Purchase

## Business Capability

Purchase transactions: receiving goods from suppliers, managing payables.

## Transactions Introduced

Purchase Invoice, Purchase Order, Goods Receipt, Purchase Return

## Upstream Dependencies

Module 04 (Items, Suppliers/Parties, Units, Tax Classes), Module 05 (PostingService, Ledgers), Module 06 (StockService, Godowns)

## Features

- purchase invoice
- purchase order
- goods receipt
- purchase return
- supplier debit
- landed cost
- free quantity

## Downstream Effects (Connected ERP)

Purchase Invoice Post atomically creates:

```text
1. Purchase Invoice + Lines (transaction record)
2. Stock Movements: PURCHASE_IN per line (inventory +qty)
3. Accounting Voucher: Dr Inventory + Dr Input GST, Cr Supplier/Cash
4. Bill Allocation: Supplier payable created
5. Tax Records: Input GST snapshot per line
6. Audit Event: PURCHASE_INVOICE_POSTED
```

Purchase Return Post atomically creates:

```text
1. Purchase Return + Lines
2. Stock Movements: PURCHASE_RETURN_OUT per line (inventory -qty)
3. Accounting Voucher: Dr Supplier, Cr Purchase Return + Cr Input GST Reversal
4. Bill Allocation: Supplier payable reduced
5. Tax Records: Input GST reversed
6. Audit Event: PURCHASE_RETURN_POSTED
```

## Reporting Effects

Purchase Register, Supplier Ledger, Stock Ledger, GST Input Reports

## Intelligence/Lineage

Purchase → Voucher (source_document_type=PURCHASE_INVOICE) → Stock Movement (source_document_type=PURCHASE_INVOICE)

---

# 12. MODULE 05 — SALES CORE

Status: APPROVED

Scope approved:

- Sales Order
- Delivery Challan / Dispatch
- Sales Invoice
- Retail sales
- Wholesale sales
- Sales Return
- Inventory integration
- Accounting integration
- Customer receivable integration
- Audit
- Lineage
- RBAC
- Organization/branch isolation
- Idempotency
- Reversal/cancellation rules

Pending separately:

- Sales frontend refinement
- Sales dashboard
- Sales reports
- Sales intelligence

## Business Capability

Sales transactions: billing customers, managing receivables.

## Transactions Introduced

Sales Invoice, Sales Return

## Upstream Dependencies

Module 04 (Items, Customers/Parties, Units, Tax Classes, Price Lists), Module 05 (PostingService, Ledgers), Module 06 (StockService, Godowns)

## Features

- sales invoice
- wholesale billing
- customer rates
- taxes
- discounts
- payment modes
- printing
- sales return baseline

## Downstream Effects (Connected ERP)

Sales Invoice Post atomically creates:

```text
1. Sales Invoice + Lines (transaction record)
2. Stock Movements: SALE_OUT per line (inventory -qty)
3. Accounting Voucher: Dr Customer/Cash, Cr Sales + Cr Output GST
4. COGS Entry (if perpetual): Dr COGS, Cr Inventory
5. Bill Allocation: Customer receivable created (credit sale)
6. Tax Records: Output GST snapshot per line
7. Audit Event: SALES_INVOICE_POSTED
```

Sales Return Post atomically creates:

```text
1. Sales Return + Lines
2. Stock Movements: SALE_RETURN_IN per line (inventory +qty)
3. Accounting Voucher: Dr Sales Return + Dr Output GST Reversal, Cr Customer
4. Bill Allocation: Customer receivable reduced
5. Tax Records: Output GST reversed
6. Audit Event: SALES_RETURN_POSTED
```

## Reporting Effects

Sales Register, Customer Ledger, Stock Ledger, Margin Report, GST Output Reports

## Intelligence/Lineage

Sale → Voucher (source_document_type=SALES_INVOICE) → Stock Movement (source_document_type=SALES_INVOICE) → Bill Allocation → Customer Outstanding

---

# 13. Module 09 — Retail POS

## Features

- barcode billing
- quick checkout
- hold/resume
- split payment
- shift open/close
- cash drawer
- retail return
- receipt printing

## Critical tests

- internet disconnected
- LAN available
- POS continues normally

---

# 14. Module 10 — Orders & Challans

## Features

- quotation
- sales order
- purchase order refinement
- delivery challan
- conversion
- partial conversion
- pending quantities

---

# 15. Module 11 — Returns & Claims

## Features

- sales return
- purchase return
- replacement
- expiry return
- damage
- shortage
- rate difference
- supplier/customer claims

---

# 16. Module 12 — Barcode & Labels

## Features

- barcode generation
- multiple barcodes
- product labels
- MRP labels
- thermal printing
- inward barcode print

---

# 17. Module 13 — Pricing & Schemes

## Features

- price lists
- customer-specific rates
- quantity slabs
- buy X get Y
- free qty
- item discounts
- bill discounts
- promotional schemes

## Critical requirement

Applied rule trace must be stored.

---

# 18. Module 14 — Credit & Outstanding

## Features

- credit days
- credit limit
- temporary limit
- overdue blocking
- invoice ageing
- outstanding
- override approval

---

# 19. Module 15 — Banking & PDC

## Features

- bank account
- cheque
- PDC
- bank statement
- reconciliation
- bounce
- clearing

---

# 20. Module 16 — GST & Compliance

## Features

- GST tax model
- HSN
- place of supply
- e-invoice adapter
- e-way adapter
- GST reports
- reconciliation
- TDS/TCS readiness

## Rule

No statutory threshold hardcoded into UI.

---

# 21. Module 17 — Reports / MIS

## Reports

Sales:
- register
- item
- customer
- salesperson
- margin

Inventory:
- current stock
- ledger
- ageing
- reorder
- slow/non-moving

Accounting:
- ledger
- trial balance
- P&L
- balance sheet
- outstanding

Management:
- daily business
- profit
- branch
- product
- customer

---

# 22. Module 18 — Dispatch & Delivery

## Features

- picking
- packing
- dispatch
- transporter
- vehicle
- gate pass
- delivery assignment
- POD
- collection

---

# 23. Module 19 — Field Sales

## Features

- salesperson mobile/PWA
- retailer list
- route
- visit
- order booking
- collection
- outstanding
- product catalog
- offline capture

---

# 24. Module 20 — Retailer Portal

## Features

- retailer login
- catalogue
- pricing
- schemes
- order
- invoice
- ledger
- order status
- payment link optional

---

# 25. Module 21 — Batch / Expiry

## Features

- batches
- MFG date
- expiry
- FEFO
- near expiry
- batch stock
- expiry return

---

# 26. Module 22 — Pharmacy

## Features

- salt/generic
- substitute
- manufacturer
- drug license fields
- restricted category config
- prescription attachment
- refill reminder
- pharmacy reports

Regulatory validation required before production claims.

---

# 27. Module 23 — Multi-Branch Sync

## Features

- site identity
- sync events
- outbox
- inbox
- checkpoints
- branch-specific numbering
- conflict handling
- transfer synchronization

## Critical tests

- duplicate event
- reordered event
- branch offline
- reconnect
- conflict
- no duplicate stock/accounting

---

# 28. Module 24 — Cloud & Remote Owner

## Features

- cloud backup
- remote reports
- remote approvals
- notification gateway
- owner mobile dashboard

Local ERP must continue when cloud is unavailable.

---

# 29. Module 25 — Manufacturing

## Features

- BOM
- production order
- issue material
- production receipt
- wastage
- by-product
- costing
- repacking/conversion

---

# 30. Module 26 — Backup & Restore Hardening

## Features

- local scheduled backup
- cloud backup
- encryption
- checksum
- restore wizard
- restore verification
- DR runbook

---

# 31. Module 27 — Installer, Licensing & Updates

## Features

- Windows server installer
- optional print bridge
- license token
- offline grace
- updater
- update rollback
- migration protection

---

# 32. Module 28 — Production Hardening

## Required

- performance tests
- security review
- full E2E
- backup restore drill
- migration test
- internet outage test
- printer tests
- barcode tests
- power restart
- disk full simulation
- concurrency testing
- support docs

---

# 33. Definition of Module Complete

Every module requires:

```text
[ ] DB schema/migration
[ ] Backend API
[ ] Business logic
[ ] RBAC
[ ] Audit
[ ] UI
[ ] Error handling
[ ] Unit tests
[ ] Integration tests
[ ] E2E where critical
[ ] Manual test checklist
[ ] Docs
[ ] Regression check
```

---

# 34. Manual Testing Checklist Template

After every completed module provide:

```text
TEST:
Steps:
Expected:

1. Happy path
2. Permissions
3. Validation
4. Error handling
5. Company isolation
6. Branch isolation
7. English/Hindi
8. Mobile/responsive
9. Keyboard
10. Print/export
11. Audit
12. Offline
13. Restart/recovery
14. Module-specific edge cases
```

---

# 35. Antigravity Development Rule

Antigravity must work on one module at a time.

Before implementation:

```text
Read:
BRAIN.md
PRD.md
ARCHITECTURE.md
MODULE_ROADMAP.md
DATABASE_SCHEMA.md
RBAC_MATRIX.md
ACCOUNTING_RULES.md
INVENTORY_RULES.md
```

Then:

```text
inspect current code
write implementation plan
implement
test
report changed files
provide manual checklist
```
