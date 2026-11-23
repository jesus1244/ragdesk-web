---
paths:
  - "src/widget/**/*"
  - "src/app/**/*.ts"
---

> Verified: 2026-11-23 · Source: Angular 22 docs (angular.dev) and the project standards.

# Embeddable widget and front-end security

- The widget renders model and document text with `textContent`, NEVER `innerHTML`, `insertAdjacentHTML` or
  `bypassSecurityTrust*`. Answers are untrusted data.
- The widget runs in a Shadow DOM so host-page CSS cannot break it and its CSS cannot leak out.
- The widget never receives secrets: only the public bot key. It sends no cookies (`credentials: 'omit'`).
- Do not log tokens, questions or answers to the console.
- Never put secrets in `environment` files or the bundle. Never use `eval` or `new Function`.
- Keep the widget a single dependency-free file; size budget 20 kB gzipped.
