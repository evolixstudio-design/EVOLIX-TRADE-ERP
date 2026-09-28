# AI_BUSINESS_ASSISTANT_ARCHITECTURE.md — EVOLIX Conversational Business Assistant

**Status:** Future module; architecture decisions apply from Day 0  
**Interfaces:** In-app EVOLIX Messenger first; WhatsApp adapter later  
**Principle:** AI explains and orchestrates safe tools. ERP domain services remain authoritative.

---

# 1. Product Vision

The owner should be able to ask EVOLIX in a preferred language:

- "Aaj ki total sale kitni hai?"
- "Kal se compare karo."
- "Top 10 products ka PDF bhejo."
- "September me Surat branch ke top customers dikhao."
- "ABC Traders ka outstanding aur last payment batao."
- "Is month margin kyu gira?"

EVOLIX returns permission-aware answers using live ERP data and can generate tables/charts/PDF reports through the normal report engine.

---

# 2. Channels

## Phase A — In-App EVOLIX Messenger

Preferred first interface because authentication/company context is already available.

## Phase B — WhatsApp Business Adapter

Internet-dependent optional channel.

WhatsApp identity must be securely linked to an EVOLIX user/account and authorized company scope.

Core ERP operation must never depend on WhatsApp availability.

---

# 3. Architecture

```text
Owner / Authorized User
        │
        ├── In-App Messenger
        └── WhatsApp Business Adapter (later)
                 │
                 ▼
          AI Conversation Gateway
                 │
        ┌────────┼───────────┐
        ▼        ▼           ▼
 Language   Context       Intent/Tool Router
 Detection  Manager
        └────────┬───────────┘
                 ▼
        Permission + Scope Guard
                 ▼
             Tool Registry
                 │
     ┌───────────┼──────────────┐
     ▼           ▼              ▼
 Report Tools  Intelligence   Domain Read Tools
                 Tools
     └───────────┼──────────────┘
                 ▼
      Authoritative EVOLIX Services
                 │
                 ▼
     Structured Results / PDF / Chart
                 │
                 ▼
         Natural-language Response
```

---

# 4. No Raw SQL by AI

The LLM must never be given unrestricted database-query capability.

Allowed pattern:

```text
AI chooses typed tool
→ tool validates parameters
→ server checks permission/scope
→ domain/report service executes controlled query
→ structured result returned
```

Forbidden:

```text
AI writes arbitrary SQL
→ database
```

---

# 5. Initial Tool Families

Conceptual examples:

## Sales
- `get_sales_summary`
- `get_sales_trend`
- `get_top_products`
- `get_salesman_performance`

## Inventory
- `get_stock_status`
- `get_low_stock`
- `get_non_moving_stock`
- `get_near_expiry`
- `get_reorder_suggestions`

## Customer / Credit
- `get_customer_outstanding`
- `get_receivable_ageing`
- `get_customer_sales_history`
- `get_collection_summary`

## Purchase / Supplier
- `get_supplier_payables`
- `get_purchase_rate_history`
- `get_supplier_comparison`

## Accounting / Management
- `get_profit_summary`
- `get_cash_bank_summary`
- `get_trial_balance_summary` where permission allows

## Reports
- `generate_report`
- `generate_report_pdf`
- `generate_report_xlsx` where supported

Tool names are conceptual. Final API naming follows EVOLIX conventions.

---

# 6. Tool Contract Requirements

Each AI-callable tool must declare:

```text
tool name
description
required permission
allowed company/branch/godown scope
input schema
supported date semantics
output schema
max result size
whether PDF/export is supported
whether it is read-only or action-capable
audit requirements
```

Read tools should be read-only by default.

---

# 7. Conversation Context

The assistant may support follow-ups:

```text
Owner: September ki total sales?
EVOLIX: ₹42.7 lakh.
Owner: Wholesale only.
EVOLIX: ₹31.2 lakh.
Owner: Surat branch only.
EVOLIX: ₹18.4 lakh.
Owner: PDF bana do.
```

The context manager may carry:

- selected company;
- branch;
- date range;
- report type;
- filters;
- comparison window;
- output preference.

Never let conversational context override permissions.

Context must be bounded and have retention/privacy policy.

---

# 8. Multilingual Interaction

The user may communicate in supported natural languages or mixed language.

Example inputs:

- English
- Hindi
- Hinglish
- Gujarati later

Natural language is interpreted into a language-neutral typed request.

Example:

```text
Intent: PRODUCT_SALES_RANKING
Period: LAST_30_DAYS
Limit: 10
CompanyScope: authenticated selection
```

Domain logic does not vary by conversation language.

---

# 9. PDF / Report Generation

AI does not invent PDF totals.

Flow:

```text
Natural-language request
→ typed report specification
→ permission/scope validation
→ ReportService
→ authoritative dataset
→ PDF/XLSX/CSV renderer
→ file delivered in chat/channel
```

Every generated report should carry:

- company;
- branch if filtered;
- report title;
- period;
- generated timestamp;
- filter summary;
- page numbering where applicable.

---

# 10. Action Safety

Start the assistant as **read-only**.

Later action tools may exist, but must use normal workflows.

Examples:

- Create Purchase Order Draft
- Create reminder draft
- Open approval request

High-risk commands require explicit confirmation and permission.

Examples:

- block/unblock party;
- approve credit override;
- cancel posted invoice;
- post journal;
- approve payment;
- reopen period.

The assistant must never silently execute high-impact actions from ambiguous natural language.

---

# 11. Audit

AI interactions that read sensitive data or trigger actions should record appropriate audit metadata.

For action requests capture:

- initiating user;
- channel;
- conversation/message reference;
- tool invoked;
- target entity;
- parameters excluding secrets;
- confirmation state;
- resulting entity/action id;
- timestamp.

Do not store unnecessary full conversation content indefinitely by default.

---

# 12. Permission Examples

If a billing operator asks:

> "Company ka total profit batao"

and lacks `reports.profit_loss.view`, the tool must reject the request server-side.

The LLM cannot override that rejection.

Similarly, branch-limited users receive only their authorized branch data.

---

# 13. Hallucination Defense

The assistant should distinguish:

- tool-derived ERP fact;
- calculated comparison returned by EVOLIX service;
- explanatory interpretation;
- missing/unavailable information.

If a required tool fails or data is unavailable, say so rather than estimating financial figures.

For business totals, never answer from model memory.

---

# 14. Proactive Alerts Later

The system may later send configured alerts such as:

- low stock;
- stockout risk;
- near expiry;
- overdue receivables;
- unusual return rate;
- margin drop;
- backup failure;
- sync/integration failure.

Proactive messages must be permissioned, deduplicated and configurable.

---

# 15. Availability Boundary

```text
Core ERP: local-first and internet-independent
Deterministic Intelligence: preferably local-first
In-App AI: may require configured AI provider unless local model exists
WhatsApp AI: internet/provider dependent
```

Failure of AI/WhatsApp must never block normal ERP work.
