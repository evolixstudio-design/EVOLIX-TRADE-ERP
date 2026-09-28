# Local Test Accounts

> **LOCAL DEVELOPMENT ONLY — NEVER USE IN PRODUCTION**

These accounts are seeded in the local development and test databases when running the migration/seed scripts. They must not be deployed to production.

| Username | Password | Role | Description |
| :--- | :--- | :--- | :--- |
| `admin` | `Evolix@2026` | Owner / Super Admin | Full system access |
| `company_admin` | `Evolix@2026` | Company Administrator | Can manage users and company settings |
| `accountant_test` | `Evolix@2026` | Accountant | *Template role*: Business permissions will be added when Accounting module is implemented. |
| `billing_test` | `Evolix@2026` | Billing Operator | *Template role*: Business permissions will be added when Sales/POS modules are implemented. |
| `warehouse_test` | `Evolix@2026` | Warehouse Staff | *Template role*: Business permissions will be added when Inventory/Dispatch modules are implemented. |
| `readonly_test` | `Evolix@2026` | Read Only | *Template role*: Business permissions will be added when Reporting modules are implemented. |
