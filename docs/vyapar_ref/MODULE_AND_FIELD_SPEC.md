# Vyapar-style ERP Reference Specification

## Dashboard
KPI cards: Cash in Hand, Stock Value, Bank Account/Balance, Orders/Quotations when enabled, Open Cheques, Expenses, Other Income, Low Stock.
Charts: Sales graph and Expense graph with Daily/Weekly/Monthly filters.
Quick actions: Add Sale, Add Purchase, Payment In, Payment Out, Expense, Add Party, Add Item, Sale Order, Purchase Order, Estimate/Quotation where enabled.

## Parties
Fields: Party name, Party type, Mobile, Email, Billing address, Shipping address, Opening balance, Credit limit, Payment terms, Tax/VAT/GST details, Contact person, Notes.
Views: Ledger, Outstanding, Transaction history, Party statement, Party-wise P&L.

## Items / Inventory
Fields: Item name, Item code/SKU, Category, Unit, Sale price, Purchase price, Opening stock, Current stock, Minimum stock, Tax rate, HSN/SAC, Discount, Godown/location, Batch/serial data where enabled.
Views: Stock summary, Low stock, Stock detail, Item-wise P&L, Category-wise stock, Batch/serial tracking.

## Sales
Invoice fields: Invoice number, Invoice date, Customer, Billing address, Shipping address, Item rows, Quantity, Unit, Rate, Discount, Tax, Amount, Payment type, Due date, Notes, Reference/order number, Delivery information.

## Purchase & Expense
Purchase: Supplier, purchase invoice number, date, items, quantity, rate, discount, tax, payment status, due date, Godown.
Expense: Category, item, amount, payment mode, date, payee, notes, attachment/reference.

## Cash & Bank
Cash book, Bank accounts, Deposits, Withdrawals, Transfers, Reconciliation, Bank statement, Payment-in, Payment-out.

## Accounting
Ledger, Journal entries, Trial balance, Profit & Loss, Balance sheet, Receivables, Payables, Cash flow.

## Reports
Transaction: Sale, Purchase, Daybook, All Transactions, Profit & Loss, Bill-wise Profit, Sale Aging, Cash Flow, Trial Balance, Balance Sheet.
Party: Party Statement, All Parties, Party-wise P&L, Sale/Purchase by Party, Sale/Purchase by Party Group.
Item/Stock: Stock Summary, Low Stock, Stock Detail, Item Report by Party, Item-wise P&L, Category-wise Sales/Purchases, Batch, Serial, Discount.
Tax: GST/VAT summaries and applicable GST/tax reports.

## Settings
Company: Company name, contact details, address, logo, tax registration, financial year, currency.
Transactions: Invoice numbering, payment linking, credit/return settings, order settings.
Taxes: Tax rates, registration mode, GST/VAT configuration, HSN/SAC.
Print & Share: Invoice template, page size, logo/signature, terms, WhatsApp/email sharing, PDF/print.
Backup: Auto backup, manual backup, restore, export.
Users/Security: User roles, permissions, password/security and device/session controls.
Language: Language, date format, number format, currency.
