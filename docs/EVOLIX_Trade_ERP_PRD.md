# EVOLIX Trade ERP — Product Requirements Document (PRD)

**Document status:** Build-ready master specification  
**Product type:** Hybrid local-first ERP for wholesale, retail, distribution, pharmacy/FMCG and light manufacturing  
**Positioning:** Modern functional alternative to traditional Indian desktop ERPs, with fast LAN billing, offline continuity, cloud backup/sync and optional mobile apps  
**Architecture principle:** Local-first for business continuity; cloud-enhanced for backup, remote access, integrations and multi-location sync  
**Clean-room rule:** Reproduce business capabilities and workflows from public requirements/industry practice only. Do not copy Marg source code, database structures, private APIs, proprietary assets, trademarks, wording, icons, screen layouts or report designs.

---

## 1. Executive Summary

EVOLIX Trade ERP is an integrated business operating system for Indian wholesalers, distributors, retailers and hybrid wholesale-retail businesses. It must combine fast billing, inventory, accounting, GST compliance, purchase and sales operations, customer/supplier management, godowns, POS, barcode, schemes, credit/outstanding, banking, reporting, field-sales ordering, delivery operations and owner dashboards.

The primary deployment model is **hybrid on-premise**:

1. The customer's office has one **EVOLIX Server** machine.
2. The server runs the database, ERP backend, local web UI and background services.
3. Billing/accounting/warehouse users connect over LAN using a browser or thin desktop shell.
4. Core billing, stock and accounting continue even if the internet is unavailable.
5. When internet connectivity returns, approved cloud services resume:
   - encrypted backup,
   - remote owner dashboard,
   - inter-branch synchronization,
   - GST/e-invoice/e-way integrations,
   - WhatsApp/SMS/e-mail,
   - license verification,
   - software update metadata,
   - mobile app synchronization.
6. Cloud failure must never block local billing after a valid offline grace period.

The product must support **Wholesale**, **Retail**, **Wholesale + Retail**, **Distribution**, **Pharmacy**, and **Manufacturing-enabled** company modes. Modules are enabled by feature flags/licensing rather than separate codebases.

---

## 2. Product Goals

### 2.1 Primary goals

- Make billing extremely fast for keyboard-heavy wholesale users and barcode-heavy retail users.
- Keep stock, accounting and taxation synchronized from a single transaction.
- Eliminate duplicate data entry across sales, purchases, inventory and accounts.
- Support full operation on a local network during internet outages.
- Support one or many counters/users against one local company database.
- Support multiple companies, branches and godowns.
- Provide strong permissions, auditability and approval workflows.
- Provide India-focused GST, e-invoice and e-way bill workflows through modular integrations.
- Support distributor workflows from retailer order → billing → dispatch → delivery → collection.
- Support batch/expiry-intensive verticals such as pharma/FMCG.
- Provide automated encrypted backups and a tested restore workflow.
- Support migration/import from Excel/CSV and legacy ERP exports.
- Keep every critical business workflow usable from keyboard as well as mouse.

### 2.2 Success metrics

Production targets:

- Local sale invoice save p95: **< 800 ms** for ordinary invoices on recommended hardware.
- Product search result p95: **< 200 ms** on local LAN.
- Barcode add-to-bill p95: **< 150 ms** after scan event.
- Standard stock ledger query p95: **< 2 seconds** for normal date ranges.
- Local system availability: **99.9% during powered office hours**, excluding host hardware failure.
- Internet outage: **zero loss of core sale/purchase/accounting capability**.
- RPO for encrypted cloud backup: configurable; default **15 minutes for critical incremental backup metadata and daily full backup**.
- Restore drill: a trained operator can restore a verified backup to a replacement server using documented tooling.
- Every financial mutation is auditable.
- Every posted voucher is double-entry balanced.
- No stock-affecting transaction can create silent ledger inconsistency.
- No tenant/company can read another tenant/company's data.

---

## 3. Non-Goals

Version 1 does not attempt to:

- Copy Marg ERP's visual design or menu system.
- Clone proprietary algorithms, licensing mechanisms or undocumented file formats.
- Act as a full enterprise HRMS, hospital management suite or CRM unless separately enabled.
- Replace a chartered accountant or statutory tax professional.
- Hardcode government thresholds/rules that can change; compliance rules must be configuration/provider driven.
- Depend on public internet for basic billing or LAN operation.

---

## 4. User Personas

### Owner / Director
Needs sales, profit, stock, outstanding, cash/bank, branch comparison, top customers/products, approvals and remote visibility.

### Accountant
Needs ledgers, vouchers, reconciliation, GST reports, returns preparation, P&L, balance sheet, ageing, audit trail and period locking.

### Wholesale Billing Operator
Needs keyboard-first billing, party-wise rates/discounts, schemes, credit checks, fast item search, batches, challans, order conversion and printing.

### Retail Cashier
Needs barcode/POS billing, fast customer selection, cash/card/UPI split, returns, hold/resume cart, shift cash and receipt printing.

### Purchase Operator
Needs purchase orders, purchase invoice entry/import, supplier schemes, landed cost, price updates, batch/expiry and debit notes.

### Warehouse Operator
Needs inward/outward, picking, packing, godown transfer, shortage/breakage/expiry, stock count and dispatch.

### Salesman / Field Representative
Needs retailer list, route, order booking, stock visibility, price/scheme visibility, collections, outstanding and visit reporting.

### Delivery Executive
Needs assigned invoices, route order, customer details, proof of delivery, payment collection, failed delivery reason and status sync.

### System Administrator
Needs company setup, users, roles, backups, restore, devices, licensing, printers, integrations, logs and updates.

### Auditor / CA
Needs read-only financial reports, GST reconciliation, journal trail, voucher history, user activity and export.

---

## 5. Company Modes and Feature Profiles

During company setup:

- Retail
- Wholesale
- Wholesale + Retail
- Distributor
- Pharmacy / Medical Retail
- Pharma Distributor
- FMCG Distributor
- General Trading
- Garment / Variant Retail
- Light Manufacturing
- Custom

The choice controls defaults only. It does not fork the database schema.

Example feature flags:

- `retail_pos`
- `wholesale_billing`
- `batch_tracking`
- `expiry_tracking`
- `pharmacy_compliance`
- `field_sales`
- `delivery_management`
- `manufacturing_bom`
- `multi_godown`
- `multi_branch`
- `cloud_sync`
- `remote_owner`
- `advanced_approvals`
- `barcode_label`
- `loyalty`
- `payroll_optional`

---

## 6. Deployment Architecture

### 6.1 Office topology

```text
                         EVOLIX CLOUD
               ┌───────────────────────────┐
               │ Encrypted backups         │
               │ Remote owner API          │
               │ Branch sync gateway       │
               │ Notifications             │
               │ Update manifest           │
               │ License service           │
               └──────────────┬────────────┘
                              │ Internet
                        encrypted HTTPS
                              │
                 ┌────────────▼────────────┐
                 │     EVOLIX SERVER       │
                 │ FastAPI API             │
                 │ PostgreSQL              │
                 │ React static frontend   │
                 │ Worker / scheduler      │
                 │ Backup agent            │
                 │ Local sync outbox       │
                 │ Print service           │
                 └────────────┬────────────┘
                              │ LAN
             ┌────────────────┼────────────────┐
             │                │                │
        Billing PC       Accounts PC     Warehouse PC
             │                │                │
        Browser/PWA       Browser/PWA      Browser/PWA

Optional:
- POS terminals
- barcode scanners
- label printers
- receipt printers
- A4 printers
- cash drawer
- weighing scale adapter
- mobile apps
```

### 6.2 Recommended stack

- Backend: Python + FastAPI
- ORM/data access: SQLAlchemy 2.x
- Migrations: Alembic
- Database: PostgreSQL
- Frontend: React + TypeScript
- State/data: TanStack Query + local UI store
- Background jobs: lightweight local worker; Redis/Celery optional only where deployment supports it
- Desktop shell (optional): Tauri/Electron only as a convenience layer, never business-data authority
- Mobile: React Native / Flutter or PWA depending module
- API: versioned REST first, WebSocket/SSE for local live updates where useful
- Reporting: server-side report service + PDF/XLSX/CSV generation
- Packaging: Windows installer for server and optional client/print agent
- Cloud: tenant-isolated API/services; not the sole authority for a local-first site

### 6.3 Server discovery

Clients can connect by:

- `https://evolix.local`
- fixed local IP
- mDNS/Bonjour-style discovery where reliable
- QR-based pairing generated by server

### 6.4 Offline policy

Local office transactions do not use a cloud-first queue. The **local PostgreSQL database is authoritative for that office/site**.

Cloud synchronization uses:
- immutable event/outbox records,
- idempotency keys,
- sequence numbers,
- per-entity version,
- device/site identifier,
- server timestamps,
- retry with exponential backoff,
- dead-letter queue for failed integrations.

---

## 7. Functional Module Map

1. Foundation / Company & Financial Year
2. Identity, Users, Roles & Security
3. Masters
4. Sales
5. Retail POS
6. Purchase
7. Inventory & Godowns
8. Batch / Expiry / Pharma
9. Pricing, Discounts, Schemes & Promotions
10. Orders, Quotations & Challans
11. Returns, Replacements & Claims
12. Accounting & General Ledger
13. Cash, Bank, Cheque/PDC & Reconciliation
14. Credit & Outstanding Management
15. GST, e-Invoice, e-Way Bill, TDS/TCS
16. Barcode & Label Printing
17. Dispatch, Packing & Delivery
18. Field Sales / Retailer Ordering
19. Customer Portal / Retailer App
20. Owner Dashboard / Mobile
21. Manufacturing / BOM
22. Import / Export / Data Migration
23. Reports / MIS / Analytics
24. Notifications & Communication
25. Backup / Restore / Disaster Recovery
26. Multi-Branch / Multi-Location Sync
27. Approvals / Audit / Period Lock
28. Printing / Templates / Documents
29. Licensing / Updates / Installer
30. Optional Payroll / Cost Center / Budgeting

---

# 8. Foundation / Company Module

## 8.1 Company master

Fields:

- legal name
- trade name
- business type
- PAN
- GSTIN(s)
- CIN optional
- MSME/Udyam optional
- drug license numbers optional
- FSSAI optional
- address
- state and state code
- pincode
- phone/e-mail
- website
- bank accounts
- invoice logo
- signatures
- tax registrations
- financial year
- base currency
- decimal precision
- quantity precision
- timezone
- language
- number formats
- default warehouse
- default price list

## 8.2 Multiple companies

A licensed site may hold multiple companies.

Requirements:
- hard data boundary by `company_id`
- switch company without restarting server
- separate financial years
- separate GST registrations
- separate numbering
- optional consolidated owner reports
- no cross-company posting unless explicit inter-company module is enabled

## 8.3 Financial year

- create/open/close financial year
- carry opening balances
- carry stock opening
- year-end close wizard
- lock prior periods
- reopen only with privileged approval
- retain immutable audit history

---

# 9. Identity, RBAC and Security

## 9.1 Authentication

- username/password
- optional TOTP MFA for privileged users
- local authentication remains available during internet outage
- password history
- lockout policy
- session timeout
- active session list
- force logout
- trusted local subnet policy optional

## 9.2 Permission model

Permissions at action level:

`module.resource.action.scope`

Examples:
- `sales.invoice.create`
- `sales.invoice.modify_posted`
- `sales.invoice.cancel`
- `purchase.invoice.approve`
- `accounts.journal.post`
- `inventory.stock_adjustment.create`
- `reports.profit.view`
- `settings.backup.restore`

Scopes:
- own
- branch
- assigned godown
- company
- all licensed companies

## 9.3 Sensitive permissions

Separate controls for:
- cost price visibility
- profit/margin visibility
- backdated voucher
- negative stock override
- price override
- discount above limit
- credit-limit override
- delete draft
- cancel posted voucher
- edit GSTIN
- restore backup
- export master data
- view payroll
- user administration

## 9.4 Audit log

Record:
- who
- when
- device
- IP
- company
- branch
- action
- entity
- before snapshot/diff
- after snapshot/diff
- reason
- approval reference

Posted accounting history must be append-only from the business user's perspective.

---

# 10. Master Data

## 10.1 Party master

Supports:
- customer
- supplier
- both
- retailer
- distributor
- dealer
- cash customer
- employee/expense party optional

Fields:
- name
- code
- contact persons
- billing/shipping addresses
- GSTIN
- PAN
- state
- credit days
- credit limit
- temporary credit limit with expiry
- price list
- default discount
- salesman
- route
- area
- beat
- transport
- payment terms
- opening balance
- loyalty profile optional
- block/hold status
- custom fields
- document attachments

## 10.2 Item master

Fields:
- SKU
- item name
- short name
- aliases
- barcode(s)
- HSN/SAC
- item type
- unit / alternate unit
- conversion ratio
- category
- subcategory
- brand/company
- manufacturer
- salt/generic optional
- tax class
- cess
- purchase rate
- MRP
- selling rates
- minimum/maximum sale rate
- reorder level
- minimum stock
- maximum stock
- rack/bin
- batch required
- expiry required
- serial required
- manufacturing date required
- weight
- dimensions
- pack size
- case size
- image
- status
- substitutes
- variants
- custom fields

## 10.3 Other masters

- unit/UOM
- tax rate
- HSN
- category
- brand
- manufacturer
- salt/generic
- route
- area
- salesman
- godown
- branch
- rack/bin
- transport
- payment method
- bank
- expense head
- cost center
- price list
- scheme
- discount rule
- reason code
- document series
- printer/template

---

# 11. Sales Module

## 11.1 Documents

- quotation
- sales order
- sales challan / delivery challan
- wholesale invoice
- retail invoice
- tax invoice
- cash memo
- proforma invoice
- debit/credit note as applicable
- sales return
- replacement issue
- dispatch note

## 11.2 Invoice entry requirements

Header:
- party
- address/GSTIN
- billing/shipping
- salesman
- route
- price list
- order/challan ref
- transport
- vehicle
- payment terms
- due date
- remarks

Lines:
- item
- batch
- expiry
- quantity
- free quantity
- unit
- rate
- MRP
- discount 1/2/3 configurable
- scheme
- taxable value
- GST
- cess
- warehouse/bin
- serial number optional
- line remarks

Footer:
- item discount
- bill discount
- freight
- packing
- round off
- other charges
- TCS if applicable
- payment split
- outstanding
- credit status
- invoice total

## 11.3 Billing behavior

- keyboard-first data entry
- configurable hotkeys
- recent item/party shortcuts
- search by SKU/name/alias/barcode/category/brand/salt
- batch auto-selection policy configurable: FEFO/FIFO/manual
- show last sale rate
- show last deal
- show customer-specific rate
- show MRP and margin based on permission
- warn/block below minimum price
- warn/block negative stock
- apply schemes automatically
- credit-limit warning or block
- ageing/outstanding popup
- hold/resume invoice
- duplicate previous invoice
- convert order/challan to invoice
- split invoice when configured by tax/business rules
- save draft/post
- print/email/WhatsApp after posting
- generate e-invoice/e-way workflow asynchronously when allowed

## 11.4 Sales return

Support:
- return against invoice
- open return with approval
- batch/serial validation
- reason
- condition: saleable/damaged/expired
- restock location
- credit note generation
- cash/refund adjustment
- replacement workflow
- GST impact

---

# 12. Retail POS

## 12.1 POS screen

- full-screen touch-friendly mode
- barcode scanner input
- keyboard shortcuts
- large product search
- category tiles optional
- customer attach
- quantity change
- discount with permission
- price override with permission
- remove line with permission
- hold/resume carts
- park bill
- loyalty optional
- split payment
- cash/card/UPI/wallet/credit
- change due
- receipt print
- duplicate receipt
- sale return/exchange
- cash drawer trigger
- customer display optional

## 12.2 Cashier/shift

- open shift
- opening cash
- cash in
- cash out
- petty cash
- expected cash
- counted cash
- variance
- close shift
- supervisor approval
- denomination count optional

## 12.3 Offline behavior

POS depends only on local server/LAN. Internet-dependent services are deferred.

---

# 13. Purchase Module

Documents:
- purchase indent
- request for quotation optional
- purchase order
- goods receipt
- purchase invoice
- temporary purchase
- purchase return
- supplier debit note
- replacement receive
- landed cost allocation

Capabilities:
- supplier comparison
- last purchase rate
- batch/expiry capture
- free quantity
- schemes
- tax
- freight and other charges
- auto-update sale rate based on policy
- price-difference handling
- import invoice from CSV/XLSX/provider-supported formats
- duplicate detection
- approval before posting
- link purchase order → GRN → invoice
- partial receive
- backorder
- damaged/short receipt
- supplier claim

---

# 14. Inventory & Godown Management

## 14.1 Stock ledger

Every stock-affecting transaction creates auditable stock movements.

Movement types:
- opening
- purchase
- sales
- sales return
- purchase return
- transfer out
- transfer in
- production consume
- production output
- adjustment increase/decrease
- breakage
- expiry
- sample/free issue
- replacement
- conversion
- consignment

## 14.2 Godown

- multiple godowns
- racks/bins
- transfer request
- stock issue
- stock receive
- in-transit status
- branch transfer
- partial receive
- discrepancy
- transfer audit

## 14.3 Stock count

- create stock count session
- freeze snapshot
- mobile/barcode counting optional
- expected vs counted
- variance reason
- approval
- post adjustment

## 14.4 Reorder

Inputs:
- minimum level
- maximum level
- lead time
- average sales
- fast/slow/non-moving
- pending purchase orders
- pending sales orders
- seasonality optional

Outputs:
- suggested purchase qty
- reorder report
- purchase order draft

---

# 15. Batch, Expiry and Pharmacy Features

Feature-gated.

## 15.1 Batch

- batch number
- manufacture date
- expiry date
- MRP
- purchase rate
- sale rate
- quantity
- supplier
- inward invoice
- barcode
- rack
- status

## 15.2 FEFO

Default expiry-sensitive picking should support FEFO with configurable exceptions.

## 15.3 Expiry management

- near-expiry days threshold
- expired stock
- expiry return to supplier
- dump/blocked stock
- expiry write-off
- expiry claim
- reminders
- batch-wise ageing

## 15.4 Pharmacy-specific

- salt/generic search
- substitute items
- manufacturer
- schedule/category flags
- controlled item restrictions
- patient optional
- doctor optional
- prescription attachment optional
- promise/unavailable item list
- refill/prescription reminder
- restricted drug reporting where legally applicable
- drug license fields
- configurable compliance registers

**Important:** Regulatory fields/rules must be reviewed against current applicable law before production use. Never assume a public competitor workflow is itself sufficient for compliance.

---

# 16. Pricing, Discounts and Schemes

## 16.1 Price lists

- retail
- wholesale
- dealer
- distributor
- MRP
- special party
- route/area
- date-effective
- quantity slab

## 16.2 Discount controls

Rules can apply by:
- party
- party group
- item
- item group
- brand
- manufacturer
- quantity
- bill value
- date range
- salesperson
- branch

Controls:
- default
- minimum
- maximum
- override permission
- approval threshold

## 16.3 Schemes

Support:
- buy X get Y
- buy X get N free
- value-based discount
- quantity slab
- combo/bundle
- party-specific
- area-specific
- group scheme
- free item
- promotional item
- scheme priority
- stackable/non-stackable

The engine must log exactly which rule produced each benefit.

---

# 17. Orders, Quotations and Challans

Lifecycle examples:

```text
Quotation → Sales Order → Picking → Challan → Invoice → Dispatch → Delivery → Collection
```

```text
Purchase Indent → Purchase Order → GRN → Purchase Invoice → Payment
```

Requirements:
- partial conversion
- remaining quantity
- cancel balance
- revision history
- approval
- expiry date
- status timeline
- source document references

---

# 18. Returns, Replacements and Claims

Support:

- sales return
- purchase return
- breakage return
- expiry return
- damaged goods
- shortage claim
- rate difference claim
- scheme claim
- supplier claim
- customer claim
- replacement issue
- replacement receive

Claim lifecycle:
- draft
- submitted
- acknowledged
- approved
- partially approved
- rejected
- settled
- closed

Attach documents/images and settlement references.

---

# 19. Accounting Module

## 19.1 Accounting model

Double-entry bookkeeping.

Core entities:
- chart of accounts
- account group
- ledger
- voucher
- voucher line
- cost center
- reference/bill allocation

## 19.2 Voucher types

- receipt
- payment
- contra
- journal
- sales
- purchase
- sales return
- purchase return
- debit note
- credit note
- opening
- adjustment

## 19.3 Automatic posting

Inventory/business transactions post accounting based on configurable posting profiles.

Example sale:
- Dr customer/cash
- Cr sales
- Cr output GST
- stock cost recognized through inventory/COGS policy

## 19.4 Reports

- day book
- cash book
- bank book
- journal register
- ledger
- group summary
- trial balance
- profit & loss
- balance sheet
- receivables
- payables
- ageing
- cost center
- cash flow
- funds flow optional
- item trading/profitability
- gross profit
- net profit

## 19.5 Period controls

- open
- soft locked
- tax locked
- hard closed

Backdated mutation after lock requires privileged workflow and audit reason.

---

# 20. Cash, Bank, Cheque and Reconciliation

- bank master
- bank accounts
- receipt/payment
- cheque book
- cheque issued
- cheque received
- PDC
- advance cheque
- deposited
- cleared
- bounced/dishonoured
- cancelled
- stale
- reconciliation
- bank statement import
- rule-based matching
- manual match
- split match
- unreconciled queue

Online bank integration is an adapter, not a core dependency.

---

# 21. Credit & Outstanding

Per party:
- credit limit
- temporary limit + expiry
- credit days
- overdue tolerance
- blocked status

During billing:
- current outstanding
- invoice ageing
- unadjusted receipts
- pending cheques
- proposed invoice amount
- projected exposure

Actions:
- allow
- warn
- supervisor PIN/approval
- block

Reports:
- bill-wise outstanding
- ageing
- salesman-wise collection
- route-wise outstanding
- interest/late fee report
- collection forecast
- PDC coverage

---

# 22. GST / Compliance

Create an abstraction layer so government/provider changes do not infect core sales/accounting code.

Capabilities:
- GSTIN validation adapter
- HSN/SAC
- intra/inter-state tax
- CGST/SGST/IGST
- cess
- reverse charge fields
- place of supply
- B2B/B2C/export/SEZ flags as applicable
- credit/debit notes
- e-invoice adapter
- IRN/ack/QR storage
- cancellation workflow
- e-way bill adapter
- transporter/vehicle details
- export JSON/Excel/CSV where needed
- GST return preparation/reconciliation
- GSTR report datasets
- purchase reconciliation
- TDS/TCS modules where enabled

Rules:
- no hardcoded statutory thresholds
- effective-dated tax configuration
- provider request/response audit
- retry-safe idempotent integration
- human-readable error handling
- local invoice posting must remain possible when statutory rules allow deferred online submission

---

# 23. Barcode and Label Printing

- multiple barcodes per SKU
- supplier barcode
- internal barcode
- EAN/UPC/Code128 where supported
- batch barcode
- barcode generation
- label designer
- print quantity from inward stock
- MRP label
- shelf label
- price label
- thermal printers
- A4 sheet labels

Barcode input should behave as a first-class keyboard/scanner event, not as camera OCR.

---

# 24. Dispatch, Packing and Delivery

## 24.1 Dispatch

- invoice queue
- picking list
- packing list
- pack/carton
- transporter
- LR/GR
- vehicle
- gate pass
- dispatch check/audit
- short pick
- split dispatch
- dispatch status

## 24.2 Delivery mobile workflow

- assigned deliveries
- route sequence
- customer map link
- invoice details
- COD/collection amount
- call customer
- delivered
- partial
- failed
- reschedule
- reason
- proof of delivery
- signature/photo optional
- GPS timestamp if permitted
- payment collection
- sync to ERP

---

# 25. Field Sales / Salesman App

Field application capabilities:

- login and assigned territory
- retailer/customer list
- route/beat
- visit plan
- order booking
- live/last-synced stock
- price list
- schemes
- customer outstanding
- PDC
- collection entry
- order history
- last sale
- product catalogue
- barcode scan
- visit notes
- DCR
- geo check-in optional
- offline capture
- conflict-safe sync

Owner/admin can view:
- planned vs completed visits
- orders
- value
- collection
- productive calls
- route coverage

---

# 26. Retailer Ordering Portal/App

For distributor customers:

- login/OTP
- catalogue
- search
- current price
- available stock policy
- schemes/offers
- reorder from history
- place order
- order status
- invoice
- ledger/outstanding
- payment link optional
- short supply
- dispatch status
- support/contact

Distributor controls which items, prices and stock information each retailer may see.

---

# 27. Owner Dashboard / Mobile

Read-heavy remote view:

- today's sales
- purchase
- gross profit
- cash/bank
- receivables
- payables
- overdue
- top items
- top customers
- low stock
- near expiry
- branch performance
- salesman performance
- order pipeline
- collection
- P&L
- balance sheet summary

Remote mutation should be limited and permissioned:
- approve discount
- approve credit override
- approve voucher
- approve purchase order
- block/unblock party
- acknowledge alerts

---

# 28. Manufacturing / BOM

Feature-gated.

## 28.1 Masters
- BOM
- version
- raw material
- semi-finished
- finished good
- scrap/by-product
- process step
- yield
- wastage

## 28.2 Transactions
- production order
- material issue
- production receipt
- batch production
- conversion
- repacking
- wastage
- subcontract optional

## 28.3 Costing
- material
- labour optional
- overhead
- landed cost
- batch cost
- variance

For regulated pharma manufacturing, treat as a separate validated product scope; do not claim compliance merely because BOM/process entries exist.

---

# 29. Import / Export / Migration

## 29.1 Imports

- item master
- party master
- opening stock
- opening balances
- purchase invoice
- sales order
- price list
- barcode

Formats:
- CSV
- XLSX
- template-driven mapping
- provider-specific adapters

Import workflow:
1. upload
2. map fields
3. preview
4. validate
5. show errors
6. dry run
7. commit
8. audit summary
9. rollback where transactionally possible

## 29.2 Exports

- CSV
- XLSX
- PDF
- JSON for integrations
- scheduled exports optional

No arbitrary SQL executor is exposed to ordinary users. Advanced data access uses controlled read-only reporting endpoints.

---

# 30. Reports / MIS

Report families:

### Sales
- sales register
- item-wise
- party-wise
- salesman-wise
- area/route-wise
- tax-wise
- invoice profitability
- daily/monthly trend
- return analysis

### Purchase
- purchase register
- supplier-wise
- item-wise
- rate variance
- pending PO
- short receipt

### Inventory
- stock status
- stock ledger
- godown stock
- batch stock
- expiry
- near expiry
- negative stock
- reorder
- fast/slow/non-moving
- ageing
- stock valuation
- stock & sales analysis
- dump/blocked stock

### Accounts
- day book
- ledger
- trial balance
- P&L
- balance sheet
- cash/bank
- outstanding
- ageing
- interest
- collection

### GST
- outward/inward tax
- HSN summary
- e-invoice status
- e-way status
- reconciliation exceptions
- return preparation datasets

### Management
- daily analysis
- gross profit
- branch comparison
- salesman target/achievement
- product margin
- customer profitability
- cash conversion cycle
- inventory days
- dead stock

All reports require:
- date filter
- branch
- godown
- party
- item
- category
- brand
- salesman
- export
- print
- saved filters
- role-based visibility

---

# 31. Notifications and Communication

Channels:
- in-app
- e-mail
- SMS provider
- WhatsApp Business provider
- push notifications

Events:
- invoice
- payment receipt
- outstanding reminder
- low stock
- near expiry
- credit breach
- cheque due
- PDC due
- order status
- delivery status
- backup failure
- sync failure
- license warning
- approval request

Templates are tenant/company configurable.

---

# 32. Printing and Document Templates

Documents:
- tax invoice
- retail receipt
- quotation
- order
- challan
- purchase order
- receipt
- payment voucher
- ledger
- statement
- packing slip
- gate pass
- barcode label

Template options:
- A4
- A5
- thermal 58/80 mm
- logo
- GST details
- bank details
- QR
- signatures
- terms
- custom fields

Do not create a free-form unsafe expression engine. Use a constrained template DSL.

---

# 33. Backup, Restore and Disaster Recovery

## 33.1 Local backup

- scheduled database backup
- encrypted archive
- configurable destination
- rotation policy
- verification
- backup health status

## 33.2 Cloud backup

- encrypted before upload
- per-tenant encryption keys/managed secrets
- resumable upload
- retention tiers
- immutable/offline protection option
- no plaintext credentials in backup

## 33.3 Restore

Restore wizard:
1. select backup
2. verify checksum
3. verify product/schema compatibility
4. maintenance mode
5. snapshot current state
6. restore
7. migrate if required
8. integrity checks
9. reopen system
10. produce restore report

A backup that has never been test-restored is not considered verified.

---

# 34. Multi-Branch / Multi-Location Synchronization

Two supported models:

### Model A: Central cloud
Branches transact against cloud when connectivity is reliable. Not preferred for offline-critical sites.

### Model B: Local-first branch sync
Each branch has a local authority and synchronizes approved datasets/events.

For Model B:
- globally unique IDs
- site IDs
- outbox/inbox
- idempotent consumer
- causal/version metadata
- item/party master ownership policy
- conflict policy per entity
- centralized reporting replica
- transfer workflow across sites

Conflict examples:
- item description: master-owner wins or manual merge
- price list: central authoritative
- stock: never last-write-wins; stock sync is movement/event based
- posted voucher: immutable; correction through reversal
- numbering: branch-specific series

---

# 35. Licensing

License concepts:
- organization
- site/server
- enabled modules
- max branches
- max users/devices if plan requires
- support/update entitlement
- offline grace

Requirements:
- signed license token
- local verification
- periodic online refresh
- outage grace period
- no ransomware-like lockout of customer data
- read/export path after expiry
- license events audited

---

# 36. Installer / Office Deployment

## 36.1 Server installer

`EVOLIX-ERP-Server-Setup.exe`

Wizard:
1. prerequisites
2. server mode
3. PostgreSQL install/configure
4. application service
5. local TLS/certificate
6. firewall rules
7. company admin
8. backup location
9. printer discovery optional
10. create desktop/server console shortcut
11. health check
12. recovery key/export

## 36.2 Client experience

Preferred: browser/PWA via local hostname.

Optional:
`EVOLIX-ERP-Client-Setup.exe`
- discovers server
- pairs device
- creates shortcut
- installs print bridge if needed

## 36.3 Service management

Windows services:
- `EvolixERP`
- `EvolixWorker`
- `EvolixBackupAgent`
- optional `EvolixPrintBridge`

Automatic restart on failure.

---

# 37. API Design Principles

Base:
`/api/v1`

Patterns:
- pagination
- filter/sort
- optimistic concurrency
- idempotency for POSTs that may retry
- correlation ID
- explicit company/branch context
- validation error codes
- no silent coercion

Example endpoints:

```text
POST   /api/v1/sales/invoices
GET    /api/v1/sales/invoices/{id}
POST   /api/v1/sales/invoices/{id}/post
POST   /api/v1/sales/invoices/{id}/cancel
POST   /api/v1/sales/invoices/{id}/print

POST   /api/v1/purchase/invoices
POST   /api/v1/inventory/transfers
GET    /api/v1/inventory/stock
GET    /api/v1/accounts/ledger
POST   /api/v1/accounts/vouchers
GET    /api/v1/reports/profit-loss
POST   /api/v1/backups
POST   /api/v1/sync/push
POST   /api/v1/sync/pull
```

---

# 38. Core Data Model

Important entities:

```text
Organization
Site
Company
Branch
FinancialYear
User
Role
Permission
UserRole
AuditLog
ApprovalRequest

Party
PartyAddress
PartyContact
CreditPolicy
PriceList
PriceListLine

Item
ItemAlias
Barcode
Unit
UnitConversion
Category
Brand
Manufacturer
SaltGeneric
TaxClass
ItemVariant
ItemSubstitute

Godown
RackBin
Batch
StockMovement
StockBalanceProjection
StockCount
StockCountLine
Transfer
TransferLine

SalesQuotation
SalesOrder
SalesChallan
SalesInvoice
SalesInvoiceLine
SalesReturn
PurchaseIndent
PurchaseOrder
GoodsReceipt
PurchaseInvoice
PurchaseInvoiceLine
PurchaseReturn

Scheme
SchemeRule
DiscountRule
AppliedPromotion

AccountGroup
LedgerAccount
Voucher
VoucherLine
BillAllocation
CostCenter

BankAccount
Cheque
BankStatement
ReconciliationMatch

Dispatch
Package
DeliveryAssignment
DeliveryEvent
Collection

Route
Beat
Salesman
SalesVisit
SalesOrderMobile

TaxDocument
EInvoiceRequest
EWayBillRequest
GSTReturnDataset

BOM
BOMLine
ProductionOrder
ProductionIssue
ProductionReceipt

PrintTemplate
NotificationTemplate
NotificationLog

BackupRecord
RestoreRecord
SyncEvent
SyncCheckpoint
IntegrationJob
LicenseState
```

Rules:
- UUID/ULID identifiers for distributed entities.
- Human document numbers are separate from primary keys.
- Monetary values use fixed decimal/Numeric, never binary float.
- Posted financial documents preserve historical tax/rate snapshots.
- Stock quantities use fixed decimal with UOM precision.
- Every transactional row includes company + site/branch context where applicable.

---

# 39. Transaction Integrity Rules

1. Posting invoice, stock and accounting impact is atomic locally.
2. A posted voucher cannot be physically deleted.
3. Cancellation creates controlled reversal state/entries.
4. Document numbering is concurrency-safe.
5. Stock cannot be recalculated from a mutable invoice line without historical movement records.
6. Tax calculation snapshot is stored with the document.
7. External API success/failure cannot partially corrupt local posting.
8. Duplicate requests use idempotency keys.
9. Every background job is retry-safe.
10. Data import is transactional in bounded batches.

---

# 40. Performance Requirements

Recommended office server target:
- modern 4+ core CPU
- 16 GB RAM recommended
- NVMe SSD
- UPS
- gigabit LAN

Software:
- connection pooling in production
- proper compound indexes
- report queries isolated/optimized
- materialized/report projections where justified
- no N+1 queries
- server-side pagination
- asynchronous generation for heavy PDF/XLSX
- database maintenance and vacuum monitoring
- bounded retention for operational logs

Load goals for one office:
- 50 concurrent normal users baseline
- 10 simultaneous billing counters baseline
- 1M+ invoice lines without UI degradation in indexed search
- product catalog 100k+ SKUs
- party catalog 100k+ parties

Scale tests must be run with production-like data before release claims.

---

# 41. Security Requirements

- least privilege
- Argon2id/bcrypt password hashing
- TLS even on LAN where practicable
- CSRF protection where cookie auth is used
- secure session cookies
- rate limiting on auth
- encrypted secrets
- no credentials in logs
- dependency scanning
- signed releases
- signed update manifests
- SQL injection prevention
- file upload validation
- report/template sandboxing
- backup encryption
- audit integrity controls
- admin security dashboard

Remote access should use VPN/zero-trust gateway or securely brokered API, not raw database/port exposure.

---

# 42. Observability

Admin health page:
- API
- database
- disk
- backup
- worker
- integrations
- sync
- printer bridge
- license
- update status

Logs:
- structured JSON server logs
- correlation IDs
- business audit separated from diagnostic logs
- local log rotation
- optional cloud telemetry with explicit privacy settings

---

# 43. UX Requirements

- modern but dense business UI
- desktop-first for ERP, responsive where practical
- keyboard navigation everywhere in billing
- no modal overload
- clear posted/draft/cancelled status
- immediate validation near fields
- undo only for non-posted UI operations
- confirmation + reason for destructive/reversal actions
- English first; Hindi localization-ready
- date, number and currency localization
- fast global command/search palette
- favorites/recent screens
- user-configurable columns
- saved filters
- dark mode optional, not a priority over legibility

---

# 44. Approval Engine

Generic approval request:

- entity type/id
- requested by
- reason
- threshold/rule
- approver role/user
- status
- decision
- timestamp
- comments

Use for:
- excessive discount
- below-minimum price
- credit override
- backdated voucher
- purchase above threshold
- stock adjustment
- invoice cancellation
- period reopen

---

# 45. Configuration Engine

Avoid thousands of ad-hoc boolean columns.

Use:
- typed configuration registry
- company/branch/user scope
- default value
- validation
- UI metadata
- feature flag
- version/effective date
- audit history

Examples:
- allow negative stock
- batch selection method
- invoice rounding
- default payment mode
- credit action: warn/block
- POS auto-print
- price update on purchase
- near-expiry days

---

# 46. Testing Strategy

## 46.1 Automated

- unit tests for calculations
- property tests for accounting invariants
- integration tests with PostgreSQL
- API tests
- frontend component tests
- end-to-end Playwright
- migration tests
- backup/restore tests
- installer smoke tests
- sync conflict tests
- security tests
- performance tests

## 46.2 Golden invariants

Must always pass:
- voucher debits = credits
- stock movement conservation
- invoice total = line/tax/charge formula
- cancellation reverses correct effects
- no cross-company leakage
- tax snapshot remains immutable
- repeated idempotent request does not duplicate transaction
- branch sync cannot double-apply stock movement

## 46.3 Manual module gate

After every module, test:
- happy path
- role/permission boundaries
- validation/errors
- company isolation
- branch/godown isolation
- English/Hindi
- responsive/mobile where relevant
- keyboard flow
- print/export
- audit log
- offline behavior
- recovery after restart

---

# 47. Migration Strategy for New Customers

Phases:
1. discovery
2. data template
3. master import
4. opening balance
5. opening stock
6. parallel billing sandbox
7. reconciliation
8. go-live
9. first backup
10. restore test
11. handover

Migration must not require importing a competitor's proprietary database directly unless the customer provides a lawful documented export and an adapter is built.

---

# 48. Release Phases

The final product scope is all modules above. Implementation should be staged to control risk.

## Phase 0 — Platform Foundation
- repo, CI
- database/migrations
- auth/RBAC
- company/financial year
- audit
- config
- installer skeleton
- backup skeleton

## Phase 1 — Masters + Accounting Core
- party/item/tax
- ledgers/vouchers
- basic reports
- opening data

## Phase 2 — Sales + Purchase + Inventory
- invoices
- returns
- orders/challans
- stock ledger
- godown
- pricing

## Phase 3 — POS + Barcode + Cashier
- retail billing
- shift
- printer/barcode
- returns/exchange

## Phase 4 — GST + Banking + Credit
- tax reports
- integration adapters
- outstanding
- PDC
- reconciliation

## Phase 5 — Distribution
- field sales
- retailer ordering
- dispatch
- delivery
- collections
- schemes

## Phase 6 — Batch/Expiry/Pharmacy
- batch
- expiry
- salt/substitute
- regulatory-configurable controls

## Phase 7 — Multi-Branch Hybrid
- cloud backup
- owner app API
- branch sync
- conflict handling
- remote approvals

## Phase 8 — Manufacturing + Advanced MIS
- BOM
- production
- costing
- executive analytics

## Phase 9 — Production Hardening
- installer
- updater
- DR
- penetration testing
- performance
- migration tooling
- support console
- documentation

No phase is considered complete just because screens exist; acceptance criteria and invariants must pass.

---

# 49. Definition of Done for Any Module

A module is complete only when:

- database migration exists
- API validation exists
- authorization exists
- company/branch scoping exists
- audit events exist
- UI handles loading/empty/error states
- keyboard and accessibility basics pass
- automated tests pass
- manual checklist passes
- reports/printing required by workflow work
- import/export considered
- failure/retry behavior documented
- backup/restore compatibility verified
- localization strings externalized
- documentation updated
- no temporary code in production path

---

# 50. Production Readiness Checklist

Before pilot:
- clean install on fresh Windows server
- unattended restart test
- LAN reconnect test
- router/internet outage test
- printer tests
- barcode scanner tests
- 3+ simultaneous billing users
- database backup
- restore on second machine
- database corruption recovery runbook
- power-loss behavior
- disk-full behavior
- license server unavailable behavior
- GST provider unavailable behavior
- cloud unavailable behavior
- update rollback
- audit verification
- permission matrix review
- user acceptance signoff
- migration reconciliation signoff
- support escalation documented

---

# 51. Clean-Room Functional Parity Reference

Publicly documented competitor capabilities used only as requirements inspiration include:

- GST billing/accounting/inventory
- retail and wholesale billing
- multi-company
- godown/multi-store management
- sales and purchase orders/challans
- stock transfer/issue
- batch/expiry
- pharmacy salt/substitute and restricted-category reporting
- barcode/label printing
- bank reconciliation
- outstanding and collection
- operator permissions/logs
- invoice customization
- approvals
- cashier/home delivery
- POS
- schemes/special rates
- purchase import
- BOM
- multi-firm
- BI/report exports
- supply-chain/mobile order apps
- retailer ordering
- owner dashboard
- delivery tracking
- cloud backup/data sync

EVOLIX should implement these as original product workflows using its own terminology, UX, architecture, data model and code.

---

# 52. Recommended Product Differentiators

Rather than merely matching a legacy desktop ERP, EVOLIX should improve on the category with:

- clean modern UX
- fast global search
- first-class API
- reliable local-first web architecture
- encrypted automatic backups
- built-in restore verification
- safe branch synchronization
- clear audit trails
- role templates
- approval inbox
- browser/PWA clients instead of heavy workstation installs
- modern dashboards
- mobile-friendly owner view
- integration marketplace later
- self-service import mapper
- update rollback
- health/diagnostic console
- tenant-safe architecture from day one

---

# 53. Final Product Statement

EVOLIX Trade ERP must feel as dependable as a traditional office ERP during internet failure while providing the usability, security, integrations and remote visibility expected from a modern SaaS product.

The product is successful when a wholesaler or retailer can run an entire day—billing, purchasing, stock, accounts, printing and local reports—without internet; then reconnect and safely resume backups, statutory integrations, mobile sync and remote reporting without duplicate or lost transactions.
