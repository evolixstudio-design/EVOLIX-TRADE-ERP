# INTELLIGENCE_READINESS_GATE.md — Mandatory Module Gate

**Status:** Mandatory after automated tests and normal module QA  
**Purpose:** Ensure EVOLIX can later deliver trusted dashboards, alerts, reports and conversational answers without reconstructing unreliable history.

---

# 1. Historical Truth

```text
[ ] Posted facts are not overwritten by later master changes.
[ ] Status is explicit (draft/approved/posted/cancelled/etc. where applicable).
[ ] Cancellation/reversal is preserved as history, not destructive deletion.
[ ] Business date is available where reporting depends on it.
[ ] Technical created/updated/posted timestamps are available where needed.
[ ] User identity for important actions is preserved.
```

---

# 2. Scope / Isolation

```text
[ ] Organization/site/company ownership is explicit as applicable.
[ ] Branch scope is preserved where applicable.
[ ] Godown scope is preserved where applicable.
[ ] Financial-year context is preserved where applicable.
[ ] Server-side filters enforce the same scope for reports and CRUD.
[ ] Drill-down cannot leak another company/branch/godown.
```

---

# 3. Financial Precision

```text
[ ] Money uses PostgreSQL NUMERIC / Python Decimal.
[ ] Quantity uses defined Decimal precision.
[ ] No authoritative Number/float math exists in frontend or backend.
[ ] Rounding rule is explicit.
[ ] Historical rates/amounts required for reporting are preserved.
```

---

# 4. Tax / Cost Snapshots

Where applicable:

```text
[ ] HSN/SAC snapshot retained.
[ ] GST/tax rate snapshot retained.
[ ] Tax component amounts retained/reconstructable from immutable facts.
[ ] Place-of-supply/state context retained.
[ ] Historical inventory cost/COGS source is preserved.
[ ] Later master-price/tax changes do not rewrite historical profitability/tax.
```

---

# 5. Source Lineage

```text
[ ] Every derived/posting row references the source document/entity where applicable.
[ ] Returns reference source sale/purchase when available.
[ ] Reversals reference original transaction.
[ ] Stock movements reference source document/line.
[ ] Accounting vouchers reference source business document.
[ ] Payment allocations reference money movement and target bill.
```

---

# 6. Drill-down

For every metric/card/report introduced:

```text
[ ] User can see the metric definition.
[ ] Date/window is explicit.
[ ] Scope is explicit.
[ ] Metric can drill to underlying records or an equivalent reconciliation view.
[ ] Drill-down total reconciles to parent metric within documented rounding rules.
```

---

# 7. Read-Only Intelligence Safety

```text
[ ] Reports/intelligence do not mutate transactional data.
[ ] Intelligence does not become a second ledger/stock balance.
[ ] Cached/projection data is rebuildable and labelled non-authoritative.
[ ] Recommendations create drafts/links only through normal workflows.
```

---

# 8. Explainability

For an insight/alert/recommendation:

```text
[ ] Trigger/formula is documented.
[ ] Relevant values are shown.
[ ] Threshold/window is shown or discoverable.
[ ] Source drill-down exists.
[ ] No unexplained risk/quality score is used as hard business truth.
```

---

# 9. AI Tool Readiness

A module is future-AI-ready when:

```text
[ ] It exposes a stable domain/report service or can do so without raw SQL access.
[ ] Permission code is known.
[ ] Input filters can be represented as typed parameters.
[ ] Output has deterministic structured fields.
[ ] Company/branch scope is server enforced.
[ ] Error states use stable machine codes.
[ ] Result can be rendered independently of natural language.
```

This does not require an AI tool to be implemented now.

---

# 10. Performance

```text
[ ] Intelligence/reporting query is indexed appropriately for expected scale.
[ ] No full 100k-record dataset is loaded into browser for calculation.
[ ] No N+1 query pattern introduced.
[ ] Heavy exports can move to background worker where needed.
[ ] Dashboard/report load cannot block posting transaction path.
```

---

# 11. Gate Result

Module completion report must state:

```text
INTELLIGENCE READINESS: PASS / PARTIAL / FAIL

Facts produced:
Historical truth preserved:
Source lineage:
Drill-down:
Precision:
Scope isolation:
Explainability:
Future AI tool contract:
Known intelligence debt:
```

If future reports would be materially unreliable because required historical data is missing:

```text
MODULE IS NOT COMPLETE.
```
