# Security Audit

## Current Local State

- Local admin compatibility identity exists through `/api/auth/me`.
- Tenant/workspace fields are stored on operational records.
- Integration credentials are read from environment variables and not exposed.
- External integration tests do not call providers without credentials.

## Production Gaps

- Real auth/session provider.
- Server-side RBAC enforcement for every endpoint.
- API rate limiting.
- CSRF/session hardening if cookie auth is used.
- Tenant isolation at database query level.
- Security tests.

