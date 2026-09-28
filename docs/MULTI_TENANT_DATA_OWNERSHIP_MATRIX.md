# Multi-Tenant Data Ownership Matrix

| ENTITY | OWNER | TENANT SCOPED? | BRANCH SCOPED? | PLATFORM SCOPED? | SOURCE OF TRUTH | NOTES |
|---|---|---|---|---|---|---|
| User | User / Platform | YES (via Membership) | NO | YES | `users` | A user could technically belong to multiple tenants, but auth/roles are tied to `user_roles`. |
| Membership | Tenant / Org | YES | NO | NO | `user_roles` | Ties `user_id` to `company_id`. No explicit Tenant model, relies on Company/Org. |
| Role | Tenant / Org | YES | NO | NO | `roles` | `organization_id` nullable (system roles could be platform). |
| Permission | Platform | NO | NO | YES | `permissions` | Hardcoded application-level permissions. |
| Organization | Platform | YES | NO | YES | `organizations` | Represents the top-level Tenant identity. |
| Branch | Company | YES | YES | NO | `branches` | Represents locations under a Company. |
| Customer | Company | YES | NO | NO | `parties` | `company_id` required. Scoped to Company. |
| Supplier | Company | YES | NO | NO | `parties` | `company_id` required. Scoped to Company. |
| Item | Company | YES | NO | NO | `items` | `company_id` required. Scoped to Company. |
| Warehouse | Branch | YES | YES | NO | `godowns` | `branch_id` required. Scoped to Branch. |
| Sales Order | Company | YES | YES | NO | `sales_orders` | Both `company_id` and `branch_id` required. |
| Invoice | Company | YES | YES | NO | `sales_invoices` | Both `company_id` and `branch_id` required. |
| Purchase Order | Company | YES | YES | NO | `purchase_orders` | Both `company_id` and `branch_id` required. |
| GRN | Company | YES | YES | NO | `goods_receipts` | Both `company_id` and `branch_id` required. |
| Purchase Invoice | Company | YES | YES | NO | `purchase_invoices`| Both `company_id` and `branch_id` required. |
| Stock Movement | Godown / Co | YES | YES | NO | `stock_movements`| Strict `company_id` and `godown_id` scope. |
| Voucher | Company | YES | YES | NO | `vouchers` | `company_id` and `branch_id` required. |
| Voucher Line | Company | YES | YES (via Voucher)| NO | `voucher_lines` | Inherits scope from parent Voucher. |
| Payment | Company | YES | YES | NO | `vouchers` (Receipt/Payment type) | Handled via Accounting Vouchers. |
| Audit Log | Company | YES | YES | NO | `audit_logs` | Scoped to `company_id`. No platform-level audit log exists. |
| Plan | Platform | NO | NO | YES | N/A | Missing from Schema. |
| Subscription | Tenant / Org | YES | NO | YES | N/A | Missing from Schema. |
| Feature | Platform | NO | NO | YES | N/A | Missing from Schema. |
| Feature Entitlement | Tenant / Org | YES | NO | YES | N/A | Missing from Schema. |
