# TRANSACTION_WORKFLOW.md — EVOLIX Trade ERP

**Purpose:** Document the lifecycle, validation, effects, and reversal behavior of every transaction type.

**Rule:** Where the existing project has not yet defined a behavior, it is marked: `TBD — REQUIRES BUSINESS RULE DECISION`. Do not silently invent accounting behavior.

---

# 1. Transaction Lifecycle Model

Every transaction follows this general lifecycle:

```text
DRAFT → POSTED → (CANCELLED / REVERSED)
```

Some transactions may additionally support:

```text
DRAFT → PENDING_APPROVAL → APPROVED → POSTED → (CANCELLED / REVERSED)
```

Rules:
- Drafts can be edited or deleted freely
- Posted transactions are immutable from an ordinary user's perspective
- Correction requires reversal + new document
- Cancellation creates an audited reversal, not a deletion
- Original posted values remain historically visible

---

# 2. Purchase Invoice

| Aspect | Detail |
|--------|--------|
| **Who can create** | `purchase.invoice.create` permission |
| **Required master data** | Supplier (party), Items, Godown, Tax Class, Financial Year |
| **Validation** | Supplier active, items active, UOM valid, batch/expiry complete for required items, quantity > 0, tax valid, financial year open, period not locked |
| **Draft state** | Yes — editable until posted |
| **Posting** | `purchase.invoice.post` permission. Atomic: insert invoice + lines + stock movements + accounting voucher + audit event in one DB transaction |
| **Inventory effect** | `PURCHASE_IN` stock movement: +quantity in specified godown per line |
| **Customer/Supplier effect** | Supplier payable increases by grand total (credit purchase) |
| **Cash/Bank effect** | Cash/Bank decreases (cash purchase only) |
| **Accounting effect** | Dr Inventory + Dr Input GST, Cr Supplier/Cash (see ACCOUNTING_RULES.md §9–10) |
| **Tax/GST effect** | Input CGST/SGST (intra-state) or Input IGST (inter-state). Tax snapshot stored per line |
| **Audit event** | `PURCHASE_INVOICE_POSTED` |
| **Reversal behavior** | Cancel creates reverse stock movement (`PURCHASE_IN` reversal) + reverse accounting voucher. Original remains visible |
| **Reporting impact** | Purchase register, supplier ledger, stock ledger, GST input reports |
| **Lineage** | Voucher → source_document_type=PURCHASE_INVOICE, source_document_id. Stock movement → source_document_type/id/line_id |

---

# 3. Purchase Order

| Aspect | Detail |
|--------|--------|
| **Who can create** | `purchase.order.create` permission |
| **Required master data** | Supplier, Items, Units |
| **Validation** | Supplier active, items active, quantity > 0 |
| **Draft state** | Yes |
| **Posting** | Approval workflow (if configured). Status: APPROVED |
| **Inventory effect** | None directly. May affect pending purchase quantities for reorder reports |
| **Customer/Supplier effect** | None until converted to Purchase Invoice |
| **Cash/Bank effect** | None |
| **Accounting effect** | None |
| **Tax/GST effect** | None (estimated only) |
| **Audit event** | `PURCHASE_ORDER_CREATED`, `PURCHASE_ORDER_APPROVED` |
| **Reversal behavior** | Cancel changes status to CANCELLED. No financial reversal needed |
| **Reporting impact** | Pending purchase orders report |
| **Lineage** | Purchase Invoice can reference originating PO |

---

# 4. Purchase Receipt / Goods Receipt

| Aspect | Detail |
|--------|--------|
| **Who can create** | `purchase.invoice.create` or `inventory.transfer.receive` (TBD — REQUIRES BUSINESS RULE DECISION on exact permission) |
| **Required master data** | Supplier, Items, Godown |
| **Validation** | Items valid, godown valid, quantity > 0 |
| **Draft state** | Yes |
| **Posting** | Creates stock inward without financial posting |
| **Inventory effect** | `PURCHASE_IN` (provisional) or TBD — separate `GOODS_RECEIPT_IN` movement type |
| **Customer/Supplier effect** | TBD — may create provisional payable or none until invoice |
| **Cash/Bank effect** | None |
| **Accounting effect** | TBD — REQUIRES BUSINESS RULE DECISION (provisional entry vs. no entry until invoice) |
| **Tax/GST effect** | None until purchase invoice |
| **Audit event** | `GOODS_RECEIPT_POSTED` |
| **Reversal behavior** | Cancel reverses provisional stock movement |
| **Reporting impact** | Pending invoicing report, stock ledger |
| **Lineage** | Links to PO (if applicable). Purchase Invoice links to Goods Receipt |

---

# 5. Purchase Return

| Aspect | Detail |
|--------|--------|
| **Who can create** | `purchase.return.create` permission |
| **Required master data** | Supplier, Items, Godown, original Purchase Invoice (optional but recommended) |
| **Validation** | Items active, sufficient stock in godown for return quantity, batch valid |
| **Draft state** | Yes |
| **Posting** | `purchase.return.post` permission |
| **Inventory effect** | `PURCHASE_RETURN_OUT` stock movement: −quantity from specified godown |
| **Customer/Supplier effect** | Supplier payable decreases |
| **Cash/Bank effect** | None directly (adjustment via debit note / payment adjustment) |
| **Accounting effect** | Dr Supplier, Cr Purchase Return/Inventory + Cr Input GST Reversal (see ACCOUNTING_RULES.md §12) |
| **Tax/GST effect** | Input GST reversed |
| **Audit event** | `PURCHASE_RETURN_POSTED` |
| **Reversal behavior** | Cancel creates reverse movements and reverse voucher |
| **Reporting impact** | Purchase return register, supplier ledger, stock ledger, GST input adjustment |
| **Lineage** | original_invoice_id references source purchase. Voucher links via source_document |

---

# 6. Sales Invoice

| Aspect | Detail |
|--------|--------|
| **Who can create** | `sales.invoice.create` permission |
| **Required master data** | Customer (party), Items, Godown, Tax Class, Financial Year, Price List (optional) |
| **Validation** | Customer active, items active, godown valid, batch valid (if required), expiry valid, stock available (per negative stock policy), credit limit (if credit sale), financial year open, period not locked |
| **Draft state** | Yes — editable until posted |
| **Posting** | `sales.invoice.post` permission. Atomic: insert invoice + lines + stock movements + accounting voucher + bill allocation + audit event in one DB transaction |
| **Inventory effect** | `SALE_OUT` stock movement: −quantity from specified godown per line |
| **Customer/Supplier effect** | Customer receivable increases by grand total (credit sale). Bill allocation created (NEW_REFERENCE) |
| **Cash/Bank effect** | Cash/Bank increases (cash sale) |
| **Accounting effect** | Dr Customer/Cash + (Dr COGS, Cr Inventory if perpetual), Cr Sales + Cr Output GST (see ACCOUNTING_RULES.md §6–8) |
| **Tax/GST effect** | Output CGST/SGST (intra-state) or Output IGST (inter-state). Tax snapshot stored per line |
| **Audit event** | `SALES_INVOICE_POSTED` |
| **Reversal behavior** | Cancel creates reverse stock movement + reverse accounting voucher + reverse bill allocation. Original remains visible |
| **Reporting impact** | Sales register, customer ledger, stock ledger, margin report, GST output reports |
| **Lineage** | Voucher → source_document_type=SALES_INVOICE. Stock movement → source. Bill allocation → reference_document |

---

# 7. Sales Order

| Aspect | Detail |
|--------|--------|
| **Who can create** | `sales.order.create` permission (TBD — exact permission code) |
| **Required master data** | Customer, Items, Units |
| **Validation** | Customer active, items active, quantity > 0 |
| **Draft state** | Yes |
| **Posting** | Confirmed / Approved status |
| **Inventory effect** | None directly. May reserve stock (reserved_quantity) if configured |
| **Customer/Supplier effect** | None until converted to Sales Invoice |
| **Cash/Bank effect** | None |
| **Accounting effect** | None |
| **Tax/GST effect** | None (estimated only) |
| **Audit event** | `SALES_ORDER_CREATED`, `SALES_ORDER_CONFIRMED` |
| **Reversal behavior** | Cancel changes status. Releases any reservations |
| **Reporting impact** | Pending sales orders, order conversion report |
| **Lineage** | Sales Invoice can reference originating SO. Tracks converted/pending quantities |

---

# 8. Delivery Challan

| Aspect | Detail |
|--------|--------|
| **Who can create** | TBD — `sales.challan.create` or `dispatch.create` |
| **Required master data** | Customer, Items, Godown |
| **Validation** | Items valid, stock available, godown valid |
| **Draft state** | Yes |
| **Posting** | Dispatched status |
| **Inventory effect** | `SALE_OUT` or TBD — separate `CHALLAN_OUT` movement type (REQUIRES BUSINESS RULE DECISION: does challan deduct stock or does only invoice deduct stock?) |
| **Customer/Supplier effect** | None until invoiced |
| **Cash/Bank effect** | None |
| **Accounting effect** | None until invoiced |
| **Tax/GST effect** | None until invoiced |
| **Audit event** | `CHALLAN_DISPATCHED` |
| **Reversal behavior** | Cancel. If stock was deducted, reverse movement |
| **Reporting impact** | Pending invoicing report, dispatch report |
| **Lineage** | Sales Invoice references challan_id |

---

# 9. Sales Return

| Aspect | Detail |
|--------|--------|
| **Who can create** | `sales.return.create` permission |
| **Required master data** | Customer, Items, Godown, original Sales Invoice (optional but recommended) |
| **Validation** | Items active, godown valid, return quantity ≤ originally sold (if linked), batch valid |
| **Draft state** | Yes |
| **Posting** | `sales.return.post` permission |
| **Inventory effect** | `SALE_RETURN_IN` stock movement: +quantity to specified godown. Saleable vs. damaged classification determines target location |
| **Customer/Supplier effect** | Customer receivable decreases (credit note / balance adjustment) |
| **Cash/Bank effect** | Cash refund if applicable |
| **Accounting effect** | Dr Sales Return + Dr Output GST Reversal, Cr Customer (see ACCOUNTING_RULES.md §11) |
| **Tax/GST effect** | Output GST reversed |
| **Audit event** | `SALES_RETURN_POSTED` |
| **Reversal behavior** | Cancel creates reverse movements and reverse voucher |
| **Reporting impact** | Sales return register, customer ledger, stock ledger, GST output adjustment |
| **Lineage** | original_invoice_id, original_invoice_line_id. Voucher links via source_document |

---

# 10. Receipt (Customer Payment)

| Aspect | Detail |
|--------|--------|
| **Who can create** | `accounts.receipt.create` permission |
| **Required master data** | Customer (party), Cash/Bank ledger account |
| **Validation** | Customer active, amount > 0, payment mode valid, financial year open |
| **Draft state** | TBD — REQUIRES BUSINESS RULE DECISION (most ERPs post receipts immediately) |
| **Posting** | `accounts.receipt.post` permission |
| **Inventory effect** | None |
| **Customer/Supplier effect** | Customer outstanding decreases |
| **Cash/Bank effect** | Cash or Bank balance increases |
| **Accounting effect** | Dr Cash/Bank, Cr Customer (see ACCOUNTING_RULES.md §13–14) |
| **Tax/GST effect** | None (unless TDS/TCS applies — TBD) |
| **Audit event** | `RECEIPT_POSTED` |
| **Reversal behavior** | Cancel creates reverse voucher. Bill allocations reversed |
| **Reporting impact** | Cash/bank book, customer ledger, outstanding/ageing reports |
| **Lineage** | Bill allocation links receipt to specific invoices |

---

# 11. Payment (Supplier Payment)

| Aspect | Detail |
|--------|--------|
| **Who can create** | `accounts.payment.create` permission |
| **Required master data** | Supplier (party), Cash/Bank ledger account |
| **Validation** | Supplier active, amount > 0, payment mode valid, financial year open |
| **Draft state** | TBD — REQUIRES BUSINESS RULE DECISION |
| **Posting** | `accounts.payment.post` permission |
| **Inventory effect** | None |
| **Customer/Supplier effect** | Supplier payable decreases |
| **Cash/Bank effect** | Cash or Bank balance decreases |
| **Accounting effect** | Dr Supplier, Cr Cash/Bank (see ACCOUNTING_RULES.md §15) |
| **Tax/GST effect** | None (unless TDS/TCS applies — TBD) |
| **Audit event** | `PAYMENT_POSTED` |
| **Reversal behavior** | Cancel creates reverse voucher. Bill allocations reversed |
| **Reporting impact** | Cash/bank book, supplier ledger, outstanding/ageing reports |
| **Lineage** | Bill allocation links payment to specific invoices |

---

# 12. Stock Transfer

| Aspect | Detail |
|--------|--------|
| **Who can create** | `inventory.transfer.create` permission |
| **Required master data** | Source godown, destination godown, Items |
| **Validation** | Both godowns valid and belong to same company, items active, stock available in source godown, batch valid |
| **Draft state** | Yes |
| **Posting** | `inventory.transfer.dispatch` and `inventory.transfer.receive` permissions |
| **Inventory effect** | `TRANSFER_OUT` from source godown, `TRANSFER_IN` to destination godown. Net company stock unchanged |
| **Customer/Supplier effect** | None |
| **Cash/Bank effect** | None |
| **Accounting effect** | None for intra-company transfers. TBD for inter-branch transfers if branches have separate books |
| **Tax/GST effect** | None for intra-company. TBD for inter-state branch transfers (may require delivery challan + e-way bill) |
| **Audit event** | `STOCK_TRANSFER_DISPATCHED`, `STOCK_TRANSFER_RECEIVED` |
| **Reversal behavior** | Cancel reverses both movements. Discrepancy (sent ≠ received) requires separate adjustment |
| **Reporting impact** | Stock transfer register, stock ledger, godown stock |
| **Lineage** | Stock movement source_document_type=STOCK_TRANSFER |

---

# 13. Stock Adjustment

| Aspect | Detail |
|--------|--------|
| **Who can create** | `inventory.adjustment.create` permission |
| **Required master data** | Item, Godown, Reason code |
| **Validation** | Item active, godown valid, quantity change valid, reason provided |
| **Draft state** | Yes |
| **Posting** | `inventory.adjustment.post` permission. May require approval (`inventory.adjustment.approve`) for high-value adjustments |
| **Inventory effect** | `ADJUSTMENT_IN` or `ADJUSTMENT_OUT` stock movement |
| **Customer/Supplier effect** | None |
| **Cash/Bank effect** | None |
| **Accounting effect** | TBD — REQUIRES BUSINESS RULE DECISION (some businesses book stock write-off to expense, others defer to year-end) |
| **Tax/GST effect** | TBD — REQUIRES BUSINESS RULE DECISION (GST implications of stock write-off) |
| **Audit event** | `STOCK_ADJUSTMENT_POSTED` |
| **Reversal behavior** | Cancel creates reverse movement |
| **Reporting impact** | Stock adjustment register, stock ledger |
| **Lineage** | Stock movement source_document_type=STOCK_ADJUSTMENT |

---

# 14. Opening Stock

| Aspect | Detail |
|--------|--------|
| **Who can create** | Privileged user during initial setup or year-beginning |
| **Required master data** | Item, Godown, Batch (if applicable), Rate/Value |
| **Validation** | Item active, godown valid, quantity > 0, rate > 0 |
| **Draft state** | Bulk entry with review before commit |
| **Posting** | Committed as part of opening process |
| **Inventory effect** | `OPENING` stock movement: +quantity |
| **Customer/Supplier effect** | None |
| **Cash/Bank effect** | None |
| **Accounting effect** | Dr Inventory, Cr Opening Stock Equity (see ACCOUNTING_RULES.md §28). Must reconcile with accounting opening |
| **Tax/GST effect** | None |
| **Audit event** | `OPENING_STOCK_POSTED` |
| **Reversal behavior** | TBD — REQUIRES BUSINESS RULE DECISION (can opening be edited or only adjusted?) |
| **Reporting impact** | Stock summary, stock valuation |
| **Lineage** | Stock movement source_document_type=OPENING_STOCK |

---

# 15. Opening Balance (Customer/Supplier/Ledger)

| Aspect | Detail |
|--------|--------|
| **Who can create** | Privileged user during initial setup |
| **Required master data** | Party or Ledger Account, Amount |
| **Validation** | Party/ledger active, amount valid |
| **Draft state** | Bulk entry with review |
| **Posting** | Committed as opening journal voucher |
| **Inventory effect** | None |
| **Customer/Supplier effect** | Sets initial outstanding balance |
| **Cash/Bank effect** | Sets initial cash/bank balance where applicable |
| **Accounting effect** | Dr/Cr Party or Ledger, Cr/Dr Opening Balance Equity. Opening process must balance globally (see ACCOUNTING_RULES.md §26–27) |
| **Tax/GST effect** | None |
| **Audit event** | `OPENING_BALANCE_POSTED` |
| **Reversal behavior** | TBD — REQUIRES BUSINESS RULE DECISION |
| **Reporting impact** | Party ledger, outstanding/ageing, trial balance |
| **Lineage** | Voucher source_document_type=OPENING_BALANCE |
