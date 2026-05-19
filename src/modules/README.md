# Backend Module Map

Current implemented modules:

- `access-request`: public access intake and admin review.
- `auth`: admin, company, and notary authentication/session/password flows.
- `email`: shared Resend email side effects.
- `health`: service health endpoint.
- `orders`: shared admin/company/notary order engine.
- `team`: team member data model and routes started from earlier company-team work.
- `user`: admin-managed title company and notary CRUD.

Planned module folders:

- `documents`
- `notifications`
- `notary-credentials`
- `communications`
- `analytics`
- `audit-log`
- `search`
- `reports`

Every implemented endpoint must be documented in Swagger.

Use `npm run create:api` when you add a new API module. That command scaffolds:

- `route`
- `controller`
- `service`
- Swagger docs fragment
- route registration
- OpenAPI registration

The generated Swagger fragment is automatically merged into `src/docs/openapi.ts`, so every scaffolded API starts with documentation on day one.
