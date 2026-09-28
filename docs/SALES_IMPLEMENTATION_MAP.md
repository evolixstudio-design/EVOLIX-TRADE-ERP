# SALES IMPLEMENTATION MAP (MODULE 05)

## 1. Document Lifecycle

| Document | Table | States | Purpose |
| :--- | :--- | :--- | :--- |
| **Sales Quotation** | `SalesQuotation` | DRAFT → SUBMITTED → ACCEPTED/REJECTED/EXPIRED | Initial proposal to customer. No inventory/accounting impact. |
| **Sales Order** | `SalesOrder` | DRAFT → CONFIRMED → PARTIALLY_DELIVERED → FULLY_DELIVERED / CANCELLED | Customer commits to buy. Tracks expected dispatch. |
| **Delivery Challan**| `DeliveryChallan`| DRAFT → DISPATCHED → CANCELLED | Physical dispatch of goods. Triggers `SALES_OUT` inventory. |
| **Sales Invoice** | `SalesInvoice` | DRAFT → POSTED → CANCELLED/REVERSED | Authoritative financial bill. Triggers Accounting, Bill Allocation, and optionally Inventory (if no Challan). |
| **Sales Return** | `SalesReturn` | DRAFT → POSTED → CANCELLED | Customer returns goods. Triggers `SALES_RETURN_IN` and Reversal Accounting. |

## 2. Workflows

### Wholesale Workflow
1. **Sales Order (CONFIRMED)**: Customer places order.
2. **Delivery Challan (DISPATCHED)**: Partial or full delivery of Order.
   - *Inventory Effect:* `SALES_OUT` via InventoryPostingService.
3. **Sales Invoice (POSTED)**: Billing against Delivery Challan or Order.
   - *Accounting Effect:* Debit Customer (Asset), Credit Sales Revenue, Credit Output GST.
   - *Receivable Effect:* Bill Allocation (NEW_REFERENCE).

### Retail Workflow (Fast Path)
1. **Sales Invoice (POSTED)**: Direct bill creation.
   - *Inventory Effect:* `SALES_OUT` directly against the invoice lines.
   - *Accounting Effect:* Debit Customer/Cash (Asset), Credit Sales Revenue, Credit Output GST.
   - *Receivable Effect:* Bill Allocation (NEW_REFERENCE).

## 3. Centralized Integration Points

- **Inventory Posting (`InventoryPostingService`)**:
  - `postMovement(tx, { movement_type: 'SALES_OUT', ... })`
  - `postMovement(tx, { movement_type: 'SALES_RETURN_IN', ... })`
  - Reversals handle opposite effects natively inside InventoryPostingService.

- **Accounting Posting (`AccountingPostingService`)**:
  - `postVoucher(tx, { voucher_type: 'SALES', lines: [...] })`
  - Validates `Debit == Credit`, writes `Voucher` + `VoucherLine`.
  - Reversals handle opposite effects using `reverseVoucher`.

- **Receivables (`BillAllocation`)**:
  - Handled atomically alongside Accounting Posting in `postSalesInvoice`.
  - Links `VoucherLine` to the original `SalesInvoice`.

## 4. RBAC Permissions Required
All checks are performed server-side on the controllers.
- `sales.read`
- `sales.create`
- `sales.update`
- `sales.post`
- `sales.cancel`
- `sales.reverse`
- `sales.return`

## 5. Idempotency & Isolation
- **Idempotency**: Handled at the Accounting (Voucher Source Document uniqueness) and Inventory (Stock Movement Source uniqueness) layers, plus Sales service checks (Invoice status cannot be POSTED twice).
- **Isolation**: Every read/write enforces `company_id` and `branch_id` extracted from the authenticated JWT token context. Item, Godown, and Party ownership are verified strictly before posting.

## 6. Audit & Lineage
- **Audit**: Every action in `SalesPostingService` generates an `AuditLog` tied to the user.
- **Lineage**:
  - Sales Order lines connect to Delivery Challan lines (`sales_order_line_id`).
  - Delivery Challan lines connect to Sales Invoice lines (`delivery_challan_line_id`).
  - All downstream effects (`Voucher`, `StockMovement`) store `source_document_id`.

## 7. Dashboard & Intelligence
- Dashboard pulls deterministic aggregates (e.g. `Today's Sales`, `Invoice Count`) directly querying `SalesInvoice` and `BillAllocation`.
- Intelligence exposes `SALES_TODAY`, `CUSTOMER_OUTSTANDING` natively backed by database truth.
