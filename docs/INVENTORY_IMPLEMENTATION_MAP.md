# INVENTORY IMPLEMENTATION MAP

## 1. PRE-IMPLEMENTATION AUDIT (CURRENT STATE)

### Database Structures
- **StockMovement**: EXISTS. Tracks physical ins/outs.
- **StockBalanceProjection**: EXISTS. Caches the stock level.
- **Godown**: EXISTS. Represents warehouses/locations.
- **Item**: EXISTS. Master catalog.

### Existing Services & Integrations
- **Purchasing Integration (GRN)**: CONFLICT. Currently, `Purchase/PostingService` manually creates `StockMovement` and mutates `StockBalanceProjection` internally. It does not use a centralized inventory engine.
- **Sales Integration (Delivery)**: MISSING. No sales outbound movement logic yet.
- **Accounting Integration**: PARTIAL. Purchasing posts to Accounting properly, but if an inventory operation (like Stock Adjustment) requires an accounting effect, that link is missing.
- **Centralized Inventory Service**: MISSING. There is no `InventoryPostingService`.

### Missing Capabilities
- Stock Transfers (Warehouse to Warehouse).
- Stock Adjustments (Wastage / Found).
- Opening Stock workflow.
- Inventory Low Stock evaluation against Item Reorder level.

---

## 2. REQUIRED REFACTORING & BACKEND CHANGES

### The `InventoryPostingService` (Central Engine)
We will create `src/inventory/posting.service.ts` mimicking the architectural purity of Module 03 (Accounting).
- **`postMovement(dto)`**: Will accept a strictly typed DTO to process inventory IN/OUT.
  - Generates `StockMovement`.
  - Calculates and safely updates `StockBalanceProjection`.
  - Enforces Organization/Branch isolation.
  - Prevents double-reversals or idempotency failures.
  - Will use a unique index for idempotency: `uix_stock_movement_source`.
- **Purchasing Refactor**: We will modify `src/purchase/posting.service.ts` to REMOVE the direct `tx.stockMovement.create` code, and instead inject and call `InventoryPostingService.postMovement(tx, ...)`.

### Movement Types
We will standardize Enum `MovementType`:
- `PURCHASE_IN` (Exists)
- `PURCHASE_RETURN` (Exists)
- `SALES_OUT` (Planned)
- `SALES_RETURN` (Planned)
- `TRANSFER_OUT`
- `TRANSFER_IN`
- `ADJUSTMENT_IN`
- `ADJUSTMENT_OUT`
- `OPENING_IN`

### Endpoints / Controllers
Create `src/inventory/inventory.controller.ts`:
- `POST /inventory/transfers`
- `POST /inventory/adjustments`
- `GET /inventory/movements` (Ledger)
- `GET /inventory/stock` (Stock Summary Dashboard)

All protected by `@RequirePermissions('inventory.read', 'inventory.write')` and `AuthGuard`.

---

## 3. DOCUMENTATION GAPS & DECISIONS

### Opening Stock
- **DOCUMENTATION GAP**: How does Opening Stock behave regarding Accounting? Does it debit Inventory Asset and credit a Suspense/Opening Balance account?
- **Decision**: We will build the `OPENING_IN` movement. We will leave the Accounting effect of opening stock blank unless explicitly commanded, marking it as a Document Gap to prevent inventing accounting truth.

### Negative Stock
- **DOCUMENTATION GAP**: Should negative stock be strictly blocked or allowed (e.g. if GRN is entered late but POS is running)?
- **Decision**: We will implement a strict `BLOCK` on negative stock at the `InventoryPostingService` level. A configurable rule engine is beyond current scope; ERP purity demands you cannot sell what you do not have.

### Valuation
- **DOCUMENTATION GAP**: FIFO or Weighted Average?
- **Decision**: We will record `cost_rate` on movements where available (like GRN), but we will NOT calculate a running valuation balance. Stock quantity will be authoritative; valuation remains a deferred reportable metric.

---

## 4. SCHEMA CHANGES
- Need to ensure `uix_stock_movement_source` unique index on `StockMovement` (company_id, source_document_type, source_document_id, source_line_id) exists to prevent concurrent idempotency failures.

---

## 5. REQUIRED TESTS (Inventory Spec)
Will create `src/inventory/inventory.spec.ts` matching the strict 39 test scenarios outlined in the Module 04 Master Prompt. 

## 6. REQUIRED FRONTEND CHANGES
- Currently skipped unless specifically requested, but the APIs will support the "Fast By Default, Deep on Demand" UX specs.
