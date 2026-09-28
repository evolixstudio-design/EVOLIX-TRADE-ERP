# ERP FIELD IMPLEMENTATION ROADMAP

This roadmap details the sequential deployment of EVOLIX Trade modules. It adheres to the architectural mandate that downstream workflows (e.g., Sales) must rely on foundational engines (Accounting, Inventory) rather than creating isolated truth tables.

## PHASE 1: CORE MASTERS (Identity, Structure, Parties, Items)
**Status:** In Progress
- Organization, Company, Branch, Financial Year
- Roles, Permissions, Users, Audit
- Chart of Accounts Framework (Base hierarchy)
- Units, Item Categories, Tax Classes, HSN/SAC
- Party Master (Customers/Suppliers)
- Item Master (Base SKU, Pricing, Reorder limits)
- Godowns (Warehouses)

## PHASE 2: INVENTORY CORE (The Stock Engine)
**Status:** Planned
- Godown / Rack Management
- Stock Movements Engine (Single source of truth for stock quantities)
- Stock Adjustments & Opening Stock
- Stock Balances (Derived from movements)
- Batch & Expiry Framework
- Serial Number Framework

## PHASE 3: PURCHASING (Procure to Pay)
**Status:** Core implemented; Extended features planned
- Purchase Indent (Requisition)
- Purchase Quotation
- Purchase Order
- Goods Receipt Note (GRN) (Triggers Inventory Stock Movement)
- Purchase Invoice (Triggers Accounting Voucher + Payable)
- Purchase Return & Debit Note

## PHASE 4: ACCOUNTING CORE (The Ledger Engine)
**Status:** Implemented (Forensic Verification Ready)
- Centralized PostingService
- Vouchers (Journal, Payment, Receipt, Contra)
- Voucher Lines
- General Ledger & Account Balances (Derived from Voucher Lines)
- Trial Balance (Derived from Voucher Lines)
- Reversal Mechanics & Audit Log

## PHASE 5: SALES (Order to Cash)
**Status:** Planned
- Sales Quotation
- Sales Order
- Delivery Challan (Triggers Inventory Stock Movement)
- Sales Invoice (Triggers Accounting Voucher + Receivable)
- Sales Return & Credit Note

## PHASE 6: GST / TAX COMPLIANCE
**Status:** Planned
- GST Registration Configuration
- Tax Rates Matrix
- E-Invoice JSON Payload Generation (NIC format)
- E-Way Bill Generation API
- GSTR-1, GSTR-2, GSTR-3B Reporting (Derived from Invoices and Vouchers)
- TDS / TCS logic

## PHASE 7: CASH / BANK (Liquidity Management)
**Status:** Planned
- Bank Accounts Master
- Cash Accounts Master
- Cheque Printing & Management
- Post Dated Cheques (PDC)
- Bank Reconciliation (Matching bank statement lines to Vouchers)

## PHASE 8: POINT OF SALE (Retail)
**Status:** Planned
- POS Counter/Till Management
- Cashier Shift / Day-End
- Fast Retail Billing (Keyboard optimized)
- Barcode Scanning Integration
- Instant Receipt Printing

## PHASE 9: DISTRIBUTION / FIELD SALES
**Status:** Planned
- Area & Route Mapping
- Salesman Assignment
- Salesman Commission (Derived from Sales Invoices / Realizations)
- Delivery & Logistics Tracking
- Replacements & Claims

## PHASE 10: MANUFACTURING
**Status:** Planned
- Bill of Materials (BOM)
- Production Order
- Material Issue (Raw Material Stock OUT)
- Production Receipt (Finished Goods Stock IN)
- Wastage / By-product Accounting

## PHASE 11: ADVANCED REPORTING
**Status:** Planned
- P&L, Balance Sheet, Cash Flow
- Stock Ageing, Fast/Slow Moving Items
- Customer Outstanding Ageing
- Export to Excel/PDF
- Document Template Customization

## PHASE 12: INTELLIGENCE LAYER
**Status:** Base Implemented; Expansion Planned
- Natural Language querying over authorized data scope
- Insight generation (e.g., anomaly detection in purchasing or sales trends)
- Re-routing generative results into system API structures.
