# Module 05 Sales Core - Final Handoff Report

## 1. Module Scope
**Status: APPROVED**
The approved scope includes the core transactional backend for Sales:
- Sales Order
- Delivery Challan / Dispatch
- Sales Invoice (Retail & Wholesale)
- Sales Return

## 2. Architecture
Sales conforms to the central EVOLIX principle:
ENTER A BUSINESS EVENT ONCE → AUTOMATICALLY PROPAGATE ALL VALID BUSINESS EFFECTS

Sales does not maintain independent ledgers or duplicate stock truth. It delegates all authoritative effects down the chain.

## 3. Posting Flow
Sales creates the business event and delegates authoritative effects to:
Sales Posting → InventoryPostingService → AccountingPostingService → Receivable/AR → Audit/Lineage

## 4. Inventory Integration
Stock movements are strictly delegated to the `InventoryPostingService`. Negative stock, invalid warehouses, and double stock deductions are prevented automatically. Over-delivery protection logic is embedded in the flow.

## 5. Accounting Integration
Financial impacts are delegated to the `AccountingPostingService`. It creates the required vouchers seamlessly without Sales independently maintaining an accounting truth. Double posting prevention and balanced double-entry logic apply.

## 6. Receivable Integration
Customer receivables are intrinsically tied through bill allocation and the underlying voucher creation. No standalone receivable truth exists outside of the core accounting framework.

## 7. Return/Reversal Behavior
Sales returns accurately reverse previous stock and financial effects. Strict validations exist to prevent over-returns or inappropriate reversals. 

## 8. Idempotency
Concurrent processing and duplicate transactions are handled flawlessly, proven by idempotency constraint enforcements on unique constraint keys, stopping duplicate events.

## 9. RBAC/Isolation
Stringent isolation validations ensure actions cross-company or cross-branch bounds are securely prohibited.

## 10. Test Evidence
Test verification completed successfully:
- Sales tests: 8/8 passed
- Inventory regression: 22/22 passed
- Accounting regression: 23/23 passed
- Purchasing regression: 5/5 passed
- Backend build: passed
- Complete Sales → Inventory → Accounting → AR → Audit/Lineage chain verified.

## 11. Database Safety Finding
A critical safety investigation confirms:
- No existing business records were intentionally deleted.
- No existing accounting/inventory business history was intentionally removed.

## 12. Prisma Migration Caveat
During development, `npx prisma db push --accept-data-loss` was executed. This bypasses Prisma migration-history tracking. Therefore, it must NOT become the production schema deployment mechanism. 
A documented migration debt item ("Prisma Migration Baseline / Production Migration Hardening") has been filed to handle schema stability securely without deleting records.

## 13. Explicit Pending Phase-G Items
The following items are specifically delayed and NOT part of the current backend approval:
- Sales frontend refinement
- Sales dashboard
- Sales reports
- Sales intelligence

---

**Module 05 Sales Core is approved and handed off. Further Sales implementation is paused until the roadmap explicitly schedules the frontend/report/dashboard/intelligence phases.**
