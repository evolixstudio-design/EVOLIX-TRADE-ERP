# INVENTORY_RULES.md — EVOLIX Trade ERP

**Purpose:** Define stock behavior, movement rules, valuation and inventory invariants.

## Connected ERP — Stock Effects Summary

Every business event that affects inventory creates stock movement records. Stock is never changed by directly editing a total.

| Business Event | Movement Type | Qty Effect | Source Reference |
|---------------|---------------|------------|-----------------|
| Purchase Invoice | `PURCHASE_IN` | +quantity | source_document_type=PURCHASE_INVOICE |
| Purchase Return | `PURCHASE_RETURN_OUT` | −quantity | source_document_type=PURCHASE_RETURN |
| Sales Invoice | `SALE_OUT` | −quantity | source_document_type=SALES_INVOICE |
| Sales Return | `SALE_RETURN_IN` | +quantity | source_document_type=SALES_RETURN |
| Stock Transfer (source) | `TRANSFER_OUT` | −quantity | source_document_type=STOCK_TRANSFER |
| Stock Transfer (dest) | `TRANSFER_IN` | +quantity | source_document_type=STOCK_TRANSFER |
| Stock Adjustment | `ADJUSTMENT_IN` or `ADJUSTMENT_OUT` | ±quantity | source_document_type=STOCK_ADJUSTMENT |
| Opening Stock | `OPENING` | +quantity | source_document_type=OPENING_STOCK |
| Cancellation | Reverse of original type | Reverse of original | Links to original document |

**Godown Ownership:**
- Every godown belongs to a branch, which belongs to a company
- Stock movements are scoped: company_id + branch_id + godown_id + item_id
- A user can only affect stock in godowns their permissions allow access to

**Reversal Behavior:**
- Cancellation creates inverse stock movements (e.g., SALE_OUT → reversal +qty)
- Original movements are never deleted, only offset
- Reversal movement links to original via source_document reference

**Stock Valuation Dependencies:**
- Weighted average cost is the preferred initial valuation method (see §30–31)
- Cost rate is recorded on stock movements for valuation audit
- Purchase free quantities affect cost spread (see §6)

**Negative Stock Policy:**
- Configurable per company: BLOCK / WARN / ALLOW_WITH_PERMISSION / ALLOW
- Default recommendation: BLOCK
- Override requires permission + reason + audit event
- See §13 for full rules


---

# 1. Golden Principle

Stock is represented by **movements**, not by manually changing a total.

Source of truth:

```text
StockMovement
```

Projection:

```text
StockBalanceProjection
```

---

# 2. Inventory Invariant

For any item/location/batch:

```text
Closing Stock =
Opening
+ Inward
- Outward
± Adjustments
```

---

# 3. Stock Dimensions

Stock may be tracked by:

```text
company
branch
godown
rack/bin
item
batch
serial
unit
```

Not every item requires all dimensions.

---

# 4. Stock Movement Types

```text
OPENING
PURCHASE_IN
PURCHASE_RETURN_OUT
SALE_OUT
SALE_RETURN_IN
TRANSFER_OUT
TRANSFER_IN
ADJUSTMENT_IN
ADJUSTMENT_OUT
PRODUCTION_CONSUME
PRODUCTION_OUTPUT
BREAKAGE_OUT
EXPIRY_OUT
SAMPLE_OUT
REPLACEMENT_IN
REPLACEMENT_OUT
CONVERSION_IN
CONVERSION_OUT
```

---

# 5. Purchase

Purchase posts inward stock:

```text
+ quantity
```

For batch item, batch is mandatory.

For expiry item, expiry is mandatory.

---

# 6. Purchase Free Quantity

Example:

```text
Buy 10 + 2 free
```

Physical stock inward:

```text
12
```

Commercial quantity/rate and free quantity must be separately retained.

Costing may spread purchase cost across total physical quantity according to configured method.

---

# 7. Sales

Sales posts:

```text
- quantity
```

Free sale quantity also reduces physical stock.

---

# 8. Sales Return

Saleable return:

```text
+ quantity
```

Damaged return:

```text
+ quantity into damaged/blocked location
```

or separate stock condition.

Never automatically add damaged goods to saleable stock.

---

# 9. Purchase Return

```text
- quantity
```

Must validate available quantity/batch unless exceptional approval path exists.

---

# 10. Stock Transfer

Transfer consists of:

```text
Source Godown  - quantity
Destination    + quantity
```

For immediate same-site transfers, both may post atomically.

For inter-branch/in-transit:

```text
Source
  ↓ dispatch
IN_TRANSIT
  ↓ receive
Destination
```

---

# 11. Transfer Status

```text
DRAFT
APPROVED
DISPATCHED
PARTIALLY_RECEIVED
RECEIVED
CANCELLED
```

---

# 12. Transfer Discrepancy

If:

```text
sent 100
received 98
```

system records:

```text
2 discrepancy
```

Requires reason/action.

Do not silently alter dispatched quantity.

---

# 13. Negative Stock

Company configuration:

```text
BLOCK
WARN
ALLOW_WITH_PERMISSION
ALLOW
```

Recommended default:

```text
BLOCK
```

Negative-stock override requires:

- permission
- reason
- audit

---

# 14. Available Quantity

Suggested formula:

```text
available =
on_hand
- reserved
- blocked
```

In-transit quantity is not available unless policy explicitly allows.

---

# 15. Reservation

Orders may reserve stock.

Fields:

```text
reserved_quantity
reservation_reference
expiry
priority
```

Reservation is not physical stock movement.

---

# 16. Batch

Batch fields:

```text
item
batch_number
manufacture_date
expiry_date
MRP
purchase_rate
sale_rate
supplier
```

Batch number may repeat for different items.

---

# 17. Batch Selection

Configurable strategies:

```text
FEFO
FIFO
MANUAL
LOWEST_COST
HIGHEST_MARGIN
```

For expiry-sensitive items, recommended:

```text
FEFO
```

---

# 18. FEFO

First Expiry First Out.

Select:

```text
earliest valid expiry
```

Exclude:

- expired
- blocked
- zero stock

Override requires permission/reason.

---

# 19. FIFO

First In First Out based on inward sequence/date.

---

# 20. Expiry

Expiry status:

```text
VALID
NEAR_EXPIRY
EXPIRED
BLOCKED
```

Near expiry threshold configurable.

Example:

```text
90 days
60 days
30 days
```

---

# 21. Expired Stock

Expired stock:

- cannot normally sell;
- may be transferred to expiry/dump location;
- may be returned to supplier;
- may be written off;
- remains auditable.

---

# 22. Serial Number

For serialized item:

```text
one serial = one physical unit
```

Serial must be unique within required scope.

Outgoing transaction validates that serial is currently available.

---

# 23. Units

Primary/base unit required.

Example:

```text
1 BOX = 12 PCS
```

Stock source of truth should use base quantity.

Document retains entered UOM.

---

# 24. Fractional Quantity

Unit controls decimal precision.

Examples:

```text
PCS → 0 decimals
KG  → 3 decimals
LTR → 3 decimals
```

---

# 25. Godown

Every stock-affecting transaction has a godown.

If user does not choose:

```text
default godown
```

is applied explicitly.

---

# 26. Rack / Bin

Optional sub-location.

Useful for:

- warehouse picking
- pharma
- large catalogs

---

# 27. Stock Adjustment

Adjustment requires:

- item
- current qty
- adjustment qty
- resulting qty
- reason
- user
- timestamp

High-value adjustment may require approval.

---

# 28. Stock Count

Workflow:

```text
Create count
→ snapshot expected
→ physically count
→ enter counted
→ review variance
→ approve
→ post adjustment
```

Count must not overwrite stock directly.

---

# 29. Opening Stock

Opening stock is a stock movement type.

Must support:

- godown
- batch
- expiry
- quantity
- rate/value

Opening stock must reconcile with accounting opening rules.

---

# 30. Stock Valuation

Roadmap:

```text
Weighted Average
FIFO
Batch Cost
Standard Cost
```

Preferred initial:

```text
Weighted Average
```

unless business requirement mandates otherwise.

---

# 31. Weighted Average

New average after inward:

```text
(old_qty * old_rate + inward_qty * inward_rate)
------------------------------------------------
(old_qty + inward_qty)
```

Use Decimal.

Handle zero/negative conditions explicitly.

---

# 32. FIFO Cost

Maintain cost layers.

Sale consumes oldest eligible layer.

Do not reconstruct FIFO from mutable invoice lines.

---

# 33. Batch Cost

Batch carries cost basis.

Useful for pharma/FMCG.

---

# 34. Landed Cost

Purchase landed cost can include:

- freight
- insurance
- customs
- handling
- other charges

Allocation methods:

```text
quantity
value
weight
manual
```

---

# 35. MRP

MRP is commercial metadata.

It is not inventory cost.

Store MRP snapshot on transaction where required.

---

# 36. Reorder

Inputs:

```text
current stock
reserved
pending sales order
pending purchase order
minimum level
maximum level
reorder level
sales velocity
lead time
```

Suggested order:

```text
target stock
- projected available
```

---

# 37. Fast / Slow / Non-Moving

Classification based on configurable lookback.

Example:

```text
fast
normal
slow
non-moving
```

Do not hardcode fixed days globally.

---

# 38. Stock Ageing

Ageing derives from inward/cost layers/batch.

Useful for:

- dead stock
- expiry
- working capital

---

# 39. Damaged Stock

Damaged goods should move to:

```text
DAMAGED
```

condition/location.

Not saleable by default.

---

# 40. Blocked Stock

Blocked stock may exist physically but must not be available to sale.

Examples:

- quality hold
- compliance hold
- recall
- expiry pending decision

---

# 41. Samples / Free Issue

Free issue still reduces stock.

Movement type:

```text
SAMPLE_OUT
```

Accounting treatment may differ from normal sale.

---

# 42. Replacement

Replacement issue:

```text
- stock
```

Replacement receive:

```text
+ stock
```

Link to claim/return.

---

# 43. Conversion / Repacking

Example:

```text
1 CASE → 12 PCS
```

Conversion should create:

```text
CONVERSION_OUT
CONVERSION_IN
```

so audit remains visible.

---

# 44. Manufacturing

Raw materials:

```text
PRODUCTION_CONSUME
```

Finished item:

```text
PRODUCTION_OUTPUT
```

By-product also uses output movement.

---

# 45. Sale Posting Validation

Before sale post:

```text
item active
godown valid
batch valid
expiry valid
quantity valid
stock available
negative-stock policy
serial available
```

All validations happen before stock mutation.

---

# 46. Purchase Posting Validation

Before purchase post:

```text
supplier valid
item active
UOM valid
batch fields complete
expiry valid
tax valid
quantity > 0
```

---

# 47. Cancellation

Cancellation creates inverse stock movements.

Do not delete original movements.

Example:

```text
SALE_OUT -10

CANCEL_REVERSAL +10
```

Link reversal to original.

---

# 48. Editing Posted Stock Transaction

Not allowed directly.

Use:

```text
reverse/cancel
→ corrected transaction
```

---

# 49. Concurrent Sales

Two billing users may attempt to sell last units.

Database transaction must prevent overselling when policy blocks negative stock.

Do not rely on browser state.

---

# 50. Stock Projection

Projection exists for performance.

Source remains movement ledger.

Projection updates atomically with movement where appropriate.

A rebuild utility must be available.

---

# 51. Rebuild Stock

Admin tool:

```text
recalculate stock projection from movements
```

Must:

- run safely
- produce variance report
- not modify original movements

---

# 52. Stock Integrity Checks

Detect:

- projection mismatch
- negative stock
- batch without item
- expiry required but missing
- serial duplicate
- transfer imbalance
- stock movement without source
- cancellation without reversal

---

# 53. Inventory Reports

Required:

- stock summary
- stock ledger
- godown stock
- batch stock
- expiry
- near expiry
- stock valuation
- stock ageing
- negative stock
- reorder
- fast/slow/non-moving
- transfer
- stock adjustment
- stock count variance

---

# 54. Import Rules

Opening/import stock must:

- stage
- validate
- preview
- commit transactionally

Reject ambiguous item mapping.

---

# 55. Barcode and Stock

Barcode may resolve:

```text
item
unit
pack size
batch optional
```

Barcode itself does not change stock.

---

# 56. Audit

Audit:

- stock adjustment
- negative stock override
- batch override
- expiry override
- transfer discrepancy
- stock count approval
- serial correction

---

# 57. Permissions

Separate:

```text
inventory.stock.read
inventory.stock.cost_view
inventory.transfer.create
inventory.transfer.receive
inventory.adjustment.create
inventory.adjustment.approve
inventory.count.create
inventory.count.approve
inventory.negative_stock.override
inventory.expiry.override
```

---

# 58. Offline Behavior

All local inventory operations work without internet.

Cloud sync queues later.

---

# 59. Branch Sync Rule

Never synchronize:

```text
current_stock = 50
```

as authoritative state.

Synchronize stock movements/events.

This prevents branch conflicts.

---

# 60. Inventory Tests

Required:

- purchase inward
- sale outward
- sales return
- purchase return
- transfer
- partial transfer
- stock adjustment
- batch
- expiry
- FEFO
- negative stock
- UOM conversion
- free quantity
- cancellation
- concurrency
- projection rebuild

---

# 61. Inventory Acceptance Criteria

Inventory is production-ready only when:

- stock movements reconcile;
- projections match;
- concurrent billing is safe;
- batch/expiry rules work;
- negative stock policy works;
- transfer in/out balances;
- cancellation reverses correctly;
- valuation is reproducible;
- company/godown isolation works;
- offline operation works.
