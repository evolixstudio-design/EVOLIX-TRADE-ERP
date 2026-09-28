# Multi-Tenant Implementation Roadmap

**STATUS: PLAN ONLY. DO NOT IMPLEMENT.**

## Phase 1: Database Foundation & Platform Models
1. Introduce baseline Prisma migration (resolving the `db push` infrastructure debt).
2. Create `Tenant`, `Subscription`, `Plan`, `Feature`, `FeatureEntitlement` models in `schema.prisma`.
3. Create `PlatformUser` and `PlatformAuditLog` models.
4. Establish foreign key relationships aligning existing `Organization`/`Company` to the new `Tenant` construct.
5. Create initial migrations.

## Phase 2: Authentication & Context Security
1. Remove the hardcoded mock login in `AuthController`.
2. Implement true JWT-based authentication using Passport or custom signing logic.
3. Rewrite `AuthGuard` to cryptographically verify the JWT instead of trusting arbitrary frontend headers (`x-company-id`).
4. Implement a `ContextResolver` middleware to attach `company_id`, `branch_id`, and `role` to the Express/NestJS Request object based purely on database membership lookups.

## Phase 3: Platform Admin API & Tenant Provisioning
1. Build `PlatformController` for Super Admins.
2. Implement endpoints: Create Tenant, Suspend Tenant, View Tenants.
3. Build the backend provisioning pipeline: When a Tenant is created, auto-generate the initial Organization, Branch, and invite the Owner via email.
4. Implement `SubscriptionGuard` and `FeatureGuard` to enforce plan limitations dynamically.

## Phase 4: Frontend Separation
1. Scaffold a separate React application or distinct routing namespace (`/platform`) for Super Admin interfaces.
2. Build the Platform Dashboard, Tenant Management, and Plan Configuration UI.
3. Update the ERP frontend (`/erp`) to properly retrieve and handle real JWTs rather than spoofing headers.
4. Build the Tenant Setting pages and User Management UI for Tenant Owners.

## Phase 5: ERP Retrofitting & Isolation Audit
1. Refactor all existing ERP Services (Sales, Purchase, Inventory, Accounting) to pull `company_id` directly from the authenticated `Request` context context rather than accepting it blindly in DTOs.
2. Implement PostgreSQL Row-Level Security (RLS) policies as a secondary defense mechanism.
3. Write extensive multi-tenant integration tests proving that Tenant A cannot read/write Tenant B's data under any API condition.
