---
paths:
  - "src/**/*.spec.ts"
---

> Verified: 2026-11-23 · Source: Angular 22 docs (angular.dev) and the project standards.

# Testing

- Vitest through `ng test`. Test behaviour users can see (rendered text, requests made), not internals.
- Mock HTTP with `provideHttpClientTesting`; never call a real API.
- Every service with logic has a spec: auth refresh, SSE parser, widget state machine.
- Components that submit forms: test the valid path and the validation error.
- Name tests after behaviour. No test depends on the wall clock, the network or test order.
- MUST add a regression test for every bug.
