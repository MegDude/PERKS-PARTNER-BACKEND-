# Security Audit

## Current Evidence

- `GET /api/auth/me` and `PATCH /api/auth/me` exist.
- Tenant roles and permissions are seeded.
- Some UI pages check simple admin/editor roles.
- Many API mutations are reachable through generic entity endpoints.

## Security Gaps

| Area | Status | Gap |
| --- | --- | --- |
| Authentication | Partial | Demo/local auth pattern; provider not proven. |
| Authorization | Partial | UI checks exist; server-side RBAC incomplete. |
| Tenant isolation | Partial | `tenant_id` is present widely; enforcement inconsistent. |
| Rate limiting | Missing | Sensitive endpoints need limits. |
| Secrets | Partial | Env expected; provider runtime not proven. |
| Encryption | Missing proof | Needs production DB/storage strategy. |
| CSRF | Missing proof | Required for cookie/session mutation surfaces. |
| XSS | Partial | React escapes by default; input sanitization not comprehensive. |
| SQL injection | N/A/Planned | JSON store now; production DB needs parameterized queries. |
| Session handling | Partial | Needs real provider/session lifecycle. |

## Required Fixes

1. Add auth middleware to all mutation routes.
2. Add permission middleware per domain/action.
3. Disable or remove unsafe generic entity mutation in production.
4. Add rate limits to auth, checkout, promotions, AI, QR, and integrations.
5. Add audit for permission denials.
