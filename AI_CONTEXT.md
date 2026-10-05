PRODUCT:
EVOLIX Retail V1

STRATEGY:
Retail first.
Wholesale/Distributor/Manufacturing later as isolated modules.

STACK:
Backend:
NestJS
TypeScript
Prisma
PostgreSQL

Frontend:
React
Vite
Zustand

ACTIVE PRODUCT:
Retail mobile-first billing application.

ACTIVE CORE:
Auth
Multi-tenancy
Inventory
Accounting
Pricing
POS
Platform

RETAIL MODULES:
Home
Billing
Items
Customer Khata
Suppliers
Purchases
Supplier Khata
Need List

MULTI-TENANCY:
Organization → Company → Branch → Godown.
Never accept arbitrary tenant identity from Retail request bodies.

DESIGN:
White + light green.
Mobile first.
Simple retailer language.
No ERP terminology in normal Retail UI.

IMPORTANT ARCHITECTURE RULE:
Retail UI → Retail Facade → Shared ERP Core.

Never duplicate accounting/inventory logic in Retail.

PROTECTED:
Phase 1 Retail billing/items/customer khata.
Do not alter core behavior without regression testing.

CURRENT DEVELOPMENT:
Retail only.

FUTURE:
Wholesale
Distributor
Manufacturing
