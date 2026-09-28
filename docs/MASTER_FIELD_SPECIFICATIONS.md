# MASTER FIELD SPECIFICATIONS

This is the canonical field-level specification for EVOLIX Trade. It ensures that every screen maps to correct downstream effects and single sources of truth.

---

## MODULE 09/10/11: PARTIES (CUSTOMER & SUPPLIER MASTER)

### Identity & Contact Section

| Field | Display Label | Type | Required | Default | Validation | Editable | Permission | Scope | Source of Truth |
|---|---|---|---|---|---|---|---|---|---|
| code | Party Code | string | Yes | Auto | Unique per company | No | `party.manage` | Company | Party Master |
| party_type | Party Type | enum | Yes | CUSTOMER | CUSTOMER/SUPPLIER | No | `party.manage` | Company | Party Master |
| name | Display Name | string | Yes | — | Min 3 chars | Yes | `party.manage` | Company | Party Master |
| legal_name | Legal Name | string | No | Same as name | — | Yes | `party.manage` | Company | Party Master |
| phone | Primary Phone | string | No | — | Regex (10 digits) | Yes | `party.manage` | Company | Party Master |

### Tax & Financial Section

| Field | Display Label | Type | Required | Default | Validation | Editable | Permission | Scope | Source of Truth |
|---|---|---|---|---|---|---|---|---|---|
| gstin | GSTIN | string | No | — | Valid GST structure | Yes | `party.manage` | Company | Party Master |
| credit_limit | Credit Limit | currency | No | 0 | >= 0 | Restricted | `party.credit` | Company | Party Master |
| credit_days | Credit Days | integer | No | 0 | >= 0 | Yes | `party.manage` | Company | Party Master |
| opening_balance | Opening Balance | currency | No | 0 | — | Restricted | `party.opening`| Company | Account Ledger |

**Behavior & Business Effects:**
| Field | Business Meaning | Dependencies | Inventory Effect | Accounting Effect | Tax Effect | Cash/Bank Effect | AR/AP Effect | Audit | Lineage |
|---|---|---|---|---|---|---|---|---|---|
| gstin | Determines Inter/Intra state tax | State Code derived from GSTIN | None | None | Drives CGST/SGST vs IGST on Invoices | None | None | Yes | Appears on Invoice Print |
| credit_limit | Maximum outstanding allowed | Customer Outstanding | None | None | None | None | Blocks Sales Order/Invoice if exceeded | Yes | None |

---

## MODULE 16: ITEM MASTER

### Identity & Pricing Section

| Field | Display Label | Type | Required | Default | Validation | Editable | Permission | Scope | Source of Truth |
|---|---|---|---|---|---|---|---|---|---|
| sku | Item Code / SKU | string | Yes | Auto | Unique | No | `item.manage` | Company | Item Master |
| name | Item Name | string | Yes | — | Min 3 chars | Yes | `item.manage` | Company | Item Master |
| primary_unit_id | Base Unit | ref | Yes | PCS | Active Unit | Restricted | `item.manage` | Company | Unit Master |
| mrp | M.R.P | currency| Yes | 0 | >= 0 | Yes | `item.manage` | Company | Item Master |
| default_sale_rate| Sale Price | currency| Yes | 0 | <= MRP | Yes | `item.manage` | Company | Item Master |
| tax_class_id | Tax/GST % | ref | Yes | Exempt | Active Tax Class| Yes | `item.manage` | Company | Tax Class Master |

**Behavior & Business Effects:**
| Field | Business Meaning | Dependencies | Inventory Effect | Accounting Effect | Tax Effect | Cash/Bank Effect | AR/AP Effect | Audit | Lineage |
|---|---|---|---|---|---|---|---|---|---|
| tax_class_id | Item GST Category | Tax Class table | None | None | Determines Tax Line % on Sales/Purchases | None | None | Yes | Drives Tax on Invoices |
| primary_unit_id | Smallest measurable qty | Unit Table | Base unit for all StockMovements | None | None | None | None | Yes | Conversion reference |

---

## MODULE 44: SALES INVOICE

### Header Section

| Field | Display Label | Type | Required | Default | Validation | Editable | Permission | Scope | Source of Truth |
|---|---|---|---|---|---|---|---|---|---|
| document_number| Invoice No. | string | Yes | Auto | Unique per Series| No | `sales.create` | Branch | Document Sequence |
| document_date | Invoice Date | date | Yes | Today | Within Open FY | Yes | `sales.create` | Branch | Transaction |
| party_id | Customer | ref | Yes | — | Active Customer | Yes | `sales.create` | Branch | Party Master |

**Behavior & Business Effects:**
| Field | Business Meaning | Dependencies | Inventory Effect | Accounting Effect | Tax Effect | Cash/Bank Effect | AR/AP Effect | Audit | Lineage |
|---|---|---|---|---|---|---|---|---|---|
| party_id | Buyer / Debtor | Party active status, Credit Limit | None | Debits Customer Ledger | Tax State comparison | None | Increases AR | Yes | Master Ref |

### Lines Section (Array)

| Field | Display Label | Type | Required | Default | Validation | Editable | Permission | Scope | Source of Truth |
|---|---|---|---|---|---|---|---|---|---|
| item_id | Item | ref | Yes | — | Active Item | Yes | `sales.create` | Branch | Item Master |
| quantity | Qty | decimal| Yes | 1 | > 0 | Yes | `sales.create` | Branch | User Entry |
| rate | Rate | decimal| Yes | Item default| >= 0 | Yes | `sales.create` | Branch | User Entry |
| discount | Disc % | decimal| No | 0 | 0-100 | Yes | `sales.create` | Branch | User Entry |

**Behavior & Business Effects:**
| Field | Business Meaning | Dependencies | Inventory Effect | Accounting Effect | Tax Effect | Cash/Bank Effect | AR/AP Effect | Audit | Lineage |
|---|---|---|---|---|---|---|---|---|---|
| quantity | Sold Qty | Stock Availability (optional block) | **Stock OUT** | Line Total -> Revenue Ledger | Line Total -> Tax calculation | None | AR Total | Yes | Traced to StockMovement |
| rate | Price per unit | Item Master | None | Line Total -> Revenue Ledger | Line Total -> Tax calculation | None | AR Total | Yes | Traced to Ledger |

---

## MODULE 63: ACCOUNTING VOUCHERS

### Header Section

| Field | Display Label | Type | Required | Default | Validation | Editable | Permission | Scope | Source of Truth |
|---|---|---|---|---|---|---|---|---|---|
| voucher_type | Type | enum | Yes | JOURNAL | Valid Enum | No | `accounting.write`| Branch | Transaction |
| document_number| Voucher No. | string | Yes | Auto | Unique per type | No | `accounting.write`| Branch | Document Sequence |
| voucher_date | Date | date | Yes | Today | Open FY | Yes | `accounting.write`| Branch | Transaction |

### Lines Section (Array)

| Field | Display Label | Type | Required | Default | Validation | Editable | Permission | Scope | Source of Truth |
|---|---|---|---|---|---|---|---|---|---|
| ledger_account_id| Account | ref | Yes | — | Active Ledger | Yes | `accounting.write`| Branch | Ledger Accounts |
| debit | Debit | currency| Yes | 0 | >= 0 | Yes | `accounting.write`| Branch | User Entry |
| credit | Credit | currency| Yes | 0 | >= 0 | Yes | `accounting.write`| Branch | User Entry |

**Behavior & Business Effects:**
| Field | Business Meaning | Dependencies | Inventory Effect | Accounting Effect | Tax Effect | Cash/Bank Effect | AR/AP Effect | Audit | Lineage |
|---|---|---|---|---|---|---|---|---|---|
| debit/credit | Transaction Value | Must balance (Total Dr = Total Cr) | None | Modifies Trial Balance | None | Affects Cash if Cash Ledger | AR/AP if Party Ledger | Yes | Source truth for accounting |

---
*Note: This document provides the architectural standard for implementing EVOLIX fields. Every new form introduced must be documented in this matrix prior to PR approval.*
