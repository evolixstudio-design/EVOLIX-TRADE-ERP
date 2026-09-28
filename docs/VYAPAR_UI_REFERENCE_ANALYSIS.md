# VYAPAR UI REFERENCE ANALYSIS

**Created:** 2026-09-27
**Source:** `docs/Vyapar_UI_Reference_Pack.zip` (6 screenshots + 2 spec documents)
**Purpose:** Forensic extraction of UX patterns for EVOLIX Trade ERP redesign

---

## A. SCREEN INVENTORY

### A.1 — Reference Screens Discovered

| # | Reference Screen | File | Purpose | Main Sections | Key Fields | Actions | Tables | Filters |
|---|---|---|---|---|---|---|---|---|
| 1 | Business Dashboard | `01_dashboard_reference.png` | Operational overview | Business Status KPIs, Sales Graph, Low Stock | Cash in Hand, Stock Value, Bank Account, Orders, Open Cheques, Expenses | + Add Sale, + Add Purchase, Search transactions | None (KPI cards + chart) | Daily/Weekly/Monthly on chart |
| 2 | Modules & Navigation | `02_modules_navigation_reference.png` | Module discovery hub | Main Modules grid (10 cards) | Module name + sub-feature summary | Click to navigate | None (card grid) | None |
| 3 | Sale Invoices Report | `03_sales_report_reference.png` | Transaction report list | Breadcrumb, Filter bar, Summary KPIs, Transaction table | Date, Invoice No, Party Name, Transaction type, Payment Type, Amount, Balance | Row actions (⋮ menu) | 7-column transaction table | This Month, Date Range, Firm, User, Godown |
| 4 | Items & Inventory | `04_inventory_reference.png` | Item stock detail | Summary KPIs, Item transaction table | Stock Quantity, Stock Value, Sale Price, Purchase Price, Item Name, Date, Quantity, Price/Unit, Status | Row actions (⋮ menu) | 6-column item transaction table | None visible (implied search) |
| 5 | Settings | `05_settings_reference.png` | Application configuration | Settings sidebar + Detail panel | Company Name, Phone, Email, Address, Currency (KWD), Tax/GST/VAT, Invoice Template, Default Payment Terms | Edit fields inline | None | Settings category sidebar |
| 6 | Tax Invoice | `06_invoice_fields_reference.png` | Invoice print/preview | Header (Bill To, Ship To, Business), Line items grid, Totals | Invoice No, Date, Customer, Address, Phone, Delivery Address, Contact, Reference/DO, #, Item/Description, Qty, Unit, Rate, Discount, Tax, Amount, Subtotal, Tax Total, Grand Total | Print/Download (implied) | 7-column line items | None |

### A.2 — Screens Referenced in Documentation but NOT in Screenshots

From `MODULE_AND_FIELD_SPEC.md` and `README.md`:

| Screen | Category | Status |
|---|---|---|
| Party List | Masters | Referenced, no screenshot |
| Party Detail / Ledger | Masters | Referenced, no screenshot |
| Item Master Create/Edit | Masters | Referenced, no screenshot |
| Purchase Invoice | Transactions | Referenced, no screenshot |
| Expense Entry | Transactions | Referenced, no screenshot |
| Cash & Bank | Finance | Referenced, no screenshot |
| Chart of Accounts / Ledger | Accounting | Referenced, no screenshot |
| Trial Balance | Accounting | Referenced, no screenshot |
| P&L / Balance Sheet | Accounting | Referenced, no screenshot |
| GST Reports | Tax | Referenced, no screenshot |
| Party Statement | Reports | Referenced, no screenshot |
| Stock Summary | Reports | Referenced, no screenshot |
| Backup & Restore | System | Referenced, no screenshot |
| User/Security Management | System | Referenced, no screenshot |

---

## B. UX PATTERN INVENTORY

### B.1 — Sidebar Behavior

| Property | Pattern |
|---|---|
| Position | Fixed left, full height |
| Width | ~250px |
| Background | Dark navy (#1e293b range) |
| Brand area | Top — brand name + subtitle |
| Navigation items | Single-level with chevron indicators for expandable groups |
| Active state | Left border accent (blue/indigo), slightly lighter background |
| Hover state | Subtle background lightening |
| Grouping | Flat list — Home, Parties, Items, Sale, Purchase & Expense, Grow Your Business, Cash & Bank, Accounting, Reports, Sync/Share/Backup, Other Products, Utilities, Settings |
| Scroll | Internal scroll when items exceed viewport |
| Collapse | Not shown in reference (desktop only) |
| Icons | Not visible in reference mockups (text-only nav) |

### B.2 — Top Navigation / Header Bar

| Property | Pattern |
|---|---|
| Position | Fixed top, right of sidebar |
| Height | ~56-64px |
| Background | White/light |
| Left content | Page title (bold, ~20px) |
| Center content | Search bar ("Search transactions") — rounded pill shape |
| Right content | Two prominent action buttons: "+ Add Sale" (outlined red/coral), "+ Add Purchase" (outlined blue) |
| Search | Global transaction search — always visible |

### B.3 — Page Headers

| Property | Pattern |
|---|---|
| Title | Bold, large (~24px), left-aligned |
| Breadcrumb | Below title on report pages (e.g., "Transaction Report / Sale") |
| Subtitle | Not present |
| Actions | Positioned in top bar, not in page header |

### B.4 — KPI / Summary Cards

| Property | Pattern |
|---|---|
| Layout | 3-column grid row (dashboard: 2 rows of 3) |
| Card style | White background, subtle border, left color accent bar (green, orange, blue, etc.) |
| Content | Label (muted, small) + Value (bold, large, colored to match accent) |
| Sizing | Moderate — not oversized SaaS cards |
| Hover | Not specified |
| Click behavior | Expected: drill-down to source data |
| Report summary cards | Same pattern but 2-column (Total Sales Amount, Total Loyalty Points) |

### B.5 — Table Behavior

| Property | Pattern |
|---|---|
| Style | Clean, minimal borders — header row with light gray background, body rows with subtle horizontal dividers |
| Row height | Comfortable but compact (~48px) |
| Header | Gray text, uppercase or sentence-case, no background fill |
| Alternating rows | None visible |
| Row hover | Subtle highlight (implied) |
| Actions column | Rightmost — three-dot (⋮) overflow menu |
| Pagination | Not visible in screenshots (implied for larger datasets) |
| Sorting | Not visible (implied on column headers) |
| Selection | Not visible |
| Empty state | Not shown |

### B.6 — Filter Bar

| Property | Pattern |
|---|---|
| Position | Below page header, above summary cards |
| Layout | Horizontal row of filter pills/chips |
| Filters shown | Date range preset ("This Month"), Date range value ("01/03/2026 → 31/03/2026"), Firm ("All Firms"), User ("All Users"), Godown ("All Godown") |
| Style | Rounded pill buttons, light background |
| Interaction | Click to open dropdown/picker (implied) |
| Clear | Not visible |

### B.7 — Forms & Settings

| Property | Pattern |
|---|---|
| Layout | Two-column form (label above field) |
| Field style | Rounded border, white background, generous padding |
| Label style | Above field, small, muted color |
| Spacing | Generous vertical spacing between fields |
| Settings sidebar | Left panel with category list, right panel with active category form |
| Categories | My Firm, Transactions, Payment Reminders & Alerts, Taxes & GST, Print & Share, Backup & Restore, Data & Security, Language & Region |
| Active category | Highlighted background |

### B.8 — Invoice / Print Preview

| Property | Pattern |
|---|---|
| Layout | Document-style card centered on page |
| Header | "TAX INVOICE" left, Invoice No + Date right |
| Sections | Bill To / Ship To / Business (3-column header), Line items table, Totals footer |
| Line items | #, Item/Description, Qty, Unit, Rate, Discount, Tax, Amount |
| Totals | Right-aligned: Subtotal, Tax, Grand Total (bold, large) |
| Currency | Symbol in reference (EVOLIX uses organization-configured currency) |

### B.9 — Quick Actions

| Property | Pattern |
|---|---|
| Location | Top bar (+ Add Sale, + Add Purchase) |
| Dashboard spec | Add Sale, Add Purchase, Payment In, Payment Out, Expense, Add Party, Add Item, Sale Order, Purchase Order, Estimate/Quotation |
| Style | Outlined buttons with color-coded borders |
| Behavior | Navigate to creation form (implied) |

### B.10 — Status Badges

| Property | Pattern |
|---|---|
| Visible | "Unpaid" status on inventory transactions |
| Style | Text-only (no pill/badge wrapper visible) |
| States | Unpaid, Paid (implied), Partially Paid (implied), "—" for non-applicable |

### B.11 — Charts

| Property | Pattern |
|---|---|
| Type | Line chart (Sales Graph) |
| Position | Dashboard lower-left, large area |
| Controls | Daily / Weekly / Monthly toggle (top-right of chart) |
| Style | Blue line with dots, light background |
| Size | ~60% of content width |

### B.12 — Low Stock Panel

| Property | Pattern |
|---|---|
| Position | Dashboard lower-right, beside sales chart |
| Layout | Simple list — Item Name + Quantity (red text) |
| Click | Expected: navigate to item detail |

---

## C. VISUAL PATTERN INVENTORY

### C.1 — Spacing

| Element | Value |
|---|---|
| Page padding | ~24-32px |
| Card padding | ~20-24px |
| Card gap | ~16-20px |
| Field spacing | ~20-24px vertical |
| Table cell padding | ~12-16px horizontal, ~14px vertical |
| Sidebar item padding | ~12-16px vertical, ~20-24px horizontal |

### C.2 — Typography Hierarchy

| Level | Size | Weight | Usage |
|---|---|---|---|
| Page title | ~24px | Bold (700) | Page headers |
| Section title | ~20px | Bold (700) | "Business Status", "Sales Graph" |
| Card label | ~13px | Regular (400) | KPI labels |
| Card value | ~28-32px | Bold (700) | KPI values |
| Table header | ~13px | Semi-bold (600) | Column headers |
| Table body | ~14px | Regular (400) | Cell content |
| Nav item | ~14px | Medium (500) | Sidebar links |
| Form label | ~13px | Regular (400) | Field labels |
| Form value | ~15px | Regular (400) | Field content |

### C.3 — Color System (Functional, not brand-specific)

| Role | Reference Pattern | EVOLIX Equivalent |
|---|---|---|
| Sidebar background | Dark navy (#1a2332 range) | Keep existing dark theme |
| Content background | Light gray (#f0f2f5 range) | CHANGE NEEDED — EVOLIX uses full dark |
| Card background | White | CHANGE NEEDED — EVOLIX uses glass dark |
| Primary accent | Blue/indigo | Keep --primary: #6366f1 |
| Positive/Cash | Green | Keep --success: #10b981 |
| Negative/Warning | Orange/amber | Keep --warning: #f59e0b |
| Danger/Negative | Red/coral | Keep --danger: #ef4444 |
| Info/Bank | Blue | Keep --info: #3b82f6 |
| KPI accent bars | Left border — green, orange, blue, coral | Adopt pattern |
| Text primary | Dark (#1a2332) | Inverted in dark mode |
| Text muted | Gray (#6b7280) | Keep existing |

### C.4 — Field Density & Card Proportions

| Property | Reference Value |
|---|---|
| KPI card height | ~80-90px |
| Table row height | ~48-52px |
| Form field height | ~44px |
| Settings category item | ~44px |
| Filter pill height | ~36px |
| Card border radius | ~8-12px |
| Field border radius | ~8px |
| Button border radius | ~8px |

### C.5 — Layout Composition

| Pattern | Description |
|---|---|
| Dashboard | KPI grid (3x2) + Chart (large) + Low Stock (sidebar panel) |
| Report/List | Filter bar -> Summary cards -> Full-width table |
| Detail/Inventory | Summary KPIs -> Transaction table |
| Settings | Left category sidebar + Right form panel |
| Invoice preview | Centered document card with structured header, line items, totals |
| Module overview | 2-column card grid (module cards with title + description) |

### C.6 — Responsive Behavior

Not directly visible in reference screenshots (desktop only). Based on reference documentation:
- Tables should transform to cards on mobile
- Sidebar should collapse to hamburger menu
- Forms should stack to single column
- KPI cards should reflow to fewer columns

---

## D. CRITICAL OBSERVATIONS FOR EVOLIX ADAPTATION

### D.1 — What to Adopt

1. **Sidebar navigation hierarchy** — Flat business-domain grouping (Parties, Items, Sale, Purchase, Cash & Bank, Accounting, Reports, Settings) instead of current technical module grouping (Organizations, Companies, Branches, Users, Roles)
2. **KPI card pattern** — Color-accent left bar, compact sizing, actionable click-through
3. **Filter bar pattern** — Horizontal pills above tables with date range, entity, and location filters
4. **Summary-above-table pattern** — KPI summary cards immediately above transaction tables
5. **Top bar with global search + quick actions** — Always-visible search + prominent action buttons
6. **Settings layout** — Left category sidebar + right detail panel
7. **Invoice print layout** — Document-style structured preview
8. **Clean table design** — Minimal borders, comfortable density, action overflow menus
9. **Low stock dashboard panel** — Real-time critical inventory visibility

### D.2 — What NOT to Adopt

1. **Light theme as default** — EVOLIX has established dark theme identity. Keep it, but ensure ERP density works in dark mode.
2. **Flat sidebar without icons** — EVOLIX already has icons. Keep them for faster scanning.
3. **Vyapar-specific modules** — "Grow Your Business", "Other Products", "Sync, Share & Backup" are Vyapar-specific SaaS features. Map only to EVOLIX equivalents.
4. **INR-only currency** — EVOLIX must support KWD and configurable currencies.
5. **Any Vyapar branding** — Logo, name, visual identity.

### D.3 — EVOLIX Business Rules That Override Reference

Per the reference hierarchy (Level 1 > Level 4):

- Purchasing never directly mutates stock (InventoryPostingService required)
- Accounting entries always via central PostingService
- Reversal instead of deletion
- Organization isolation and branch isolation
- StockBalanceProjection is derived, never directly editable
- Posted transactions are immutable
- RBAC enforcement on all endpoints
- Business event lineage must be traceable

---

## E. EVOLIX SIDEBAR NAVIGATION — PROPOSED STRUCTURE

Based on reference analysis + EVOLIX architecture:

```
Dashboard (Home)

Masters
  ├── Parties (Customers & Suppliers)
  ├── Items
  ├── Categories
  ├── Units
  ├── Warehouses / Godowns
  └── Price Lists

Sale (Future — Module 08)
  ├── Sale Invoice
  ├── Sale Order
  ├── Delivery Challan
  ├── Sale Return
  └── Payments Received

Purchase
  ├── Purchase Dashboard
  ├── Purchase Orders
  ├── Goods Receipt (GRN)
  ├── Purchase Invoice
  ├── Purchase Return
  └── Supplier Payments

Inventory
  ├── Stock Summary
  ├── Stock Movements
  ├── Transfers
  ├── Adjustments
  └── Low Stock

Cash & Bank (Future)
  ├── Cash Book
  ├── Bank Accounts
  └── Transfers

Accounting
  ├── Chart of Accounts
  ├── Vouchers
  ├── Ledger
  ├── Trial Balance
  ├── Receivables
  └── Payables

Reports (Future — Module 17)

GST / Tax (Future — Module 16)

Intelligence

Settings
  ├── Organization
  ├── Companies
  ├── Branches
  ├── Financial Years
  ├── Users & Roles
  ├── Sessions
  └── Preferences
```

### Key Changes from Current EVOLIX Sidebar

- Group admin/setup items under "Settings" — Organizations, Companies, Branches, Financial Years, Users, Roles, Sessions move from top-level nav to Settings sub-menu
- Elevate business domains — Purchase, Inventory, Accounting become top-level with sub-items
- Add Masters section — Godowns move here alongside future Parties/Items/Units
- Future-proof — Sale, Cash & Bank, Reports, GST sections are structurally present but show only when implemented modules exist

---

## F. DASHBOARD — PROPOSED STRUCTURE

Based on reference analysis + EVOLIX authoritative data sources:

```
Business Status (KPI Row 1)
  ├── Cash in Hand ──────── Source: Accounting (Cash ledger balance)
  ├── Stock Value ─────────  Source: StockBalanceProjection x cost_rate
  └── Bank Account ────────  Source: Accounting (Bank ledger balance)

Business Status (KPI Row 2)
  ├── Pending Orders ──────  Source: PurchaseOrder WHERE status IN ('CONFIRMED','PARTIALLY_RECEIVED')
  ├── Payables ────────────  Source: Accounting (Payable ledger balance)
  └── Receivables ─────────  Source: Accounting (Receivable ledger balance)

Sales Graph ──────────────── Source: Sales transactions (Future Module 08)
Low Stock Panel ──────────── Source: StockBalanceProjection WHERE quantity < reorder_level
```

Every KPI must be clickable and drill down to source data.
No fake numbers. No hardcoded values.

Current EVOLIX dashboard uses hardcoded values (1,248 / 42 / 856 / $24K). These MUST be replaced with real API-sourced data or removed entirely.
