# Multi-Tenant Security Audit & Threat Model

## Threat 1: Organization/Tenant ID Spoofing (IDOR)
- **Severity**: CRITICAL
- **Evidence**: `src/common/guards/auth.guard.ts` lines 16-17 extract `x-company-id` and `x-branch-id` directly from the HTTP headers, trusting the frontend payload entirely.
- **Impact**: Any authenticated user can modify their HTTP headers (e.g., in Postman) to inject another tenant's `company_id`. Since the database queries in Posting Services filter by the `company_id` provided in the DTO (which is populated from this spoofed request context), a user can view or alter data across all tenants. This represents a complete breakdown of tenant isolation.

## Threat 2: Hardcoded/Mocked Authentication
- **Severity**: CRITICAL
- **Evidence**: `src/app.controller.ts` line 18 validates login using a hardcoded `admin` and `Evolix@2026` string. `src/common/guards/auth.guard.ts` expects a static `mock-session-id-` prefix rather than validating a cryptographically signed JWT.
- **Impact**: There is no real authentication mechanism. Any attacker can guess or spoof a "mock-session-id", bypassing auth globally.

## Threat 3: Lack of Platform Admin Authorization
- **Severity**: HIGH
- **Evidence**: No endpoints exist for Super Admin actions, and no `SUPER_ADMIN` system role distinguishes platform management from tenant management.
- **Impact**: If platform APIs were created, there's no infrastructure to ensure a regular tenant `OWNER` cannot escalate privileges to manage other tenants or platform subscriptions.

## Threat 4: Feature-Gating Bypass
- **Severity**: HIGH
- **Evidence**: `schema.prisma` contains no subscription or feature entitlement tables. Feature access relies completely on frontend routing (which is client-side).
- **Impact**: Even if a tenant is on a "Free" plan, they could call the API endpoints for "Enterprise" features directly because the backend does not enforce feature gating.

## Threat 5: Audit Log Isolation Vulnerability
- **Severity**: MEDIUM
- **Evidence**: The `audit_logs` table has a `company_id`. However, if a Super Admin suspends a tenant, where is that logged? Currently, there is no `platform_audit_logs` table.
- **Impact**: Platform administration events cannot be audited securely, making it impossible to trace internal support/admin abuse.

## Threat 6: Missing Tenant Suspension Enforcement
- **Severity**: HIGH
- **Evidence**: No middleware or Guard checks a tenant's `is_active` or subscription status on every request.
- **Impact**: If a tenant's subscription expires or they are suspended, they can still access their data and post transactions via the API.
