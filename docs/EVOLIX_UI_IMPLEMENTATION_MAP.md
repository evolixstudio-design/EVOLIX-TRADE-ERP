# EVOLIX UI IMPLEMENTATION MAP

**Created:** 2026-09-27
**Based on:** `VYAPAR_UI_REFERENCE_ANALYSIS.md` + Current EVOLIX frontend audit
**Purpose:** Map every current screen to a target state and track implementation

---

## 1. CURRENT EVOLIX SCREEN AUDIT

### 1.1 — Existing Screens

| Screen | Route | File | Current State | Reference Pattern | EVOLIX Change | Backend Dependency | Status |
|---|---|---|---|---|---|---|---|
| Login | `/login` | `pages/Login.tsx` | Working | N/A (no reference) | KEEP | Auth API | KEEP |
| Dashboard | `/dashboard` | `pages/Dashboard.tsx` | Hardcoded fake KPIs (1,248 / 42 / 856 / $24K) | Business Dashboard with real KPIs, sales graph, low stock | REBUILD — Replace fake numbers with real API data or honest empty state | Dashboard API (new) | REBUILD |
| Users | `/users` | `pages/Users.tsx` | Working CRUD table | N/A | REFINE — Move to Settings group | Identity API | REFINE |
| Roles | `/roles` | `pages/Roles.tsx` | Working CRUD table | N/A | REFINE — Move to Settings group | Identity API | REFINE |
| Sessions | `/sessions` | `pages/Sessions.tsx` | Working list | N/A | REFINE — Move to Settings group | Identity API | REFINE |
| Organizations | `/organizations` | `pages/Organizations.tsx` | Working CRUD | Settings: My Firm | REFINE — Move to Settings group | Org API | REFINE |
| Companies | `/companies` | `pages/Companies.tsx` | Working CRUD | Settings: My Firm | REFINE — Move to Settings group | Company API | REFINE |
| Branches | `/branches` | `pages/Branches.tsx` | Working CRUD | N/A | REFINE — Move to Settings group | Branch API | REFINE |
| Godowns | `/godowns` | `pages/Godowns.tsx` | Working CRUD | N/A | REFINE — Move to Masters group | Godown API | REFINE |
| Financial Years | `/financial-years` | `pages/FinancialYears.tsx` | Working CRUD | N/A | REFINE — Move to Settings group | FY API | REFINE |
| Intelligence | `/intelligence` | `pages/Intelligence.tsx` | Working AI panel | N/A | KEEP | Intelligence API | KEEP |
| Purchase Dashboard | `/purchasing` | `pages/Purchasing/PurchaseDashboard.tsx` | Fallback dummy data when API fails | Business Dashboard KPI pattern | REFINE — Remove dummy fallback, show honest empty state | Purchase Dashboard API | REFINE |
| Purchase Orders | `/purchasing/orders` | `pages/Purchasing/PurchaseOrders.tsx` | Working table with filters | Sales Report table pattern | REFINE — Add filter bar, summary KPIs above table | PO API | REFINE |
| PO Create | `/purchasing/orders/new` | `pages/Purchasing/PurchaseOrderCreate.tsx` | Working form with line items | Invoice field layout pattern | REFINE — Match invoice field density | PO Create API | REFINE |
| PO Detail | `/purchasing/orders/:id` | `pages/Purchasing/PurchaseOrderDetail.tsx` | Working detail with lifecycle actions | Transaction detail pattern | REFINE — Add effects/lineage sections | PO Detail API | REFINE |
| Chart of Accounts | `/accounting/accounts` | `pages/Accounting/ChartOfAccounts.tsx` | Working tree view | Accounting: Ledger, journal, P&L | REFINE — Add account type grouping | Accounting API | REFINE |
| Ledger | `/accounting/ledger/:id` | `pages/Accounting/Ledger.tsx` | Working ledger entries | Accounting: Ledger detail | REFINE — Add date range filter, running balance | Accounting API | REFINE |

### 1.2 — Screens NOT YET IMPLEMENTED (Required by Reference + Architecture)

| Screen | Route (Proposed) | Reference Pattern | Backend Dependency | Priority | Status |
|---|---|---|---|---|---|
| Party List | `/masters/parties` | Parties screen | Party API (not yet built) | Module 04 Masters | NOT YET IMPLEMENTED |
| Item List | `/masters/items` | Items & Inventory | Item API (exists in schema) | Module 04 Masters | NOT YET IMPLEMENTED |
| Stock Summary | `/inventory/stock` | Inventory stock summary | Inventory API (exists) | Module 06 | NOT YET IMPLEMENTED |
| Stock Movements | `/inventory/movements` | Item transaction table | Inventory API (exists) | Module 06 | NOT YET IMPLEMENTED |
| Stock Transfers | `/inventory/transfers` | N/A | Inventory API (exists) | Module 06 | NOT YET IMPLEMENTED |
| Stock Adjustments | `/inventory/adjustments` | N/A | Inventory API (exists) | Module 06 | NOT YET IMPLEMENTED |
| GRN List | `/purchasing/grn` | N/A | GRN API (exists) | Module 07 | NOT YET IMPLEMENTED |
| Purchase Invoice List | `/purchasing/invoices` | N/A | PI API (exists) | Module 07 | NOT YET IMPLEMENTED |
| Voucher List | `/accounting/vouchers` | N/A | Voucher API (exists) | Module 05 | NOT YET IMPLEMENTED |
| Sales Invoice | `/sales/invoices` | Sale Invoices Report | Sales API (not yet built) | Module 08 | NOT YET IMPLEMENTED |
| Settings Hub | `/settings` | Settings screen | Various APIs | Foundation | NOT YET IMPLEMENTED |

---

## 2. APPLICATION SHELL CHANGES

### 2.1 — Sidebar Navigation

**Current:** Flat list of 13 technical items (Dashboard, Intelligence, Organizations, Companies, Branches, Godowns, Financial Years, Purchasing, Accounting Core, Users, Roles, Sessions)

**Target:** Business-domain grouped navigation with collapsible sections

```
CURRENT                          TARGET
─────────────────               ──────────────────
Dashboard                       Dashboard
Intelligence                    ─── Masters ───
Organizations                     Godowns
Companies                       ─── Purchase ───
Branches                          Dashboard
Godowns                           Purchase Orders
Financial Years                   Goods Receipts
Purchasing                      ─── Inventory ───
Accounting Core                   Stock Summary
Users                             Movements
Roles & Permissions             ─── Accounting ───
Sessions                          Chart of Accounts
                                  Ledger
                                ─── Intelligence ───
                                ─── Settings ───
                                  Organizations
                                  Companies
                                  Branches
                                  Financial Years
                                  Users & Roles
                                  Sessions
```

### 2.2 — Top Bar

**Current:** User name + Logout button only (right-aligned)

**Target:** Add:
- Page title (left)
- Global search bar (center)
- Quick action buttons (right, before user)

### 2.3 — Component: Shell.tsx

**Change type:** REBUILD
**Reason:** Navigation hierarchy restructuring requires collapsible groups, new topbar layout

---

## 3. UI COMPONENT INVENTORY

### 3.1 — Existing Components

| Component | File | Current State | Change |
|---|---|---|---|
| Shell | `components/Shell.tsx` | Working app shell | REBUILD — New navigation structure |
| Modal | `components/Modal.tsx` | Basic modal | REFINE — Ensure consistent with design system |
| ErrorBoundary | `components/ErrorBoundary.tsx` | Working | KEEP |

### 3.2 — Components to Create

| Component | Purpose | Reference Pattern |
|---|---|---|
| SidebarGroup | Collapsible navigation group | Sidebar with chevron expand/collapse |
| SearchBar | Global transaction/entity search | Top bar search pill |
| QuickActions | Prominent creation buttons | "+ Add Sale", "+ Add Purchase" |
| KPICard | Compact KPI with accent bar | Dashboard Business Status cards |
| FilterBar | Horizontal filter pills | Sales Report filter row |
| DataTable | Dense ERP table with actions | Sales Report transaction table |
| StatusBadge | Transaction status indicator | "Unpaid", "POSTED", "DRAFT" |
| EmptyState | No data placeholder | Reference implied |
| PageHeader | Title + breadcrumb + actions | Report page headers |
| TotalsPanel | Invoice/transaction totals | Invoice Subtotal/Tax/Grand Total |
| SettingsSidebar | Category navigation for settings | Settings left panel |
| AuditTimeline | Activity/audit trail display | EVOLIX-specific (lineage) |
| LineageGraph | Business event chain visualization | EVOLIX-specific differentiator |

### 3.3 — Component Reuse Rule

> Do NOT create multiple versions of the same ERP component.
> Every table must use DataTable.
> Every status must use StatusBadge.
> Every KPI must use KPICard.
> Every filter must use FilterBar.

---

## 4. CSS / DESIGN SYSTEM CHANGES

### 4.1 — Keep (EVOLIX Identity)

- Dark theme as primary
- `--primary: #6366f1` (Indigo)
- `--success: #10b981` (Emerald)
- `--danger: #ef4444`
- `--warning: #f59e0b`
- Inter font family
- Glass morphism on sidebar

### 4.2 — Adopt from Reference

- KPI card left accent bar pattern
- Tighter KPI card sizing (reduce from 2.5rem value to 1.75rem)
- Compact table row height (~48px instead of current ~56px)
- Summary-above-table layout pattern
- Filter bar horizontal pill pattern
- Settings sidebar + detail panel pattern
- Invoice document-style preview layout

### 4.3 — Reduce from Current

- Excessive card hover animations (translateY + scale on KPI cards)
- Oversized gradient text on KPI values
- Large page padding (2.5rem to 1.5rem-2rem)
- Large card border radius (20px to 12px)

---

## 5. BACKEND DEPENDENCIES

### 5.1 — APIs Required for Dashboard (REBUILD)

| Endpoint | Purpose | Module | Status |
|---|---|---|---|
| `GET /api/v1/dashboard/kpis` | Aggregate KPI data | New | NOT BUILT |
| `GET /api/v1/inventory/stock` | Stock summary | Module 06 | EXISTS |
| `GET /api/v1/inventory/low-stock` | Low stock items | Module 06 | NOT BUILT |
| `GET /api/v1/purchase/dashboard` | Purchase KPIs | Module 07 | EXISTS |

### 5.2 — APIs Required for New Screens

| Endpoint | Purpose | Module | Status |
|---|---|---|---|
| `GET /api/v1/inventory/movements` | Stock movement ledger | Module 06 | EXISTS |
| `POST /api/v1/inventory/adjustments` | Stock adjustment | Module 06 | EXISTS |
| `POST /api/v1/inventory/transfers` | Stock transfer | Module 06 | EXISTS |
| `GET /api/v1/purchase/grn` | GRN listing | Module 07 | EXISTS |
| `GET /api/v1/accounting/vouchers` | Voucher listing | Module 05 | EXISTS |

---

## 6. PRIORITY ORDER

Based on impact and dependency chain:

| Priority | Task | Scope | Estimated Complexity |
|---|---|---|---|
| P0 | Rebuild Shell (sidebar + topbar) | Shell.tsx, index.css | DONE (Awaiting Manual Verification) |
| P0.1 | Dashboard Cleanup | Dashboard.tsx, PurchaseDashboard.tsx | DONE (Fake data replaced with empty states) |
| P1 | Rebuild Dashboard with real data | Dashboard.tsx, new API | HIGH — Remove fake data |
| P2 | Create reusable components | KPICard, DataTable, FilterBar, StatusBadge, PageHeader | MEDIUM — Used everywhere |
| P3 | Refine Purchase pages | PurchaseDashboard, PurchaseOrders | MEDIUM — Existing pages |
| P4 | Create Inventory UI | Stock, Movements, Transfers, Adjustments | MEDIUM — New pages, existing APIs |
| P5 | Refine Accounting pages | ChartOfAccounts, Ledger | LOW — Existing pages |
| P6 | Create Settings hub | Settings route, migrate admin pages | MEDIUM — Reorganization |
| P7 | Create Masters UI | Parties, Items (when backend ready) | FUTURE — Depends on Module 04 Masters |

---

## 7. SOURCE OF TRUTH MAPPING

| UI Value | Source of Truth | API | Notes |
|---|---|---|---|
| Stock Quantity | StockBalanceProjection | `/api/v1/inventory/stock` | Derived from StockMovement |
| Stock Value | StockBalanceProjection x cost_rate | `/api/v1/inventory/stock` | Aggregate calculation |
| PO Count | PurchaseOrder table | `/api/v1/purchase/dashboard` | Filtered by status |
| PO Total | PurchaseOrder.total | `/api/v1/purchase/dashboard` | Sum of confirmed POs |
| Ledger Balance | VoucherLine aggregation | `/api/v1/accounting/ledger/:id` | Accounting truth |
| Outstanding | Payable/Receivable ledger | `/api/v1/accounting/ledger/:id` | Accounting truth |
| Dashboard KPIs | Multiple APIs | `/api/v1/dashboard/kpis` (new) | Aggregated from authoritative sources |

> **CRITICAL:** Current Dashboard.tsx contains hardcoded values: 1,248 / 42 / 856 / $24K.
> These are NOT sourced from any API. They are fake numbers.
> They MUST be replaced with real API data or removed entirely.

---

## 8. BUSINESS RULE GAPS

The following behaviors are referenced in the UI patterns but have no confirmed EVOLIX business rule:

| Gap | Reference Behavior | EVOLIX Status |
|---|---|---|
| Opening Stock Accounting | Opening stock creates Dr Inventory, Cr Opening Equity | DOCUMENTATION GAP — documented in MODULE_ROADMAP but not implemented |
| Stock Valuation Method | FIFO/Weighted Average for stock value KPI | DOCUMENTATION GAP — no business rule defined |
| Credit Limit Enforcement | Block sale when credit limit exceeded | FUTURE — Module 14 |
| Payment Terms Default | Default 30 days from settings | FUTURE — Settings not implemented |
| Invoice Numbering | Auto-increment from settings | FUTURE — Settings not implemented |

These are documented as BUSINESS RULE GAP and will not be invented by the UI implementation.

---

## 9. FILES TO BE MODIFIED

### 9.1 — Shell & Navigation
- `frontend/src/components/Shell.tsx` — REBUILD
- `frontend/src/index.css` — REFINE (density, KPI cards, tables)
- `frontend/src/App.tsx` — REFINE (new routes for inventory, settings hub)

### 9.2 — Dashboard
- `frontend/src/pages/Dashboard.tsx` — REBUILD

### 9.3 — Purchasing (Refine)
- `frontend/src/pages/Purchasing/PurchaseDashboard.tsx` — REFINE (remove dummy data)
- `frontend/src/pages/Purchasing/PurchaseOrders.tsx` — REFINE (add filter bar, summary KPIs)

### 9.4 — New Components
- `frontend/src/components/SidebarGroup.tsx` — CREATE
- `frontend/src/components/KPICard.tsx` — CREATE
- `frontend/src/components/DataTable.tsx` — CREATE
- `frontend/src/components/FilterBar.tsx` — CREATE
- `frontend/src/components/StatusBadge.tsx` — CREATE
- `frontend/src/components/PageHeader.tsx` — CREATE
- `frontend/src/components/SearchBar.tsx` — CREATE
- `frontend/src/components/EmptyState.tsx` — CREATE

### 9.5 — New Pages
- `frontend/src/pages/Inventory/StockSummary.tsx` — CREATE
- `frontend/src/pages/Inventory/StockMovements.tsx` — CREATE
- `frontend/src/pages/Settings/SettingsHub.tsx` — CREATE

### 9.6 — Files NOT Modified
- `frontend/src/pages/Login.tsx` — Working, no reference pattern conflict
- `frontend/src/pages/Login.css` — Working
- `frontend/src/components/ErrorBoundary.tsx` — Working
- `frontend/src/store/authStore.ts` — Working
- `frontend/src/api.ts` — Working
- `frontend/src/i18n/*` — Working (Arabic/RTL support preserved)
- All backend files — NO frontend-only changes to backend

---

## 10. REGRESSION RISKS

| Risk | Mitigation |
|---|---|
| Sidebar restructure breaks navigation | Preserve all existing routes, only change visual grouping |
| Dashboard rebuild removes working display | Keep welcome message, replace only fake KPIs |
| CSS density changes break existing pages | Test all existing pages after CSS changes |
| New routes break existing routes | Additive only — no existing routes removed |
| Component extraction breaks inline code | Gradual migration — old code works alongside new components |

---

## 11. TESTING CHECKLIST

After implementation:

- [ ] All existing routes still load
- [ ] Login/logout still works
- [ ] RBAC-controlled nav items still respect permissions
- [ ] Purchase Order CRUD still works
- [ ] PO lifecycle (Create → Confirm → GRN → Invoice) still works
- [ ] Chart of Accounts still loads
- [ ] Ledger still loads
- [ ] Intelligence still works
- [ ] Arabic/RTL mode still works
- [ ] Mobile responsive layout not broken
- [ ] No console errors
- [ ] No hardcoded fake numbers remain on dashboard
- [ ] No dummy/fallback data displayed as real data
