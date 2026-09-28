# Multi-Tenant Foundation Implementation Map

## 1. Current Ownership Hierarchy
Based on `schema.prisma`, the existing hierarchy is:
`Organization` -> `Company` -> `Branch`.
Users have an optional `organization_id`, and `UserRole` maps a user to a `Role` within a `company_id` and `branch_id`.
Transaction records (`SalesInvoice`, `StockMovement`, etc.) belong to `Company` and `Branch`.

## 2. Canonical Tenant/Business Entity Decision
**Decision: `Organization` IS the Tenant.**
We will NOT create a new `Tenant` table.
- A SaaS subscriber (Customer) is provisioned an `Organization`.
- The `Organization` serves as the absolute isolation boundary (Tenant).
- The `Organization` can have one or more `Company` records (Legal Entities).
- `Company` records have `Branch` records (Locations).
This preserves the multi-company capability of the ERP without introducing a redundant "Tenant" wrapper.

## 3. Organization vs Company Semantics
- **Organization**: The SaaS Account / Tenant boundary. Billing, Plans, and Subscriptions will eventually tie here.
- **Company**: A legal business entity within the Tenant. ERP transactions are scoped here.
- **Branch**: A physical or logical operating location within a Company.

## 4. Branch Semantics
Branches are strictly scoped to a Company. Users can be granted access to specific branches via `UserRole`.

## 5. User Membership Semantics
Users belong to an `Organization`. Their access to specific Companies and Branches is explicitly defined in `UserRole`.

## 6. Current Authorization Flow & Vulnerabilities
**Current Flow**: Frontend sends `x-company-id` and `x-branch-id` headers. `AuthGuard` reads these and injects them into the request. 
**Vulnerability**: This is a critical IDOR vulnerability. Any user can spoof these headers to access another organization's data.

## 7. Required Modifications
- **Models**: None strictly required for Phase 1 since `Organization` already exists. (Future phases will add Plans/Subscriptions to Organization).
- **APIs**: `AuthController` needs real JWT generation. `AuthGuard` needs to decode JWT, fetch `UserRole` from DB, and inject valid `company_id`/`branch_id` *only* if the user is authorized.
- **Frontend**: Replace mock login with actual API call. Store JWT securely. Pass JWT in `Authorization: Bearer` header. Stop relying on `x-company-id` as a security boundary.

## 8. Migration Requirements
- Establish a Prisma migration baseline safely to stop using `db push`.

## 9. Backward Compatibility
- Existing ERP logic (PostingServices) relies on `company_id` from the DTO. We will modify the controllers to securely inject the validated `company_id` from the `AuthGuard` context into the DTOs, ensuring the business logic remains completely unaware of the security wrapper changes.
