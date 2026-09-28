# MODULE_COMPLETION_QA_GATE.md — EVOLIX Trade ERP

**Status:** Mandatory engineering and manual-QA gate  
**Applies to:** Every EVOLIX Trade ERP module  
**Audience:** Antigravity, Copilot, developers, reviewers, testers

---

# 1. Purpose

This document prevents small but frequent ERP defects from being pushed to the project owner for repeated manual correction.

Examples of defects this gate is designed to catch before handoff:

- search works only when exact letter case is used;
- uppercase data cannot be found using lowercase search;
- search bar is missing where users clearly need one;
- add button shows duplicate symbols such as `++`;
- duplicate buttons appear in the same screen;
- button icon and label do not match;
- edit/delete actions disappear at smaller widths;
- forms do not clear after save;
- validation messages are missing;
- filters reset unexpectedly;
- table columns overflow;
- Enter key submits the wrong form;
- duplicate records can be created;
- pagination does not preserve filters;
- dropdown values are inconsistent;
- permissions hide a button but direct API access still works;
- empty states are blank;
- loading states look broken;
- error messages expose technical details;
- success toast appears even when the request failed;
- Hindi/English labels overflow or remain untranslated;
- mobile layouts become unusable;
- refresh loses required application state;
- server is not started for manual testing;
- test credentials are not supplied after module completion.

**A module is NOT complete until this gate passes.**

---

# 2. Core Rule

Antigravity must not stop immediately after:

```text
"Implementation complete"
```

Instead, the required completion flow is:

```text
Implement module
      ↓
Run automated tests
      ↓
Run UI quality checks
      ↓
Run CRUD + validation checks
      ↓
Run search/filter/table checks
      ↓
Run RBAC/security checks
      ↓
Run responsive/keyboard checks
      ↓
Run integration/regression checks
      ↓
Fix every discovered issue
      ↓
Start backend + frontend
      ↓
Confirm application health
      ↓
Provide local test credentials
      ↓
Provide exact manual testing checklist
      ↓
WAIT FOR USER'S MANUAL VERIFICATION
```

**Do not move to the next module until the user confirms the current module has been manually checked or explicitly instructs development to continue.**

---

# 3. Clean-Room Product Standard

EVOLIX may match the **business completeness and workflow maturity** expected from established retail/wholesale ERP products.

Do NOT copy:

- Marg ERP source code;
- Marg proprietary layouts;
- Marg logos/icons/assets;
- undocumented behavior;
- proprietary database schemas;
- proprietary wording/trademarks.

Use original EVOLIX UX while meeting or exceeding normal ERP usability expectations.

---

# 4. Mandatory UI Completeness Review

Before handoff, inspect every screen in the module.

For each screen verify:

```text
[ ] Title exists
[ ] Page purpose is obvious
[ ] Primary action exists
[ ] Primary action appears only once unless intentionally repeated
[ ] Secondary actions are logically placed
[ ] Search is present where lists can become large
[ ] Filter is present where users need narrowing
[ ] Sort is available where useful
[ ] Pagination/virtualization exists where dataset may grow
[ ] Empty state exists
[ ] Loading state exists
[ ] Error state exists
[ ] Permission-denied state is clear
[ ] Success feedback exists
[ ] Responsive layout works
[ ] Keyboard navigation works
[ ] Labels are readable
[ ] Icons are consistent
[ ] Tooltips exist for icon-only controls
```

---

# 5. Search Standard

Search bugs are considered **module-blocking defects**.

## 5.1 Case Insensitivity

Search must normally be case-insensitive.

If database contains:

```text
APPLE JUICE
Apple Juice
apple juice
```

Searches such as:

```text
apple
APPLE
Apple
aPpLe
```

must return the expected records.

Do not use case-sensitive equality for ordinary text search.

Preferred behavior:

```text
normalized / case-insensitive search
```

Examples for PostgreSQL:

- `ILIKE`
- normalized indexed column
- trigram/full-text search where needed

---

# 6. Search Whitespace

User input:

```text
"   apple juice   "
```

must behave like:

```text
"apple juice"
```

Trim leading/trailing whitespace.

Repeated internal whitespace should be handled sensibly where appropriate.

---

# 7. Search by Relevant Fields

Do not make users know exactly which field the system searches.

Depending on entity:

## Party search

Search by:

- name
- code
- phone
- GSTIN
- alias
- contact person where appropriate

## Item search

Search by:

- item name
- SKU
- barcode
- alias
- brand
- category
- manufacturer
- salt/generic when enabled

## Invoice search

Search by:

- invoice number
- party
- mobile
- reference number
- date/filter

---

# 8. Search No-Result State

Do not show a blank table.

Show:

```text
No results found for "xyz"
```

and where appropriate:

```text
Clear search
```

Do not show an "Add new" action if the user lacks create permission.

---

# 9. Search Performance

Search must not:

- fetch the complete 100k item list into the browser;
- send a request on every keystroke without debounce;
- freeze the UI;
- lose keyboard focus after results return.

Recommended:

```text
debounce ~200–300ms
server-side search
indexed query
result limit
keyboard selection
```

---

# 10. Search Acceptance Tests

Every searchable screen must test:

```text
[ ] lowercase query finds uppercase value
[ ] uppercase query finds lowercase value
[ ] mixed-case query works
[ ] leading/trailing spaces work
[ ] partial query works
[ ] exact query works
[ ] no-result message works
[ ] clear search restores list
[ ] search survives pagination/filter interaction where intended
[ ] no duplicate results
[ ] special characters do not crash query
```

---

# 11. Buttons and Icons Standard

Every visible action must be inspected.

Rules:

- one icon only unless design intentionally uses more;
- one label only;
- no duplicate `+`;
- no duplicate save icons;
- no overlapping icons;
- no clipped icon;
- icon meaning must match action;
- destructive actions use distinct treatment;
- icon-only buttons require tooltip/accessible label;
- disabled buttons visibly look disabled;
- loading button prevents accidental double-submit.

Incorrect:

```text
++ Add Party
```

Correct:

```text
+ Add Party
```

or a single Add icon with label.

---

# 12. Duplicate Action Detection

Before completion inspect DOM/screen for accidental duplicates:

```text
[ ] Add
[ ] Edit
[ ] Delete
[ ] Save
[ ] Cancel
[ ] Export
[ ] Print
[ ] Refresh
```

If the same primary action appears in multiple locations, confirm it is intentional.

---

# 13. Double-Submission Protection

Buttons that create financial/business data must protect against:

```text
double-click
Enter + click
network retry
browser retry
slow request
```

Use:

- disabled loading state;
- idempotency key where appropriate;
- backend duplicate protection.

Never rely only on button disabling for financial posting.

---

# 14. Forms Standard

Every form must support:

```text
[ ] Correct labels
[ ] Required marker
[ ] Sensible tab order
[ ] Initial/default values
[ ] Input constraints
[ ] Inline validation
[ ] Backend validation
[ ] Error summary when needed
[ ] Save
[ ] Cancel
[ ] Dirty-state handling where important
[ ] Duplicate prevention
[ ] Permission handling
```

---

# 15. Required Fields

Required fields must be:

- visually identifiable;
- validated before submission;
- validated by backend;
- accompanied by useful message.

Bad:

```text
Invalid input
```

Better:

```text
Customer name is required.
```

---

# 16. Field Normalization

Apply appropriate normalization.

Examples:

```text
Name:
trim external whitespace

GSTIN:
trim + uppercase

Email:
trim + lowercase domain/normalized handling

Phone:
strip nonessential formatting according to country policy

SKU:
trim; case behavior defined centrally

Barcode:
trim, preserve valid content
```

Do not silently alter legally meaningful values.

---

# 17. Duplicate Master Prevention

Before creating:

- party
- item
- barcode
- tax code
- ledger
- document series

check business uniqueness.

Examples:

```text
SKU unique inside defined company scope
Barcode unique inside defined scope
GSTIN duplicate warning
Party code unique
```

Backend database constraint must support UI validation where possible.

---

# 18. Dropdown / Select Standard

Dropdowns must:

- have clear placeholder;
- support search when list can grow;
- not contain duplicate values;
- sort logically;
- show inactive records only when required;
- preserve selected value during editing;
- handle "no options" clearly.

Never load huge item/party datasets into standard HTML selects.

---

# 19. Date Fields

Verify:

```text
[ ] correct default date
[ ] business date vs technical date
[ ] financial year restriction
[ ] future/backdate rules
[ ] timezone correctness
[ ] date format consistency
```

---

# 20. Numeric Fields

Use appropriate numeric controls.

Test:

```text
0
negative
decimal
very large
empty
invalid characters
leading zero
```

Money uses Decimal backend.

---

# 21. Tables / Data Grids

All ERP tables must be production-ready.

Required where relevant:

```text
search
filter
sort
pagination
column alignment
sticky headers
row actions
loading state
empty state
error state
responsive behavior
keyboard navigation
```

---

# 22. Table Alignment

Recommended:

- text → left
- dates → consistent
- quantities → right
- money → right
- status → consistent
- actions → predictable location

Do not randomly change layout between modules.

---

# 23. Table Overflow

Test:

```text
long customer name
long product name
large amount
long invoice number
Hindi text
small laptop width
```

No action button should become inaccessible.

---

# 24. Pagination

Verify:

```text
[ ] next
[ ] previous
[ ] first/last where provided
[ ] page size
[ ] result count
[ ] search + pagination
[ ] filters + pagination
[ ] deletion on final page
[ ] refresh
```

---

# 25. Sorting

Sorting should correctly handle:

- uppercase/lowercase;
- numbers;
- dates;
- blank values.

Do not perform lexical sort on numeric fields.

---

# 26. Filter Standard

Filters must have:

- label;
- clear/reset option;
- active-state indication;
- predictable persistence.

Test combinations of multiple filters.

---

# 27. CRUD Completeness

For each entity, verify all applicable operations.

```text
Create
Read
Update
Archive/Delete
Restore if supported
Search
Filter
Export
```

Do not expose Delete when business rules allow only Archive.

---

# 28. Create Flow

Test:

```text
valid creation
minimum data
all optional data
duplicate data
invalid data
server error
permission denied
double-submit
```

---

# 29. Edit Flow

Verify:

- existing values load correctly;
- unchanged save works appropriately;
- validation works;
- user cannot edit protected fields;
- optimistic concurrency conflicts are handled;
- updated timestamp/user is correct;
- audit captures important changes.

---

# 30. Delete / Archive Flow

Before destructive action:

- confirmation;
- item/entity name;
- consequence;
- correct permission.

Referenced business masters should normally be archived, not deleted.

---

# 31. Empty States

Every empty list must explain itself.

Examples:

```text
No customers yet.
Add your first customer.
```

Only show CTA if permitted.

Never leave a completely blank white area.

---

# 32. Loading States

Avoid:

- layout jumping;
- frozen screen;
- duplicate loading overlays;
- spinner forever.

Use skeleton/progress where useful.

---

# 33. Error States

User-facing errors must be understandable.

Bad:

```text
500 SQLAlchemy IntegrityError ...
```

Correct:

```text
This SKU already exists.
```

Technical details belong in logs.

---

# 34. Toast / Notification Rules

Never show success toast before backend success.

Avoid duplicate toasts such as:

```text
Saved successfully
Saved successfully
```

One operation → one appropriate notification.

---

# 35. Confirmation Dialog Rules

Require confirmation for:

- posted invoice cancellation;
- stock adjustment;
- user disabling;
- period close/reopen;
- backup restore;
- destructive master archive where consequential.

Do not ask confirmation for every harmless action.

---

# 36. Keyboard-First ERP Standard

Wholesale ERP users often work faster with keyboard.

Test:

```text
Tab
Shift+Tab
Enter
Escape
Arrow keys
Search focus
Save shortcut where defined
Print shortcut where defined
```

---

# 37. Enter Key Rules

Pressing Enter inside a search field must not accidentally submit an entire financial document.

Form submission behavior must be deliberate.

---

# 38. Focus Management

After:

- adding item to invoice;
- saving line;
- clearing search;
- opening dialog;
- closing dialog;

focus should move to the logical next field.

---

# 39. Modal Standard

Check:

```text
[ ] title
[ ] close
[ ] Escape
[ ] focus trap
[ ] background interaction blocked
[ ] no nested modal chaos
[ ] action buttons visible
[ ] responsive height
```

---

# 40. Responsive Standard

Test minimum:

```text
1920×1080 desktop
1366×768 laptop
tablet-sized width
mobile width where module supports mobile
```

Desktop-first ERP pages may use horizontal scrolling when genuinely needed, but controls must remain accessible.

---

# 41. Mobile / Small Screen

If screen is intended for mobile:

- no microscopic buttons;
- no clipped forms;
- bottom CTA remains reachable;
- tables transform appropriately;
- modal fits;
- keyboard does not hide required action.

---

# 42. Language / Localization

Every completed module must check:

```text
English
Hindi
```

where translation exists.

Verify:

- no raw translation keys;
- no overflow;
- no mixed untranslated label where avoidable;
- numbers/dates remain correct;
- icons stay aligned.

---

# 43. Terminology Consistency

One concept must use one label.

Do not alternate randomly between:

```text
Customer / Client / Party
Warehouse / Godown / Store
Invoice / Bill
```

Use approved terminology per context.

---

# 44. Navigation

Check:

```text
[ ] module appears in correct menu
[ ] active item highlighted
[ ] browser back behaves reasonably
[ ] direct URL loads
[ ] permission-restricted menu hidden
[ ] unauthorized direct URL blocked
[ ] breadcrumbs correct if used
```

---

# 45. Dashboard Cards

If a module includes metrics:

- value must be sourced correctly;
- zero state must display `0`, not blank;
- loading is clear;
- failed query does not show old value as fresh;
- currency/unit displayed.

---

# 46. Refresh Behavior

Browser refresh must not:

- corrupt data;
- submit again;
- log user out unexpectedly;
- lose server-persisted data;
- duplicate transaction.

Draft persistence behavior must follow module requirements.

---

# 47. Browser Back / Forward

Ensure posted operations are not re-triggered by navigation.

---

# 48. Permissions QA

For every restricted action:

```text
UI hidden/disabled appropriately
AND
API rejects unauthorized call
```

Test:

- correct role;
- wrong role;
- wrong company;
- wrong branch;
- forged ID;
- inactive user.

---

# 49. Audit QA

For important actions verify:

```text
who
what
when
entity
before
after
reason where required
```

No audit duplicate entries for one logical action unless intentionally separated.

---

# 50. Company Isolation

Every module must test:

```text
Company A record
Company B user
→ cannot read
→ cannot edit
→ cannot export
→ cannot infer via search
```

---

# 51. Branch / Godown Isolation

Where applicable test:

```text
Branch A user
cannot access Branch B transaction
```

and:

```text
Godown-limited user
cannot move/read restricted stock
```

according to permissions.

---

# 52. Business Rule Validation

Frontend validation improves UX.

Backend validation is mandatory.

Never trust:

```text
disabled fields
hidden buttons
frontend-only min/max
```

---

# 53. Financial Module Gate

If module affects accounts:

```text
[ ] voucher created
[ ] debit == credit
[ ] cancellation reversal correct
[ ] ledger updates
[ ] outstanding updates
[ ] financial year correct
[ ] locked period respected
[ ] audit exists
```

---

# 54. Inventory Module Gate

If module affects stock:

```text
[ ] stock movement created
[ ] correct godown
[ ] correct item
[ ] correct batch
[ ] correct quantity sign
[ ] projection updates
[ ] cancellation reverses
[ ] negative-stock rule works
[ ] concurrent posting tested
```

---

# 55. GST / Tax Gate

If module affects GST:

```text
[ ] tax class resolved
[ ] intra-state calculation
[ ] inter-state calculation
[ ] tax snapshot stored
[ ] rounding correct
[ ] reverse/cancel behavior correct
```

Do not claim legal compliance solely based on functional testing.

---

# 56. Printing Gate

Where module prints documents:

```text
[ ] print preview
[ ] A4/thermal where applicable
[ ] long party name
[ ] many invoice lines
[ ] page break
[ ] totals
[ ] tax
[ ] logo
[ ] reprint
[ ] printer failure does not undo posted transaction
```

---

# 57. Import Gate

If module supports import:

```text
[ ] valid file
[ ] wrong extension
[ ] missing column
[ ] malformed row
[ ] duplicate row
[ ] case variations
[ ] whitespace
[ ] dry run
[ ] commit
[ ] error report
[ ] no partial corruption
```

---

# 58. Export Gate

Check:

```text
CSV
XLSX
PDF
```

where supported.

Verify filters are respected.

---

# 59. Offline Gate

For local-first modules:

1. start system;
2. disconnect internet;
3. keep LAN active;
4. perform business workflow;
5. save/post;
6. print;
7. view record/report;
8. restore internet;
9. confirm queued integrations resume.

---

# 60. Restart Gate

Test:

```text
backend restart
worker restart
browser refresh
Windows service restart when applicable
```

No posted transaction should disappear.

---

# 61. Browser Console Gate

Before handoff:

```text
[ ] no repeating JS errors
[ ] no failed API loop
[ ] no React key warnings
[ ] no hydration/runtime warning
[ ] no leaking secrets
```

Warnings that are understood and accepted must be documented.

---

# 62. Backend Log Gate

Before handoff:

```text
[ ] no unhandled exception
[ ] no repeated DB error
[ ] no migration error
[ ] no authorization bypass warning
[ ] no background-job crash loop
```

---

# 63. API Gate

For every new endpoint:

```text
[ ] authentication
[ ] authorization
[ ] company scope
[ ] validation
[ ] stable response
[ ] stable error
[ ] pagination where applicable
[ ] tests
```

---

# 64. Accessibility Baseline

At minimum:

- proper button semantics;
- label inputs;
- keyboard access;
- visible focus;
- reasonable contrast;
- tooltips/aria-label for icon-only buttons.

---

# 65. Visual Consistency

Check:

```text
spacing
font sizes
button height
input height
border radius
icons
table style
status badges
dialog style
page padding
```

A new module should look like part of the same ERP.

---

# 66. "Small Defect Sweep"

Before declaring module complete, Antigravity must perform one explicit pass looking only for small polish defects.

Inspect:

```text
typos
duplicate icon
duplicate button
wrong icon
misaligned text
case-sensitive search
missing search
missing filter
broken sort
bad spacing
overflow
empty state
loading state
wrong tooltip
inconsistent capitalization
incorrect disabled state
duplicate toast
button not clickable
wrong cursor
wrong tab order
unnecessary scroll
console warning
```

This is a mandatory separate step, not an optional visual review.

---

# 67. Search Bar Presence Rule

A list/search screen should include search when:

- record count can exceed ~20;
- users routinely locate specific records;
- item/party/invoice lists are shown;
- list forms part of everyday ERP operations.

Examples where search is expected:

```text
Users
Roles
Parties
Items
Invoices
Purchase Bills
Godowns
Ledgers
Vouchers
Stock
Orders
Returns
```

Tiny fixed configuration lists may not require it.

---

# 68. Filter Presence Rule

Filters are expected for operational lists with useful dimensions.

Example invoice filters:

```text
date
party
status
branch
salesperson
payment status
```

Example stock filters:

```text
godown
category
brand
batch
expiry status
availability
```

---

# 69. Data Refresh

After create/update/archive:

- affected query invalidated;
- table reflects change;
- stale row does not remain;
- counts/cards update where necessary.

Avoid requiring manual browser refresh after ordinary CRUD.

---

# 70. Server Handoff Requirement

After module quality gate passes, Antigravity must start the development environment for the user.

At minimum confirm:

```text
Backend: RUNNING
Frontend: RUNNING
PostgreSQL: RUNNING
Migrations: CURRENT
```

When applicable:

```text
Worker: RUNNING
Print bridge: RUNNING
```

---

# 71. Required URLs at Handoff

Antigravity must provide exact local URLs.

Example:

```text
Frontend:
http://localhost:5173

Backend:
http://localhost:8000

API Docs:
http://localhost:8000/docs

Health:
http://localhost:8000/health
```

Use actual ports configured in the project.

---

# 72. Required Local Test Credentials

If module testing requires authentication, Antigravity must provide local-development credentials.

Example:

```text
LOCAL DEVELOPMENT ONLY

Admin:
Username: admin
Password: <documented local password>

Billing Operator:
Username: billing_test
Password: <documented local password>

Accountant:
Username: accountant_test
Password: <documented local password>
```

Rules:

- clearly label credentials **LOCAL DEVELOPMENT ONLY**;
- never reuse production passwords;
- never use customer credentials;
- never use unrelated project credentials;
- seed only roles needed for testing;
- store seed/documentation appropriately;
- never commit secret production credentials.

---

# 73. Credential Persistence

Development credentials must be documented in a stable local development location such as:

```text
docs/DEVELOPMENT_SETUP.md
```

or a dedicated:

```text
docs/LOCAL_TEST_ACCOUNTS.md
```

Do not make the user ask repeatedly for the current test login.

---

# 74. Module Completion Report

Antigravity must provide this exact information after each completed module:

```text
MODULE:
STATUS:

IMPLEMENTED:
- ...

FIXED DURING QA:
- ...

AUTOMATED TESTS:
- backend:
- frontend:
- E2E:

QUALITY GATE:
- search:
- forms:
- tables:
- icons/buttons:
- responsive:
- keyboard:
- permissions:
- audit:
- offline:
- regression:

SERVER STATUS:
- PostgreSQL:
- Backend:
- Frontend:
- Worker:

URLS:
- Frontend:
- Backend:
- API docs:

LOCAL TEST CREDENTIALS:
- Admin:
- Module-specific role:

MANUAL TESTING:
1. ...
   Expected: ...

KNOWN LIMITATIONS:
- none
or
- ...
```

---

# 75. Manual Testing Rule

After Antigravity supplies the completion report, the user manually tests the running software.

Antigravity must NOT begin the next module merely because automated tests pass.

Wait for:

```text
User confirms module
```

or:

```text
User explicitly asks to continue anyway
```

---

# 76. Manual Testing Checklist Structure

Every checklist must include:

## A. Happy Path

Normal working flow.

## B. Search / Filters

Case-insensitive, partial search, whitespace, clear filter.

## C. Validation

Required fields, invalid formats, duplicates.

## D. Permissions

Allowed role and blocked role.

## E. Company / Branch Isolation

Where relevant.

## F. UI Polish

Icons, buttons, alignment, empty/loading states.

## G. Keyboard

Tab/Enter/Escape/shortcuts.

## H. Language

English/Hindi where supported.

## I. Responsive

Desktop/laptop/mobile where relevant.

## J. Audit

Changes appear correctly.

## K. Offline

If module is local-first.

## L. Restart

Reload/restart behavior.

## M. Module-Specific Critical Flow

Accounting, stock, tax, etc.

---

# 77. Example Manual Test — Party Master

```text
TEST 1 — Create customer

Steps:
1. Login as admin.
2. Open Party Master.
3. Click Add Party.
4. Enter valid customer information.
5. Save.

Expected:
- exactly one Add icon/button;
- record saves once;
- success message shown once;
- customer appears in list without refresh;
- audit record exists.
```

```text
TEST 2 — Case-insensitive search

Steps:
1. Create "RASHIDI TRADERS".
2. Search "rashidi".
3. Search "RASHIDI".
4. Search "RaShIdI".

Expected:
- same customer appears for all three searches.
```

```text
TEST 3 — Duplicate protection

Steps:
1. Attempt to create duplicate party code/GSTIN according to configured rule.

Expected:
- useful warning/error;
- duplicate is not silently created.
```

---

# 78. Example Manual Test — Item Master

```text
TEST — Search

Create:
"PARACETAMOL 500MG"

Search:
paracetamol
PARACETAMOL
Para
500mg

Expected:
record found according to supported search fields.
```

Check:

```text
Add button does not show ++
Barcode search works
Category filter works
Inactive item behavior correct
Cost visibility follows permission
```

---

# 79. Example Manual Test — Invoice

Check:

```text
item search case-insensitive
party search case-insensitive
Enter does not accidentally post
double-click Save does not duplicate
stock updates once
accounting voucher posts once
GST correct
print works
reprint works
cancel reverses
audit exists
```

---

# 80. Regression Rule

Before module completion, rerun critical earlier workflows affected by changes.

Example:

If Sales module modifies:

```text
Party
Item
Stock
Accounting
Tax
```

rerun representative tests for all five.

Never assume "old module already passed" if shared code changed.

---

# 81. Severity

## Blocker

Cannot hand off:

- data corruption
- security bypass
- wrong accounting
- wrong stock
- duplicate posting
- cross-company leak
- server crash
- migration failure

## High

Must fix before handoff:

- case-sensitive normal search
- duplicate add/save
- broken validation
- inaccessible actions
- wrong permission
- broken print
- unusable responsive screen

## Medium

Normally fix before handoff:

- alignment
- inconsistent label
- missing tooltip
- minor overflow
- small spacing issue

## Low

May be documented only if deliberately deferred:

- nonessential animation
- cosmetic refinement with no workflow impact

Goal: deliver modules with **zero known Blocker/High defects**.

---

# 82. No "Known Small Fixes" Handoff

Antigravity should not say:

```text
Module is complete, but:
- search still needs fixing
- icon appears twice
- mobile layout needs polishing
```

Those are part of module completion.

Fix them before handoff unless explicitly blocked by an external dependency.

---

# 83. Definition of Done

A module can be marked:

```text
READY FOR USER MANUAL TESTING
```

only when all applicable checks are complete.

It becomes:

```text
VERIFIED
```

only after the user completes manual verification or explicitly accepts it.

---

# 84. Final Completion Gate

Before handing a module to the user, Antigravity must truthfully answer YES to all applicable questions:

```text
[ ] Does search behave case-insensitively?
[ ] Does search trim whitespace?
[ ] Is search available wherever operationally necessary?
[ ] Are useful filters present?
[ ] Are add/edit/delete/archive actions correct?
[ ] Is there exactly one intended icon per action?
[ ] Are there no accidental `++`, duplicate buttons or duplicate toasts?
[ ] Are forms validated frontend + backend?
[ ] Are duplicates prevented?
[ ] Do tables handle large/long values?
[ ] Are empty/loading/error states complete?
[ ] Does keyboard navigation work?
[ ] Does responsive layout work?
[ ] Do permissions work server-side?
[ ] Is company/branch isolation tested?
[ ] Is audit correct?
[ ] Are accounting invariants correct if applicable?
[ ] Are stock invariants correct if applicable?
[ ] Does printing work if applicable?
[ ] Does local operation work without internet if applicable?
[ ] Do existing modules still work?
[ ] Are automated tests passing?
[ ] Are migrations current?
[ ] Is PostgreSQL running?
[ ] Is backend running?
[ ] Is frontend running?
[ ] Are exact URLs provided?
[ ] Are LOCAL DEVELOPMENT ONLY test credentials provided?
[ ] Is the manual checklist provided?
```

If any required answer is NO:

```text
MODULE IS NOT COMPLETE.
```

---

# 85. Permanent Engineering Instruction

For every EVOLIX module:

> Do not optimize merely for "feature exists." Optimize for "feature is ready for a real billing/accounting operator to use without discovering obvious quality defects."

The implementation is responsible for finding and fixing small UX, search, CRUD, consistency and interaction defects **before** presenting the module for manual user verification.
