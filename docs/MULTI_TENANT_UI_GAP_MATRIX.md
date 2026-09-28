# Multi-Tenant UI Gap Matrix

| Screen | Exists? | Current State | Required State | Priority |
|---|---|---|---|---|
| Platform Login | NO | Mock generic login only. | Dedicated Super Admin login portal at `/platform/login`. | CRITICAL |
| Platform Dashboard | NO | None. | High-level metrics for SaaS owner (tenant count, MRR, system health). | CRITICAL |
| Tenant List | NO | None. | Table of all tenants with status and quick actions. | CRITICAL |
| Create Tenant | NO | None. | Multi-step wizard: Business info, Owner info, Plan selection. | CRITICAL |
| Tenant Detail | NO | None. | Detailed view of a tenant, linked users, plan status, health. | HIGH |
| Tenant Users | NO | None. | List of users *globally* across the platform (for support). | HIGH |
| Plans | NO | None. | CRUD interface for defining SaaS subscription tiers. | HIGH |
| Subscriptions | NO | None. | Billing state management and history per tenant. | HIGH |
| Feature Entitlements | NO | None. | Toggles to override or apply specific feature access for a tenant. | HIGH |
| Platform Audit | NO | None. | System-wide event log (creation, suspension, support access). | HIGH |
| Support Access | NO | None. | UI to request and initiate impersonation/support session. | MEDIUM |
| Tenant Login | NO | Hardcoded mock. | Real login that resolves Organization, Branch, Role, and Session. | CRITICAL |
| Tenant Dashboard | NO | None. | Tenant-scoped metrics, completely isolated from other tenants. | CRITICAL |
| Tenant Users & Roles | NO | None. | Tenant-level UI to manage their employees and custom roles. | CRITICAL |
| Tenant Settings | NO | None. | Currency, timezone, timezone rules, transaction numbering formats. | HIGH |
| Branding Settings | NO | None. | Upload logos, configure invoice footers, select colors. | MEDIUM |
| Branch Management | NO | None. | Create/manage branches under the tenant organization. | HIGH |
| Organization Settings | NO | None. | Update legal name, GST, default addresses. | HIGH |
