---
inclusion: fileMatch
fileMatchPattern: "src/app/**/*.ts"
---

> Verified: 2026-11-23 · Source: Angular 22 docs (angular.dev) and the project standards.

# HTTP, errors and server state

- All requests go through `HttpClient` with the base `API_URL` (same origin, `/api/v1`). No hard-coded hosts.
- Every request shows a loading state and a failure message built with `errorMessage()`; never swallow errors.
- Types mirror the API schemas (`*.models.ts`). Never use `any`; use `unknown` and narrow.
- Lists are paginated like the API (`limit`, `offset`, `total`). Do not fetch everything.
- The auth interceptor refreshes a 401 once and shares the refresh between concurrent calls.
- Server-Sent Events are read with `fetch` and a stream reader (POST with a body); parse events in one place
  and test the parser with split chunks.
- Store only tokens in `localStorage`, always inside try/catch, never other personal data.
