# TRANSACTION FIELD IMPACT MATRIX

This document outlines how specific business events (transactions) in EVOLIX Trade propagate effects across the various internal engines (Inventory, Accounting, Tax, Cash, Lineage).
A transaction MUST NEVER be an isolated record; it must orchestrate effects across these engines.

## 1. SALES INVOICE (Wholesale / Retail)
| Effect | Yes/No | Authoritative Source | Notes |
|---|---|---|---|
| Inventory OUT | YES | StockMovement | Reduces physical stock quantity at Godown. |
| Customer AR | YES | Accounting (VoucherLine) | Posts DEBIT to Customer Party Ledger. |
| Revenue | YES | Accounting (VoucherLine) | Posts CREDIT to Sales Ledger(s). |
| GST Liability | YES | Tax + Accounting | Posts CREDIT to Output CGST/SGST/IGST Ledgers. |
| Cash/Bank | CONDITIONAL | Payment Receipt | If paid immediately (POS), posts DEBIT to Cash/Bank. |
| Audit | YES | AuditLog | Tracks who issued the invoice and when. |
| Lineage | YES | Source Document | Links to Delivery Challan / Sales Order if applicable. |
| Reports | DERIVED | Transactional Truth | Appears in GSTR-1, Sales Register, P&L. |

## 2. SALES RETURN / CREDIT NOTE
| Effect | Yes/No | Authoritative Source | Notes |
|---|---|---|---|
| Inventory IN | YES | StockMovement | Increases physical stock quantity. |
| Customer AR | YES | Accounting (VoucherLine) | Posts CREDIT to Customer Party Ledger (reduces balance). |
| Revenue Reversal | YES | Accounting (VoucherLine) | Posts DEBIT to Sales Return Ledger. |
| GST Liability | YES | Tax + Accounting | Posts DEBIT to Output Tax Ledgers (reducing liability). |
| Cash/Bank | CONDITIONAL | Payment | If refund issued, posts CREDIT to Cash/Bank. |
| Audit | YES | AuditLog | Strict audit required for credit notes. |
| Lineage | YES | Source Document | Must strictly link to the original Sales Invoice. |

## 3. PURCHASE INVOICE
| Effect | Yes/No | Authoritative Source | Notes |
|---|---|---|---|
| Inventory IN | YES | StockMovement | Assumes GRN is completed or bundled. Increases Stock Value. |
| Supplier AP | YES | Accounting (VoucherLine) | Posts CREDIT to Supplier Party Ledger. |
| Expense/Asset | YES | Accounting (VoucherLine) | Posts DEBIT to Purchase/Inventory Asset Ledger. |
| ITC (Input Tax) | YES | Tax + Accounting | Posts DEBIT to Input CGST/SGST/IGST Ledgers. |
| Cash/Bank | CONDITIONAL | Payment | If paid upfront, posts CREDIT to Cash/Bank. |
| Audit | YES | AuditLog | Tracks entry user and date. |
| Lineage | YES | Source Document | Links to GRN and Purchase Order. |

## 4. PURCHASE RETURN / DEBIT NOTE
| Effect | Yes/No | Authoritative Source | Notes |
|---|---|---|---|
| Inventory OUT | YES | StockMovement | Reduces physical stock quantity. |
| Supplier AP | YES | Accounting (VoucherLine) | Posts DEBIT to Supplier Party Ledger (reduces payable). |
| Expense Reversal | YES | Accounting (VoucherLine) | Posts CREDIT to Purchase Return Ledger. |
| ITC Reversal | YES | Tax + Accounting | Posts CREDIT to Input Tax Ledgers (reducing ITC). |
| Audit | YES | AuditLog | Strict audit required for debit notes. |
| Lineage | YES | Source Document | Must link to the original Purchase Invoice. |

## 5. GOODS RECEIPT NOTE (GRN)
| Effect | Yes/No | Authoritative Source | Notes |
|---|---|---|---|
| Inventory IN | YES | StockMovement | Purely physical receipt of goods. |
| Supplier AP | NO | — | Payable is recognized on Invoice, not GRN. |
| Accounting | CONDITIONAL | Accounting | May post to a clearing account (GRNI - Goods Received Not Invoiced). |
| Lineage | YES | Source Document | Links to Purchase Order. |

## 6. DELIVERY CHALLAN
| Effect | Yes/No | Authoritative Source | Notes |
|---|---|---|---|
| Inventory OUT | YES | StockMovement | Physical dispatch of goods. |
| Customer AR | NO | — | Receivable recognized on Invoice. |
| Accounting | CONDITIONAL | Accounting | May post to Deferred COGS / Delivery clearing. |
| Lineage | YES | Source Document | Links to Sales Order. |

## 7. RECEIPT VOUCHER
| Effect | Yes/No | Authoritative Source | Notes |
|---|---|---|---|
| Customer AR | YES | Accounting (VoucherLine) | Posts CREDIT to Customer (reduces outstanding). |
| Cash/Bank | YES | Accounting (VoucherLine) | Posts DEBIT to Cash or Bank Account. |
| Bill Allocation | YES | BillAllocation | Links the receipt against specific outstanding Sales Invoices. |

## 8. PAYMENT VOUCHER
| Effect | Yes/No | Authoritative Source | Notes |
|---|---|---|---|
| Supplier AP | YES | Accounting (VoucherLine) | Posts DEBIT to Supplier (reduces payable). |
| Cash/Bank | YES | Accounting (VoucherLine) | Posts CREDIT to Cash or Bank Account. |
| Bill Allocation | YES | BillAllocation | Links the payment against specific outstanding Purchase Invoices. |

## 9. STOCK TRANSFER
| Effect | Yes/No | Authoritative Source | Notes |
|---|---|---|---|
| Inventory OUT | YES | StockMovement | Reduces stock in Source Godown. |
| Inventory IN | YES | StockMovement | Increases stock in Destination Godown. |
| Accounting | CONDITIONAL | Accounting | No accounting effect if intra-branch. May have Inter-branch clearing ledger effect if cross-branch. |

## 10. STOCK ADJUSTMENT (Wastage / Found)
| Effect | Yes/No | Authoritative Source | Notes |
|---|---|---|---|
| Inventory | YES | StockMovement | Adjusts physical quantity to match physical count. |
| Accounting | YES | Accounting (VoucherLine) | Posts DEBIT to Wastage/Shrinkage Expense, CREDIT to Inventory Asset. |
| Audit | YES | AuditLog | Highly sensitive. Requires specific permissions. |
