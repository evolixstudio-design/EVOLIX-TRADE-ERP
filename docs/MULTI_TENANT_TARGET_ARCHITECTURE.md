# Multi-Tenant Target Architecture

## 1. Plane Separation
The system must be split into two explicit execution planes:

### A. Platform Control Plane (Super Admin)
**Purpose**: Manage the SaaS platform, tenants, billing, and system health.
**Data**:
- `Tenant` (replaces or wraps Organization)
- `Subscription` & `Plan`
- `Feature` & `FeatureEntitlement`
- `PlatformUser` (Super Admins)
- `PlatformAuditLog`
**Routing**: `/api/v1/platform/*`
**Authorization**: `PlatformGuard` ensuring the user has a `SUPER_ADMIN` system role.

### B. Tenant ERP Plane (Customer Operations)
**Purpose**: Execute daily business transactions (Sales, Purchase, Accounting) for a single customer.
**Data**:
- `Company` & `Branch`
- `Item`, `Customer`, `Supplier`
- `Voucher`, `StockMovement`, `SalesInvoice`
**Routing**: `/api/v1/erp/*`
**Authorization**: `TenantGuard` ensuring the user belongs to the requested Tenant.

## 2. Identity & Context Resolution Chain
The current vulnerability where the frontend declares its `company_id` must be eliminated.
The target flow must be:

1. **Authentication**: User logs in and receives a cryptographically signed JWT.
2. **Identity Extraction**: API request sends JWT. `AuthGuard` extracts `user_id`.
3. **Membership Resolution**: Backend looks up `user_roles` for this `user_id`.
4. **Context Injection**: The backend securely injects the `company_id` (Tenant) and `branch_id` into the Request object based on the user's verified database membership.
5. **Role Verification**: `PermissionGuard` checks if the user's role has the required permission (e.g., `sales.invoice.create`).
6. **Data Access**: Controllers extract the `company_id` *only* from the secure Request context (never from the frontend body/headers) and pass it to the Services.
7. **Database Isolation**: Services inject this `company_id` into every Prisma query (`where: { company_id: ctx.companyId }`).

## 3. Subscription & Feature Gating
All ERP endpoints must implement a `SubscriptionGuard` that executes before the `PermissionGuard`.
- Checks if the Tenant's status is `ACTIVE` (not suspended, not expired).
- If the endpoint accesses a premium feature (e.g., POS, Intelligence), the guard checks the `FeatureEntitlement` table for the Tenant before allowing execution.

## 4. Multi-Tenant Database Strategy
While EVOLIX uses a single PostgreSQL database, data segregation is strictly enforced via the `company_id` foreign key on *every* transactional and master data table. The target architecture mandates Row-Level Security (RLS) policies at the PostgreSQL level in the future to act as a fail-safe, but relies heavily on the Application Context Injection (Step 2) in the short term.
