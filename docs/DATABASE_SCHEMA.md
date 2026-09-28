# DATABASE_SCHEMA.md — EVOLIX Trade ERP

**Purpose:** Define the canonical logical database model.

This file is a schema blueprint. Alembic migrations and SQLAlchemy models are the executable implementation.

## Connected ERP — Schema Linkage Requirements

The schema must support the connected ERP principle: every business event produces correlated records across inventory, accounting, party balances, and audit. The following linkage patterns are required:

**Transaction Headers → Transaction Lines:**
Every transaction document (sales_invoices, purchase_invoices, sales_returns, etc.) has a header table and a lines table linked by foreign key.

**Transaction Lines → Stock Movements:**
Each transaction line that affects stock must create one or more `stock_movements` rows carrying `source_document_type`, `source_document_id`, and `source_line_id` back to the originating line.

**Transaction Headers → Accounting Vouchers:**
Each posted transaction must create a `vouchers` row carrying `source_document_type` and `source_document_id` linking back to the business transaction. The voucher is the accounting representation of that event.

**Accounting Voucher Lines → Bill Allocations:**
For party transactions (customer/supplier), `bill_allocations` link voucher lines to reference documents for outstanding/ageing tracking.

**Cancellation/Reversal Linkage:**
Cancelled transactions create reverse stock movements and reverse vouchers. These carry references to the original document they are reversing.

**Audit Trail:**
`audit_logs` carries `entity_type` and `entity_id` linking to any business record.

**This ensures:**
- From any stock balance → trace to movements → trace to source invoices/transfers
- From any accounting entry → trace to voucher → trace to source business transaction
- From any customer outstanding → trace to bill allocations → trace to invoices and receipts
- From any metric → drill down to source transactions → lines → effects

The existing schema already supports these patterns through the `source_document_type/id` fields on `stock_movements` and `vouchers`, and `reference_document_type/id` on `bill_allocations`. No structural schema changes are required for the connected ERP architecture.


---

# 1. General Rules

- PostgreSQL only.
- Use UUID/ULID identifiers.
- Use `NUMERIC` for money and quantity.
- Use UTC technical timestamps.
- Use business date separately.
- Posted documents are not physically deleted.
- All transactional rows must carry company scope.
- Branch/godown scope applies where relevant.
- Use foreign keys and database constraints.
- Human document numbers are not primary keys.

---

# 2. Common Columns

Most business tables include:

```text
id UUID PK
organization_id UUID
company_id UUID
branch_id UUID nullable where appropriate
created_at TIMESTAMPTZ
created_by UUID
updated_at TIMESTAMPTZ
updated_by UUID
version INTEGER
is_active BOOLEAN
```

Transactional documents also include:

```text
financial_year_id UUID
document_date DATE
status
document_number
series_id
posted_at
posted_by
cancelled_at
cancelled_by
```

---

# 3. Organization Structure

## organizations

```text
id
name
code
status
created_at
```

## sites

Physical ERP installation/site.

```text
id
organization_id
code
name
machine_identity
location_name
status
last_sync_at
```

## companies

```text
id
organization_id
legal_name
trade_name
business_type
pan
gstin
state_code
base_currency
timezone
default_language
status
```

## branches

```text
id
company_id
code
name
address
gstin
state_code
phone
email
is_head_office
```

## financial_years

```text
id
company_id
name
start_date
end_date
status
locked_until
closed_at
```

---

# 4. Identity

## users

```text
id
organization_id
username
display_name
email
phone
password_hash
is_active
is_locked
failed_login_count
language
last_login_at
```

## roles

```text
id
organization_id
name
description
system_role
```

## permissions

```text
id
code
module
resource
action
description
```

## user_roles

```text
user_id
role_id
company_id nullable
branch_id nullable
```

## role_permissions

```text
role_id
permission_id
scope
```

## sessions

```text
id
user_id
device_id
issued_at
expires_at
revoked_at
ip_address
user_agent
```

## password_history

```text
id
user_id
password_hash
created_at
```

---

# 5. Configuration

## configuration_definitions

```text
id
key
data_type
default_value
scope_type
validation_schema
description
```

## configuration_values

```text
id
definition_id
organization_id
company_id
branch_id
user_id
value_json
effective_from
effective_to
```

---

# 6. Number Series

## number_series

```text
id
company_id
branch_id
financial_year_id
document_type
prefix
suffix
next_number
padding
reset_policy
is_active
```

Must use transaction-safe increment.

---

# 7. Party

## parties

```text
id
company_id
code
party_type
name
legal_name
gstin
pan
state_code
credit_days
credit_limit
price_list_id
salesperson_id
route_id
area_id
is_blocked
block_reason
opening_balance
opening_balance_type
```

## party_addresses

```text
id
party_id
address_type
line1
line2
city
state
state_code
postal_code
country
```

## party_contacts

```text
id
party_id
name
phone
email
designation
```

## party_credit_overrides

```text
id
party_id
amount
valid_from
valid_until
approved_by
reason
```

---

# 8. Item

## items

```text
id
company_id
sku
name
short_name
item_type
primary_unit_id
category_id
brand_id
manufacturer_id
tax_class_id
hsn_code
purchase_rate
mrp
default_sale_rate
minimum_sale_rate
reorder_level
minimum_stock
maximum_stock
batch_required
expiry_required
serial_required
mfg_date_required
weight
pack_size
case_size
is_active
```

## item_aliases

```text
id
item_id
alias
```

## item_barcodes

```text
id
item_id
barcode
barcode_type
unit_id
pack_quantity
is_primary
```

## units

```text
id
company_id
code
name
decimal_places
```

## unit_conversions

```text
id
item_id
from_unit_id
to_unit_id
factor
```

## categories

```text
id
company_id
parent_id
name
```

## brands

```text
id
company_id
name
```

## manufacturers

```text
id
company_id
name
```

## salt_generics

```text
id
company_id
name
```

## item_salts

```text
item_id
salt_generic_id
strength
```

## item_substitutes

```text
item_id
substitute_item_id
priority
```

---

# 9. Tax

## tax_classes

```text
id
company_id
name
hsn_code
tax_rate
cgst_rate
sgst_rate
igst_rate
cess_rate
effective_from
effective_to
```

Historical posted lines must store tax snapshot.

---

# 10. Godown / Location

## godowns

```text
id
company_id
branch_id
code
name
address
is_default
```

## rack_bins

```text
id
godown_id
code
name
```

---

# 11. Batch

## batches

```text
id
company_id
item_id
batch_number
manufacture_date
expiry_date
mrp
purchase_rate
sale_rate
supplier_id
status
```

Unique should normally include:

```text
company_id + item_id + batch_number + relevant source policy
```

---

# 12. Stock Movement

## stock_movements

```text
id
company_id
branch_id
godown_id
rack_bin_id nullable
item_id
batch_id nullable
serial_id nullable
business_date
movement_type
quantity_delta
base_quantity_delta
unit_id
source_document_type
source_document_id
source_line_id
cost_rate
value_delta
created_at
```

This is the inventory source of truth.

## stock_balance_projection

```text
company_id
branch_id
godown_id
item_id
batch_id
quantity
reserved_quantity
available_quantity
updated_at
```

Projection can be rebuilt.

---

# 13. Stock Transfer

## stock_transfers

```text
id
company_id
from_branch_id
to_branch_id
from_godown_id
to_godown_id
document_number
document_date
status
dispatched_at
received_at
```

## stock_transfer_lines

```text
id
transfer_id
item_id
batch_id
quantity
unit_id
received_quantity
difference_quantity
```

---

# 14. Stock Count

## stock_counts

```text
id
company_id
branch_id
godown_id
count_date
status
snapshot_at
approved_by
```

## stock_count_lines

```text
id
stock_count_id
item_id
batch_id
expected_quantity
counted_quantity
variance
reason_code_id
```

---

# 15. Sales Documents

## sales_invoices

```text
id
company_id
branch_id
financial_year_id
series_id
document_number
document_date
party_id
billing_address_id
shipping_address_id
salesperson_id
route_id
price_list_id
status
payment_terms_days
due_date
taxable_amount
discount_amount
freight_amount
other_charges
round_off
tax_amount
grand_total
paid_amount
outstanding_amount
remarks
posted_at
posted_by
```

## sales_invoice_lines

```text
id
sales_invoice_id
line_number
item_id
batch_id
godown_id
unit_id
quantity
free_quantity
base_quantity
rate
mrp
discount_percent
discount_amount
taxable_value
tax_rate
cgst
sgst
igst
cess
line_total
cost_rate_snapshot
pricing_trace_json
tax_snapshot_json
```

---

# 16. Sales Orders

## sales_orders

```text
id
company_id
branch_id
party_id
document_number
document_date
status
valid_until
salesperson_id
route_id
total
```

## sales_order_lines

```text
id
sales_order_id
item_id
unit_id
ordered_quantity
converted_quantity
rate
discount
tax
```

---

# 17. Quotations / Challans

Use dedicated tables or shared commercial document model only if implementation remains type-safe.

Recommended dedicated:

```text
sales_quotations
sales_quotation_lines
sales_challans
sales_challan_lines
```

---

# 18. Sales Return

## sales_returns

```text
id
company_id
branch_id
original_invoice_id nullable
party_id
document_number
document_date
status
return_total
refund_mode
reason
```

## sales_return_lines

```text
id
sales_return_id
original_invoice_line_id nullable
item_id
batch_id
quantity
condition
restock
tax_snapshot_json
```

---

# 19. Purchase

## purchase_orders
## purchase_order_lines
## goods_receipts
## goods_receipt_lines
## purchase_invoices
## purchase_invoice_lines
## purchase_returns
## purchase_return_lines

Purchase invoice header similar to sales, with:

```text
supplier_invoice_number
supplier_invoice_date
supplier_id
freight
landed_cost
tax
grand_total
```

Purchase line:

```text
item
batch
expiry
qty
free_qty
purchase_rate
mrp
discount
tax
landed_cost_allocated
```

---

# 20. Pricing

## price_lists

```text
id
company_id
name
valid_from
valid_to
```

## price_list_lines

```text
id
price_list_id
item_id
min_qty
max_qty
rate
discount_percent
```

## discount_rules

```text
id
company_id
name
priority
rule_json
valid_from
valid_to
stackable
```

---

# 21. Schemes

## schemes

```text
id
company_id
name
scheme_type
priority
valid_from
valid_to
stackable
is_active
```

## scheme_rules

```text
id
scheme_id
conditions_json
benefit_json
```

## applied_promotions

```text
id
document_type
document_id
line_id nullable
scheme_id
benefit_value
trace_json
```

---

# 22. Accounting

## account_groups

```text
id
company_id
parent_id
name
nature
```

## ledger_accounts

```text
id
company_id
code
name
group_id
party_id nullable
bank_account_id nullable
is_active
```

## vouchers

```text
id
company_id
branch_id
financial_year_id
voucher_type
document_number
voucher_date
status
source_document_type nullable
source_document_id nullable
narration
posted_at
posted_by
```

## voucher_lines

```text
id
voucher_id
ledger_account_id
debit
credit
party_id nullable
cost_center_id nullable
reference_type nullable
reference_id nullable
narration
```

Constraint/invariant:

```text
sum(debit) == sum(credit)
```

---

# 23. Bill Allocation

## bill_allocations

```text
id
company_id
party_id
voucher_line_id
reference_document_type
reference_document_id
allocation_type
amount
due_date
```

Supports receivable/payable ageing.

---

# 24. Banking

## bank_accounts

```text
id
company_id
bank_name
account_name
account_number_masked
ifsc
branch_name
ledger_account_id
```

## cheques

```text
id
company_id
party_id
bank_account_id
cheque_number
cheque_date
amount
direction
status
```

## bank_statements

```text
id
bank_account_id
period_start
period_end
imported_at
```

## bank_statement_lines

```text
id
bank_statement_id
transaction_date
description
reference
debit
credit
balance
match_status
```

## reconciliation_matches

```text
id
statement_line_id
voucher_line_id
amount
match_type
```

---

# 25. Credit

## credit_policies

```text
id
party_id
credit_limit
credit_days
overdue_action
credit_limit_action
temporary_limit
temporary_limit_until
```

---

# 26. Approval

## approval_requests

```text
id
company_id
entity_type
entity_id
rule_code
requested_by
requested_at
reason
status
approved_by
decided_at
decision_comment
```

---

# 27. Audit

## audit_logs

```text
id
organization_id
company_id
branch_id
user_id
action
entity_type
entity_id
before_json
after_json
reason
ip_address
device_id
created_at
```

---

# 28. Dispatch

## dispatches

```text
id
company_id
branch_id
document_number
status
transporter_id
vehicle_number
dispatch_date
```

## dispatch_invoice_links

```text
dispatch_id
sales_invoice_id
```

## packages

```text
id
dispatch_id
package_number
weight
notes
```

---

# 29. Delivery

## delivery_assignments

```text
id
company_id
delivery_user_id
route_id
assigned_date
status
```

## delivery_items

```text
id
assignment_id
sales_invoice_id
sequence
status
cod_amount
```

## delivery_events

```text
id
delivery_item_id
event_type
event_time
reason
latitude nullable
longitude nullable
proof_attachment_id nullable
```

---

# 30. Field Sales

## sales_routes
## sales_beats
## sales_visits
## mobile_orders
## mobile_order_lines
## collection_entries

Every mobile mutation requires sync metadata and idempotency.

---

# 31. Manufacturing

## boms

```text
id
company_id
finished_item_id
version
status
yield_quantity
```

## bom_lines

```text
id
bom_id
item_id
quantity
unit_id
wastage_percent
```

## production_orders
## production_issues
## production_issue_lines
## production_receipts
## production_receipt_lines

---

# 32. Printing

## print_templates

```text
id
company_id
document_type
name
paper_size
template_json
is_default
```

---

# 33. Notifications

## notification_templates

```text
id
company_id
event_type
channel
language
subject_template
body_template
```

## notification_jobs

```text
id
company_id
event_type
channel
recipient
payload_json
status
attempts
last_error
```

---

# 34. Integrations

## integration_jobs

```text
id
company_id
integration_type
entity_type
entity_id
idempotency_key
request_json_redacted
response_json_redacted
status
attempts
next_retry_at
last_error
```

---

# 35. GST Documents

## tax_documents

```text
id
company_id
source_document_type
source_document_id
tax_document_type
status
provider_reference
irn
ack_number
ack_date
qr_data
cancelled_at
```

---

# 36. Sync

## sync_events

```text
id
site_id
sequence_number
company_id
entity_type
entity_id
event_type
entity_version
payload_json
created_at
sent_at
status
```

## sync_inbox

```text
id
source_site_id
event_id
received_at
processed_at
status
error
```

## sync_checkpoints

```text
id
local_site_id
remote_site_id
last_sequence
updated_at
```

---

# 37. Backup

## backup_records

```text
id
site_id
started_at
completed_at
backup_type
file_name
size_bytes
checksum
encryption_version
local_path
cloud_reference
status
verified_at
```

## restore_records

```text
id
backup_record_id
started_at
completed_at
performed_by
status
verification_json
```

---

# 38. Licensing

## license_state

```text
id
organization_id
site_id
license_id
plan
features_json
valid_until
offline_grace_until
last_verified_at
signature
```

---

# 39. Attachments

## attachments

```text
id
company_id
entity_type
entity_id
file_name
mime_type
size
storage_reference
checksum
uploaded_by
uploaded_at
```

---

# 40. Soft Delete / Archive

Use:

```text
is_active
archived_at
archived_by
```

Do not soft-delete posted financial transactions as if they never existed.

---

# 41. Indexes

Critical indexes include:

```text
items(company_id, sku)
items(company_id, name)
item_barcodes(company_id, barcode)
parties(company_id, name)
parties(company_id, gstin)

sales_invoices(company_id, document_date)
sales_invoices(company_id, party_id, document_date)
purchase_invoices(company_id, supplier_id, document_date)

stock_movements(company_id, godown_id, item_id, business_date)
stock_movements(company_id, item_id, batch_id)
voucher_lines(ledger_account_id)
vouchers(company_id, voucher_date)

sync_events(site_id, sequence_number)
integration_jobs(status, next_retry_at)
```

Use trigram/full-text where justified for search.

---

# 42. Constraints

Database constraints should enforce:

- unique SKU within configured company scope
- unique barcode where required
- valid debit/credit polarity
- non-null company for business transaction
- no invalid foreign references
- no duplicate sync event processing
- valid document status transitions where feasible

---

# 43. Migration Rules

Every schema change requires Alembic migration.

Risky changes should use:

```text
expand
backfill
switch
contract
```

Avoid destructive migrations during billing hours.

---

# 44. Schema Acceptance Rules

Before approving schema changes, verify:

- company isolation
- branch ownership
- financial history preservation
- stock traceability
- accounting balance
- auditability
- sync compatibility
- migration safety
