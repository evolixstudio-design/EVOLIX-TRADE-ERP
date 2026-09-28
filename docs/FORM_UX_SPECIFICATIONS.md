# FORM UX SPECIFICATIONS

This document outlines the UX principles and functional behaviors for data entry forms in EVOLIX Trade. The UX philosophy is "Fast by Default, Deep on Demand."

## 1. KEYBOARD NAVIGATION
*   **Tab / Shift-Tab**: Standard forward/backward traversal.
*   **Enter**: Advance to the next logical field (behavior common in fast retail POS).
*   **Alt+S / Ctrl+S**: Save document.
*   **Alt+N / Ctrl+N**: Save & New (immediately opens a blank form).
*   **Alt+P / Ctrl+P**: Save & Print.
*   **Esc**: Close modal or return to list view (with unsaved changes prompt).

## 2. AUTOCOMPLETE & REFERENCE FIELDS
*   **Typeahead Search**: All `reference` fields (e.g., Customer, Item) must support fuzzy text search on name or code.
*   **Inline Creation (Quick Add)**: If a searched item/customer does not exist, a `+ Add New` button appears inline if the user has `.create` permissions. Opens a minimal slide-out drawer, saving returns the new ID to the field.
*   **Rich Results**: Item dropdowns should show `[SKU] Name - Stock Qty - MRP` to assist the clerk.

## 3. MASTER-DETAIL DATA ENTRY (Grid / Line Items)
*   **Continuous Entry**: In Sales/Purchase invoices, hitting `Enter` on the last column (e.g., Line Total) automatically creates a new row and focuses the first field (Item).
*   **Calculated Fields**:
    *   `quantity * rate = taxable_value`
    *   `taxable_value - discount + tax_amount = line_total`
    *   These calculations occur instantly on the client side (derived). The server validates them independently.
*   **Row Deletion**: A quick 'Trash' icon or `Ctrl+Del` shortcut to remove a row.

## 4. RESPONSIVE / ADAPTIVE LAYOUT
*   **Desktop**: Full width grids, maximum data density. All columns visible in the Invoice Line grid.
*   **Tablet/Mobile**: 
    *   Grids collapse into card views.
    *   Columns like "Discount", "Tax", or "Description" are hidden behind an "Expand" or "More" toggle.
*   **Sticky Footers**: Total Amount, Tax Summary, and Save buttons remain stuck to the bottom of the screen to avoid scrolling in long invoices.

## 5. BILINGUAL / RTL SUPPORT
*   **Labels**: UI fields use i18n keys to seamlessly switch between English and Arabic.
*   **Layout Structure**: Forms respect CSS `dir="rtl"` completely. Data grids invert column order (right-to-left) to match Arabic reading standards natively.

## 6. FORM LIFECYCLE STATES
*   **Draft**: Fully editable.
*   **Posted**: Form converts to READ-ONLY. All inputs disabled. Action buttons change to `Print`, `Reverse`, `Cancel` (based on permissions).
*   **Reversed**: Form clearly displays a "REVERSED" watermark or alert banner linking to the reversal document (lineage).

## 7. AUDIT & LINEAGE VISUALIZATION
*   **Source Lineage**: If an invoice is generated from a Sales Order, a prominent banner states: "Generated from SO-1234". Clicking the link navigates to the SO.
*   **Audit Trail**: A "History" tab or button opens a timeline view of `Created By`, `Edited By`, `Posted By`, mapping directly to the `AuditLog` table.
