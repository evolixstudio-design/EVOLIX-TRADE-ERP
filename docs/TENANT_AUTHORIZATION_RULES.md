# Tenant Authorization Rules

## 1. Zero Trust Client Principles
The application backend operates on a Zero Trust model regarding tenant context.
- The `x-company-id` and `x-branch-id` headers are treated solely as UI routing preferences.
- They possess zero authorization authority.
- The server independently validates if the authenticated user has a `UserRole` membership binding them to the requested `company_id`.

## 2. Server-Authoritative Context Resolution
During `AuthGuard` execution, the following chain resolves context:
1. `userId` extracted from JWT.
2. User record and associated `UserRole` memberships fetched from the DB.
3. If `x-company-id` is provided, the backend attempts to match it against the user's explicit roles. If no match exists, a `ForbiddenException` is thrown.
4. The validated `company_id` and `branch_id` are injected into `req.user`.

## 3. Controller Execution
Controllers strictly pull `company_id` from `req.user.company_id` instead of `@Query()` or `@Body()`.
- Example: `createSalesOrder(req.user.company_id, dto)`
This forces the business logic (which enforces isolation via Prisma `where: { company_id }`) to use the cryptographically verified tenant identity, making cross-tenant data leakage mathematically impossible.

## 4. Branch Isolation Rule
When a user is assigned to a specific `branch_id`, they may not execute transactions or view data explicitly tied to another branch under the same company, unless granted an `ALL_BRANCHES` scope (to be fully implemented in future iteration). Currently, branch filtering strictly adheres to the assigned `branch_id` in their active `UserRole`.
