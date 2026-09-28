# Multi-Tenant API Gap Matrix

| Required API | Exists? | Current Behavior | Required Behavior | Priority |
|---|---|---|---|---|
| Create Tenant | NO | N/A | Authenticated Super Admin creates Organization/Tenant record and provisions initial Owner. | CRITICAL |
| List Tenants | NO | N/A | Super Admin lists all tenants; results paginated. | CRITICAL |
| Get Tenant | NO | N/A | Super Admin retrieves full tenant details (plan, status, owner). | CRITICAL |
| Update Tenant | NO | N/A | Super Admin updates tenant attributes (name, status). | CRITICAL |
| Suspend Tenant | NO | N/A | Admin action blocks login and API access for all tenant users. | CRITICAL |
| Activate Tenant | NO | N/A | Reverses suspension. | CRITICAL |
| Create Owner | NO | N/A | Part of provisioning; assigns `OWNER` system role. | CRITICAL |
| Invite Owner | NO | N/A | Triggers email with secure registration link. | HIGH |
| Set Password | NO | N/A | Owner sets initial password and activates account. | HIGH |
| List Tenant Users | NO | N/A | Owner/Admin lists users *within* their tenant. | CRITICAL |
| Create Tenant User | NO | N/A | Owner/Admin invites/creates employee *within* their tenant. | CRITICAL |
| Assign Role | NO | N/A | Owner/Admin assigns roles to their users. | CRITICAL |
| Manage Permissions | NO | N/A | Assign granular permissions to roles. | HIGH |
| Manage Plans | NO | N/A | Super Admin defines platform pricing plans. | HIGH |
| Manage Subscription | NO | N/A | Links tenant to plan, handles billing states. | HIGH |
| Manage Feature Entitlements | NO | N/A | Granularly toggles features (e.g., POS, Advanced Reports) per tenant. | HIGH |
| Support Access | NO | N/A | Temporarily grants Super Admin secure access to a tenant. | MEDIUM |
| Platform Audit | NO | N/A | Logs platform-level actions (Create Tenant, Change Plan). | HIGH |
| Tenant Settings | NO | N/A | Configures timezone, currency, inventory rules per tenant. | HIGH |
| Branding | NO | N/A | Configures logos, invoice templates, and colors. | MEDIUM |
