# EVOLIX Trade — Intelligence Layer Field Specifications

**Date:** 2026-09-26
**Status:** DESIGN PROPOSAL — companion to `HYBRID_WORKFLOW_DESIGN.md` and `MODULE_FIELD_SPECIFICATIONS.md`
**Position in doc set:** Defines the sections and fields for the Intelligence Layer + AI Assistant — the "ask your business a question" capability. Should be read alongside `INTELLIGENCE_ARCHITECTURE.md` (if/when drafted) for the underlying data-flow rules. This document specifies *what the owner sees and configures*; it does not itself authorize implementation of any AI-dependent module.

**Governing principle (carried from the Connected ERP Principle):** the deterministic intent layer (Section 2) is the actual ERP capability and must work with zero internet and zero AI. The AI/NLU layer (Section 3) is a convenience wrapper that turns a messy question into a call against that same deterministic layer — it never computes an answer independently, and it is never required for core ERP correctness.

**Tiering key used throughout:**
- **Tier 1 — Day-1 minimum**: works with AI fully off.
- **Tier 2 — Required once AI/a given feature is enabled**: gated behind an explicit toggle.
- **Tier 3 — Optional / progressive disclosure**: not required for the feature to function.
- **System-derived**: never asked directly — computed, scoped, or looked up automatically.

---

## 1. Query Input

*(the "easy" surface — Vyapar-style, zero setup to start asking)*

| Tier 1 — Day-1 minimum | Tier 2 — once AI is enabled | Tier 3 — optional |
|---|---|---|
| Single text input: "Ask your business a question" | Language auto-detect on the question | Voice input |
| Works against the pre-built question library (Section 2) with no setup | Response returned in the same language asked | Saved/favorite questions |
| | | WhatsApp/Telegram as an input channel, not just in-app |

---

## 2. Deterministic Intent Layer

*(the part that never needs AI — this is the actual ERP capability)*

| Tier 1 — ships pre-built | Tier 2 — system config, not owner-facing | Tier 3 — optional |
|---|---|---|
| Fixed intent library at launch: "today's sales," "who owes me," "low stock," "cash in hand," "top-selling item this month," "outstanding payables" | Intent → data-source binding: maps each intent to the exact `PostingService`-derived table/view it reads | Owner-defined custom shortcuts (e.g. "show me Ramesh's outstanding" saved as a one-tap button) |
| Each answer computed directly from ledgers/stock movements — same data the standard reports use, never a separate copy | Permission scope per intent (RBAC code required to execute it) | |

**Guarantee:** every intent here is a saved, well-known report query. The "intelligence" isn't inventing answers — it's routing to reports that already exist and are already correct. This is the Marg-depth half of the design.

---

## 3. AI / NLU Layer

*(optional enhancement only — off by default)*

| Tier 1 — off by default | Tier 2 — required to turn AI on | Tier 3 — optional |
|---|---|---|
| ERP fully functional via Section 2 alone with the AI toggle OFF | AI enable toggle (admin-level only) | Conversation memory / follow-up context (e.g. "what about last month?" after a prior answer) |
| | API key / provider configuration (admin-level, never surfaced to the shop owner) | Assistant tone/persona setting |
| | Fallback behavior when AI is unreachable: falls back to Section 2's deterministic path, never a blank or broken state | |

**Hard rule:** core ERP correctness never depends on this section existing. AI's only job is translating a typed or spoken question into the correct Section 2 intent call.

---

## 4. Permission-Aware Tooling

| Tier 1 — system-derived, no setup | Tier 2 — admin config | Tier 3 — optional |
|---|---|---|
| Every intent/tool auto-bound to an existing RBAC permission code — e.g. a cashier asking "show me total profit" is refused the same way the UI would refuse them | Role-level restriction on which questions are exposed per role | Per-user override on top of the role default |

---

## 5. Answer Composition & Drill-down

| Tier 1 | Tier 2 | Tier 3 |
|---|---|---|
| Every answer cites the source transaction(s) behind it — e.g. "₹42,000 in dues" links to the actual unpaid invoices | "View source" opens the real transaction record, not a summary | Export the underlying dataset behind any answer |

**Guarantee:** an answer that cannot be traced back to a real document is exactly the "separate AI truth" the Connected ERP Principle forbids. This is non-negotiable regardless of which AI provider is behind Section 3.

---

## 6. Report & PDF Generation

| Tier 1 | Tier 2 | Tier 3 |
|---|---|---|
| Any answer can be exported to PDF with one tap | PDF reuses Organization branding — logo/signature pulled from the Organization profile (see `MODULE_FIELD_SPECIFICATIONS.md` §1) | Custom report builder, Excel export, WhatsApp-shareable link |

---

## 7. Channel / Delivery

| Tier 1 | Tier 2 | Tier 3 |
|---|---|---|
| In-app chat, always available | WhatsApp Business API binding (owner's number, explicit opt-in required) | Scheduled daily/weekly summary pushed automatically (e.g. "Today: ₹18,500 sales, 2 low-stock items") |

---

## 8. Multi-Tenant / Org Scope

| Tier 1 — system-derived | Tier 2 — admin-gated | Tier 3 |
|---|---|---|
| Every question auto-scoped to the logged-in org/branch — never a manually entered field | Cross-branch questions require explicit elevated permission | Consolidated multi-branch answers (e.g. "total sales across all 3 branches") |

---

## 9. Summary — What Gates What

| Trigger | Unlocks |
|---|---|
| ERP installed, day 1 | Section 2 (deterministic intents) fully usable, zero AI required |
| AI toggle turned on (admin) | Section 1's free-form language input, Section 3's NLU routing |
| WhatsApp connected | Section 7's channel delivery + scheduled summaries |
| Multi-branch enabled | Section 8's cross-branch consolidation |

---

## 10. Open Decision Requiring Explicit Sign-off

**Does the AI layer ever get write access** (e.g. "record a ₹500 cash sale" via chat), or is it strictly read-only/query-only?

Everything in this specification assumes **read-only** — the safer Day-0 scope, and the only scope that keeps the Intelligence Layer cleanly separate from `PostingService`. If write access is ever introduced, it must route through the same `PostingService` call and RBAC checks as every other transaction entry point (per the Connected ERP Principle) — it should never become a second way to mutate business truth. This should be resolved and recorded in `TRANSACTION_WORKFLOW.md` before any write-capable intent is built.

---

## 11. Next Step

1. Confirm the Section 2 intent library against real owner questions (interview a handful of target users — retailer, distributor, pharmacy — rather than guessing the list).
2. Draft `INTELLIGENCE_ARCHITECTURE.md` to formalize the data-flow behind Section 2 (intent → data-source binding → PostingService-derived views), consistent with the no-separate-truth rule already established for reporting.
3. Resolve §10 (read-only vs write) before any AI provider integration work begins.
