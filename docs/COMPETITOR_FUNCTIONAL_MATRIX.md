# COMPETITOR FUNCTIONAL MATRIX

This document provides a comparative functional matrix of EVOLIX Trade against established Indian ERP products like Vyapar and Marg ERP.

| Module | Capability | Vyapar | Marg | EVOLIX | Evidence | Notes |
|---|---|---|---|---|---|---|
| **Organization** | Multi-Branch / Location | PARTIAL | YES | YES | Public Docs | Vyapar primarily handles multi-business via separate sync; Marg has robust multi-branch. EVOLIX uses explicit Branch isolation. |
| **Organization** | Multi-Company | YES | YES | YES | Public Docs | All support multiple legal entities. |
| **Identity & RBAC** | Granular Role-Based Access | NO | YES | YES | App Settings | Vyapar provides simple Admin/User roles. Marg provides deep field-level access control. EVOLIX uses modular RBAC matrices. |
| **Items/Inventory** | Batch Tracking & Expiry | YES | YES | YES | Product Features | Marg excels in Pharma batching. Vyapar supports basic batch. EVOLIX natively tracks Batch/Expiry on StockMovements. |
| **Items/Inventory** | Multi-Unit Conversion | YES | YES | YES | Settings | EVOLIX strictly requires base_quantity_delta mapping. |
| **Items/Inventory** | Serial Number Tracking | YES | YES | YES | Feature List | EVOLIX to integrate Serial Numbers at line-item GRN level. |
| **Items/Inventory** | Rack / Godown Management | NO | YES | YES | Marg Docs | Marg has detailed rack/shelf mapping. EVOLIX implements Godown hierarchy. |
| **Purchasing** | Full Procure-to-Pay Workflow | PARTIAL | YES | YES | Product Workflow | Vyapar lacks Indent to PO enforcement. Marg supports complex Indents. EVOLIX enforces PO -> GRN -> Invoice. |
| **Sales** | Quotation to Invoice | YES | YES | YES | Product Workflow | Standard across all three. |
| **Sales** | POS / Retail Billing | YES | YES | YES | POS Modules | Vyapar has mobile POS. Marg has strong Desktop retail POS. EVOLIX implements fast Desktop/Web POS. |
| **Accounting** | True Double-Entry Ledger | PARTIAL | YES | YES | Core Architecture | Vyapar hides accounting behind simple balances. Marg is a full accounting engine. EVOLIX uses strict Ledger + Voucher core. |
| **Accounting** | Configurable Chart of Accounts | PARTIAL | YES | YES | Settings | Vyapar uses fixed groups. Marg and EVOLIX support custom trees. |
| **Tax / GST** | GST E-Invoicing | YES | YES | YES | GST Updates | EVOLIX planned via GSP API integration. |
| **Tax / GST** | E-Way Bill Generation | YES | YES | YES | GST Updates | Standard compliance feature. |
| **Tax / GST** | GSTR Reports (1, 2, 3B, 9) | YES | YES | YES | Tax Reports | Native requirement. |
| **Distribution** | Route & Area Management | NO | YES | YES | Marg SFA | Marg has strong FMCG distribution routes. EVOLIX to build native Route/Salesman assignment. |
| **Distribution** | Salesman Commission | PARTIAL | YES | YES | User Roles | Marg has deep commission formulas. |
| **Manufacturing** | BOM & Production | PARTIAL | YES | YES | Manufacturing | Vyapar supports basic assembly. Marg supports complex production. EVOLIX implements multi-stage BOM. |
| **Intelligence** | Natural Language Querying | NO | NO | YES | AI Layer | EVOLIX differentiator via Intelligence Layer (Module 00). |
| **Architecture** | Single Truth Architecture | NO | NO | YES | DB Schema | Most legacy ERPs sync separate truth tables (e.g., Stock vs AR vs Accounting). EVOLIX forces real-time double-entry posting. |
