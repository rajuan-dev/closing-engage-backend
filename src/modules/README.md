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

Every implemented endpoint must be documented in `src/docs/openapi.ts`.
