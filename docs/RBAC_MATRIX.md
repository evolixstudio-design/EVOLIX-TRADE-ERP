# RBAC_MATRIX.md — EVOLIX Trade ERP

**Purpose:** Define authorization model, roles and permissions.

## Connected ERP — Workflow-Based Permissions

Permissions are based on BUSINESS OPERATIONS, not just screens or CRUD.

A permission must answer: "Can this user perform this specific business action in this scope?"

**Transaction permissions follow the business lifecycle:**

```text
sales.invoice.create       → Can create a draft sales invoice
sales.invoice.post         → Can finalize/post a sales invoice (triggers all domain effects)
sales.invoice.cancel       → Can cancel a posted invoice (triggers reversal effects)
sales.invoice.read         → Can view sales invoices

purchase.invoice.create    → Can create a draft purchase invoice
purchase.invoice.post      → Can finalize/post a purchase invoice
purchase.invoice.cancel    → Can cancel a posted purchase invoice

accounts.receipt.create    → Can create a customer receipt
accounts.receipt.post      → Can post a receipt (triggers accounting + bill allocation)
accounts.payment.create    → Can create a supplier payment
accounts.payment.post      → Can post a payment

inventory.transfer.create  → Can create a stock transfer
inventory.transfer.dispatch → Can dispatch a transfer
inventory.transfer.receive → Can receive a transfer

inventory.adjustment.create → Can create a stock adjustment
inventory.adjustment.post  → Can post an adjustment (requires approval if configured)

stock_transfer.create      → Alias for inventory.transfer.create
stock_adjustment.create    → Alias for inventory.adjustment.create

reports.read               → Can view reports (further scoped by report type)
```

**Posting permissions are critical:** The `.post` permission is what triggers domain effects (stock, accounting, tax). Separate `.create` (draft) from `.post` (finalize) permissions ensures proper review workflows.

The approved Module 01 security model (server-side enforcement, RBAC scopes) remains authoritative. The permission codes listed in §6–26 below are the canonical permission set.


---

# 1. Security Principle

Frontend visibility is convenience.

Backend permission checks are security.

No action is allowed solely because the button is visible.

---

# 2. Permission Format

```text
module.resource.action
```

Examples:

```text
sales.invoice.read
sales.invoice.create
sales.invoice.post
sales.invoice.cancel
sales.invoice.override_price
inventory.transfer.create
accounts.voucher.post
reports.profit_loss.view
admin.backup.restore
```

---

# 3. Permission Scope

Possible scopes:

```text
OWN
ASSIGNED
GODOWN
BRANCH
COMPANY
ALL_COMPANIES
```

Scope is evaluated server-side.

---

# 4. Default Roles

Recommended default role templates:

1. Owner / Super Admin
2. Company Administrator
3. Accountant
4. Senior Accountant
5. Billing Operator
6. Retail Cashier
7. Purchase Operator
8. Warehouse Operator
9. Warehouse Manager
10. Sales Manager
11. Salesperson
12. Delivery Executive
13. Auditor / CA
14. Read Only
15. IT / Support Administrator

Roles are templates; customer may create custom roles.

---

# 5. High-Level Matrix

| Capability | Owner | Admin | Accountant | Billing | Cashier | Purchase | Warehouse | Sales Mgr | Auditor |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Company settings | ✅ | ✅ | ◐ | ❌ | ❌ | ❌ | ❌ | ❌ | 👁 |
| User management | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Sales create | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | 👁 |
| Sales cancel | ✅ | ✅ | ✅ | ◐ | ❌ | ❌ | ❌ | ◐ | 👁 |
| Price override | ✅ | ✅ | ◐ | ◐ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Purchase create | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ | ◐ | ❌ | 👁 |
| Stock transfer | ✅ | ✅ | 👁 | ❌ | ❌ | ◐ | ✅ | ❌ | 👁 |
| Stock adjustment | ✅ | ✅ | ◐ | ❌ | ❌ | ❌ | ◐ | ❌ | 👁 |
| Receipt/payment | ✅ | ✅ | ✅ | ◐ | ◐ | ❌ | ❌ | ◐ | 👁 |
| Journal voucher | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | 👁 |
| P&L | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ◐ | 👁 |
| Cost price | ✅ | ✅ | ✅ | ◐ | ❌ | ✅ | ◐ | ◐ | 👁 |
| Backup | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Restore | ✅ | ◐ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

Legend:

```text
✅ allowed by default
◐ restricted / approval / scope
👁 read-only
❌ denied
```

---

# 6. Identity Permissions

```text
identity.user.read
identity.user.create
identity.user.update
identity.user.disable
identity.user.reset_password
identity.user.force_logout

identity.role.read
identity.role.create
identity.role.update
identity.role.delete

identity.permission.read
identity.session.read
identity.session.revoke
```

---

# 7. Company Permissions

```text
company.profile.read
company.profile.update
company.branch.read
company.branch.create
company.branch.update
company.financial_year.read
company.financial_year.create
company.financial_year.close
company.financial_year.reopen
company.number_series.manage
```

Financial year reopen is highly privileged.

---

# 8. Configuration Permissions

```text
config.read
config.company.update
config.branch.update
config.user.update
config.printing.update
config.tax.update
config.inventory.update
config.accounting.update
```

---

# 9. Master Permissions

Party:

```text
masters.party.read
masters.party.create
masters.party.update
masters.party.archive
masters.party.credit_update
masters.party.export
```

Item:

```text
masters.item.read
masters.item.create
masters.item.update
masters.item.archive
masters.item.cost_view
masters.item.price_update
masters.item.export
```

Other:

```text
masters.category.manage
masters.brand.manage
masters.unit.manage
masters.tax.manage
masters.godown.manage
masters.route.manage
```

---

# 10. Sales Permissions

```text
sales.invoice.read
sales.invoice.create
sales.invoice.update_draft
sales.invoice.post
sales.invoice.cancel
sales.invoice.reprint
sales.invoice.duplicate
sales.invoice.export

sales.invoice.override_price
sales.invoice.override_discount
sales.invoice.override_credit
sales.invoice.override_negative_stock

sales.return.read
sales.return.create
sales.return.post
sales.return.approve
```

---

# 11. POS Permissions

```text
pos.sale.create
pos.sale.post
pos.sale.hold
pos.sale.resume
pos.sale.discount
pos.sale.price_override
pos.return.create
pos.return.approve

pos.shift.open
pos.shift.close
pos.shift.cash_in
pos.shift.cash_out
pos.shift.view_variance
```

---

# 12. Purchase Permissions

```text
purchase.order.read
purchase.order.create
purchase.order.approve
purchase.order.cancel

purchase.invoice.read
purchase.invoice.create
purchase.invoice.post
purchase.invoice.cancel
purchase.invoice.override_rate

purchase.return.create
purchase.return.post
```

---

# 13. Inventory Permissions

```text
inventory.stock.read
inventory.stock.cost_view
inventory.stock.ledger_read

inventory.transfer.create
inventory.transfer.dispatch
inventory.transfer.receive
inventory.transfer.cancel

inventory.adjustment.create
inventory.adjustment.post
inventory.adjustment.approve

inventory.count.create
inventory.count.enter
inventory.count.approve
inventory.count.post
```

---

# 14. Pricing Permissions

```text
pricing.price_list.read
pricing.price_list.manage
pricing.scheme.read
pricing.scheme.manage
pricing.discount_rule.manage
```

---

# 15. Accounting Permissions

```text
accounts.ledger.read
accounts.ledger.create
accounts.ledger.update

accounts.voucher.read
accounts.voucher.create
accounts.voucher.post
accounts.voucher.cancel
accounts.voucher.backdate

accounts.receipt.create
accounts.receipt.post
accounts.payment.create
accounts.payment.post
accounts.journal.create
accounts.journal.post

accounts.period.lock
accounts.period.reopen
```

---

# 16. Banking Permissions

```text
banking.account.read
banking.account.manage
banking.cheque.read
banking.cheque.manage
banking.statement.import
banking.reconciliation.read
banking.reconciliation.perform
```

---

# 17. Credit Permissions

```text
credit.outstanding.read
credit.limit.read
credit.limit.update
credit.override.request
credit.override.approve
```

---

# 18. Tax Permissions

```text
tax.report.read
tax.gst_config.manage
tax.einvoice.create
tax.einvoice.cancel
tax.eway.create
tax.eway.cancel
tax.reconciliation.perform
tax.export
```

---

# 19. Reports Permissions

```text
reports.sales.view
reports.purchase.view
reports.inventory.view
reports.accounting.view
reports.outstanding.view
reports.tax.view
reports.profit_loss.view
reports.balance_sheet.view
reports.margin.view
reports.cost_view
reports.export
```

---

# 20. Dispatch / Delivery Permissions

```text
dispatch.read
dispatch.create
dispatch.pack
dispatch.dispatch
dispatch.cancel

delivery.assignment.read
delivery.assignment.create
delivery.status.update
delivery.collection.create
delivery.pod.upload
```

---

# 21. Field Sales Permissions

```text
field_sales.customer.read
field_sales.order.create
field_sales.collection.create
field_sales.visit.create
field_sales.route.read
field_sales.performance.view
```

---

# 22. Pharmacy Permissions

```text
pharmacy.batch.read
pharmacy.expiry.read
pharmacy.restricted_item.sell
pharmacy.prescription.attach
pharmacy.compliance_report.view
```

---

# 23. Manufacturing Permissions

```text
manufacturing.bom.read
manufacturing.bom.manage
manufacturing.production_order.create
manufacturing.material_issue.post
manufacturing.production_receipt.post
manufacturing.cost.view
```

---

# 24. Backup / Restore

```text
admin.backup.read
admin.backup.create
admin.backup.download
admin.backup.delete
admin.backup.restore
admin.restore_history.read
```

`admin.backup.restore` is one of the highest-risk permissions.

---

# 25. Sync / Cloud

```text
admin.sync.read
admin.sync.retry
admin.sync.resolve_conflict
admin.cloud_settings.manage
admin.remote_access.manage
```

---

# 26. Licensing / Update

```text
admin.license.read
admin.license.activate
admin.update.read
admin.update.install
admin.update.rollback
```

---

# 27. Support Role Restrictions

IT/support user may:

- inspect health
- view logs
- trigger backup
- inspect sync
- manage printer

Support should NOT automatically receive:

- P&L
- cost price
- customer balances
- salary
- business confidential reports

unless specifically granted.

---

# 28. Sensitive Data Permissions

Separate flags:

```text
sensitive.cost_price.view
sensitive.margin.view
sensitive.bank_details.view
sensitive.customer_balance.view
sensitive.employee_data.view
```

---

# 29. Approval-Capable Permissions

Approvers:

```text
approval.discount.approve
approval.price_override.approve
approval.credit_override.approve
approval.stock_adjustment.approve
approval.purchase.approve
approval.invoice_cancel.approve
approval.backdated_voucher.approve
approval.period_reopen.approve
```

---

# 30. Role Defaults

## Owner

Nearly all business permissions.

Restore/update actions still require explicit confirmation.

## Company Administrator

Administration + operational management.

May exclude confidential profit/cost if owner chooses.

## Accountant

Accounts, banking, GST, financial reports.

No user/security administration by default.

## Billing Operator

Sales entry and limited customer lookup.

No cost/profit or accounting journal by default.

## Cashier

POS only.

No wholesale configuration.

## Purchase Operator

Purchase/order/supplier workflows.

No high-level financial reporting by default.

## Warehouse Operator

Stock movement/transfer/count.

No financial editing.

## Sales Manager

Sales orders, pricing visibility, salesperson performance, limited approvals.

## Auditor

Read-only access.

No business mutation.

---

# 31. Server Enforcement Pattern

Each protected service must enforce:

```text
authenticated user
→ company access
→ branch scope
→ permission code
→ optional data scope
→ optional approval threshold
```

---

# 32. UI Behavior

When permission denied:

- hide action if it reduces clutter;
- still reject direct API attempt;
- show clear message for blocked operations.

---

# 33. Permission Testing

Every sensitive API needs tests for:

```text
allowed role
denied role
wrong company
wrong branch
forged entity id
inactive user
revoked session
```

---

# 34. RBAC Acceptance Rule

No module is complete until:

- permission codes defined
- default roles mapped
- backend checks implemented
- UI behavior implemented
- isolation tests pass
