# ACCOUNTING IMPLEMENTATION MAP

| ACCOUNTING CONCEPT | AUTHORITATIVE DATABASE MODEL | SERVICE | API | UI | STATUS |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Chart of Accounts** | `LedgerAccount` (Requires `account_type`, `normal_balance`, `parent_id`) | `AccountingService` | `GET /accounts`, `POST /accounts` | Chart of Accounts | PARTIALLY IMPLEMENTED (Schema missing fields) |
| **Account** | `LedgerAccount` | `AccountingService` | `GET /accounts/:id` | Account Edit Form | PARTIALLY IMPLEMENTED |
| **Voucher** | `Voucher` | `PostingService` | `GET /vouchers`, `GET /vouchers/:id` | Journal / Vouchers | PARTIALLY IMPLEMENTED |
| **Voucher Line** | `VoucherLine` | `PostingService` | Part of Voucher endpoints | Journal / Vouchers | PARTIALLY IMPLEMENTED |
| **Ledger** | Derived from `VoucherLine` | `LedgerService` | `GET /ledger` | General Ledger | MISSING |
| **Posting** | `Voucher` status `POSTED` | `PostingService.post()` | `POST /vouchers/:id/post` | Vouchers | MISSING |
| **Reversal** | `Voucher` status `REVERSED` | `PostingService.reverse()` | `POST /vouchers/:id/reverse` | Vouchers | MISSING |
| **Account Balance** | Derived `SUM(debit) - SUM(credit)` | `LedgerService` | `GET /accounts/:id/balance` | Trial Balance, Dashboard | MISSING |
| **Fiscal Period** | `FinancialYear` | `PostingService` (validation) | N/A (Core ERP) | N/A | IMPLEMENTED |
| **Source Document** | `Voucher.source_document_type/id` | `PostingService` | Embedded in Voucher | Source Lineage View | IMPLEMENTED (Schema fields exist) |
| **Audit Trail** | `AuditTrail` (Needs to be implemented/checked) | `AuditService` | `GET /audit` | Audit View | REQUIRES DECISION (Check if Audit model exists) |

## DEPENDENT MODULES
- **Module 02 Purchasing**: `PurchaseInvoice` and `GoodsReceipt` will call `PostingService` instead of directly manipulating vouchers if they currently do.
- **Module 08 Sales**: Will depend on `PostingService`.
- **Intelligence Layer**: Can read Ledger balances and Voucher Lines directly for intents like CASH_BALANCE, EXPENSE_SUMMARY.
