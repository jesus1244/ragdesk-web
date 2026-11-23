---
paths:
  - "**/*"
---

> Verified: 2026-11-23 · Source: Angular 22 docs (angular.dev) and the project standards.

# Git workflow

- One topic per commit with a conventional prefix (`feat`, `fix`, `test`, `docs`, `chore`, `ci`, `refactor`).
- A feature and its tests go in the same commit. Never commit code that fails lint, format or tests.
- Before every commit: `npx prettier --check "src/**/*.{ts,html,css}" && npx ng lint && npx ng test --watch=false`.
- Never commit secrets or `.env` files. Do not rewrite published history.
