# BUSINESS_EVENT_IMPACT_MATRIX.md — EVOLIX Trade ERP

**Purpose:** Formal matrix showing what each business event changes across all system domains.

**Legend:**

```text
✓   = affected
—   = not affected
TBD = business rule not yet finalized
```

---

# 1. Primary Business Events

| Event | Inventory | Location/Godown | Customer | Supplier | Cash | Bank | Accounting | Tax/GST | Audit | Reporting | Lineage |
|-------|-----------|-----------------|----------|----------|------|------|------------|---------|-------|-----------|---------|
| **PURCHASE** | ✓ +qty | ✓ target godown | — | ✓ payable ↑ | ✓ (cash purchase) | ✓ (bank purchase) | ✓ Dr Inventory+Input GST, Cr Supplier/Cash | ✓ Input GST | ✓ | ✓ | ✓ voucher→invoice, movement→line |
| **PURCHASE RETURN** | ✓ −qty | ✓ source godown | — | ✓ payable ↓ | — | — | ✓ Dr Supplier, Cr Purchase Return+Input GST Reversal | ✓ Input GST reversed | ✓ | ✓ | ✓ links to original purchase |
| **SALE** | ✓ −qty | ✓ source godown | ✓ receivable ↑ | — | ✓ (cash sale) | ✓ (bank sale) | ✓ Dr Customer/Cash, Cr Sales+Output GST | ✓ Output GST | ✓ | ✓ | ✓ voucher→invoice, movement→line |
| **SALES RETURN** | ✓ +qty | ✓ target godown | ✓ receivable ↓ | — | TBD (cash refund) | TBD | ✓ Dr Sales Return+Output GST Reversal, Cr Customer | ✓ Output GST reversed | ✓ | ✓ | ✓ links to original sale |
| **RECEIPT** | — | — | ✓ outstanding ↓ | — | ✓ (cash receipt) | ✓ (bank receipt) | ✓ Dr Cash/Bank, Cr Customer | — | ✓ | ✓ | ✓ bill allocation→invoices |
| **PAYMENT** | — | — | — | ✓ payable ↓ | ✓ (cash payment) | ✓ (bank payment) | ✓ Dr Supplier, Cr Cash/Bank | — | ✓ | ✓ | ✓ bill allocation→invoices |
| **STOCK TRANSFER** | ✓ ±0 net | ✓ source −qty, dest +qty | — | — | — | — | — | TBD (inter-state) | ✓ | ✓ | ✓ movement→transfer doc |
| **STOCK ADJUSTMENT** | ✓ ±qty | ✓ target godown | — | — | — | — | TBD | TBD | ✓ | ✓ | ✓ movement→adjustment doc |
| **SALES ORDER** | — | — | — | — | — | — | — | — | ✓ | ✓ | ✓ SO→invoice conversion |
| **PURCHASE ORDER** | — | — | — | — | — | — | — | — | ✓ | ✓ | ✓ PO→invoice conversion |
| **DELIVERY CHALLAN** | TBD | TBD | — | — | — | — | — | — | ✓ | ✓ | ✓ challan→invoice |
| **OPENING STOCK** | ✓ +qty | ✓ target godown | — | — | — | — | ✓ Dr Inventory, Cr Opening Equity | — | ✓ | ✓ | ✓ movement→opening doc |
| **OPENING BALANCE** | — | — | ✓ (customer) | ✓ (supplier) | ✓ (cash) | ✓ (bank) | ✓ Dr/Cr Party/Ledger, Cr/Dr Opening Equity | — | ✓ | ✓ | ✓ voucher→opening doc |

---

# 2. Secondary / Derived Events

| Event | Inventory | Location/Godown | Customer | Supplier | Cash | Bank | Accounting | Tax/GST | Audit | Reporting | Lineage |
|-------|-----------|-----------------|----------|----------|------|------|------------|---------|-------|-----------|---------|
| **CANCELLATION (any posted doc)** | ✓ reverse | ✓ reverse | ✓ reverse | ✓ reverse | ✓ reverse | ✓ reverse | ✓ reverse voucher | ✓ reverse | ✓ | ✓ | ✓ links to original |
| **CREDIT NOTE** | — | — | ✓ balance ↓ | — | — | — | ✓ Dr Income/Tax Reversal, Cr Customer | ✓ if GST adjusted | ✓ | ✓ | ✓ links to invoice |
| **DEBIT NOTE** | — | — | — | ✓ payable ↓ | — | — | ✓ Dr Supplier, Cr Expense/Tax Adjustment | ✓ if GST adjusted | ✓ | ✓ | ✓ links to purchase |
| **JOURNAL VOUCHER** | — | — | TBD | TBD | TBD | TBD | ✓ any balanced posting | TBD | ✓ | ✓ | ✓ manual with narration |
| **CONTRA** | — | — | — | — | ✓ (if cash involved) | ✓ (if bank involved) | ✓ Dr destination, Cr source | — | ✓ | ✓ | ✓ voucher |
| **PDC RECEIVED** | — | — | ✓ PDC receivable ↑ | — | — | — | ✓ Dr PDC Receivable, Cr Customer | — | ✓ | ✓ | ✓ cheque→customer |
| **PDC CLEARED** | — | — | — | — | — | ✓ bank ↑ | ✓ Dr Bank, Cr PDC Receivable | — | ✓ | ✓ | ✓ cheque→bank statement |
| **PDC BOUNCED** | — | — | ✓ outstanding restored | — | — | — | ✓ Dr Customer, Cr PDC Receivable | — | ✓ | ✓ | ✓ cheque→bounce event |

---

# 3. Effect Direction Summary

| Effect Domain | Increase Direction | Decrease Direction |
|---------------|-------------------|-------------------|
| **Inventory** | Purchase, Sales Return, Transfer In, Adjustment In, Opening, Production Output | Sale, Purchase Return, Transfer Out, Adjustment Out, Production Consume |
| **Customer Outstanding** | Credit Sale, PDC Bounce | Receipt, Sales Return, Credit Note, PDC Received |
| **Supplier Payable** | Credit Purchase | Payment, Purchase Return, Debit Note |
| **Cash** | Cash Sale, Cash Receipt | Cash Purchase, Cash Payment, Cash Out |
| **Bank** | Bank Sale, Bank Receipt, PDC Cleared | Bank Purchase, Bank Payment |

---

# 4. Atomicity Requirements

The following events MUST happen within a single database transaction:

```text
Sales Invoice Post:
  → insert invoice + lines
  → insert stock movements (per line)
  → insert accounting voucher + lines
  → insert bill allocation (credit sale)
  → insert audit event
  → update stock projection
  → COMMIT

Purchase Invoice Post:
  → insert invoice + lines
  → insert stock movements (per line)
  → insert accounting voucher + lines
  → insert bill allocation (credit purchase)
  → insert audit event
  → update stock projection
  → COMMIT

Receipt/Payment Post:
  → insert voucher + lines
  → insert bill allocations
  → insert audit event
  → COMMIT

Cancellation:
  → insert reverse movements
  → insert reverse voucher
  → reverse bill allocations
  → insert audit event
  → update stock projection
  → COMMIT
```

External API calls (e-Invoice, e-Way Bill, cloud sync) happen AFTER commit, never inside the transaction.

---

# 5. TBD Items Requiring Business Decision

| Item | Context | Options |
|------|---------|---------|
| Delivery Challan stock deduction | Does dispatching a challan deduct stock, or only the final invoice? | Challan deducts / Invoice deducts |
| Goods Receipt provisional accounting | When goods arrive before invoice, is a provisional payable created? | Yes (GR entry) / No (wait for invoice) |
| Stock Adjustment accounting | Should adjustments post to an expense ledger automatically? | Auto-post / Manual journal / Year-end only |
| Stock Adjustment GST | Are there GST implications for stock write-off/destruction? | Per statutory rules at time of implementation |
| Receipt/Payment draft state | Should receipts/payments support draft, or post immediately? | Draft workflow / Immediate post |
| Opening balance reversal | Can opening balances be edited after initial entry? | Editable / Adjustment only |
| Inter-state stock transfer tax | GST implications for branch transfers across state lines? | Per statutory rules |
| TDS/TCS on receipts/payments | When do TDS/TCS provisions apply? | Per statutory rules at time of implementation |
| Cash refund on sales return | Automatic cash refund or credit note only? | Cash refund / Credit note / Configurable |
