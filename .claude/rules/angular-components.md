---
paths:
  - "src/**/*.ts"
  - "src/**/*.html"
---

> Verified: 2026-11-23 · Source: Angular 22 docs (angular.dev) and the project standards.

# Angular components and templates

- Standalone components only. Do NOT write `standalone: true` (it is the default) and do NOT set
  `ChangeDetectionStrategy.OnPush` (default in v22).
- Signals for state: `signal`, `computed`, `linkedSignal`. Never `mutate`; use `set` or `update`.
- Use `input()`, `output()` and `model()`, never the decorators. Host bindings go in the `host` object,
  never `@HostBinding` / `@HostListener`.
- Native control flow (`@if`, `@for` with `track`, `@switch`). No `*ngIf`, `ngClass`, `ngStyle`,
  `CommonModule`. Use `class` and `style` bindings.
- Prefer Signal Forms (`@angular/forms/signals`); otherwise Reactive forms. Never template-driven.
- Services: `@Service()` for singletons and `inject()`; no constructor injection.
- Lazy-load every feature route with `loadComponent`. Keep components small, one responsibility.
- Templates stay simple: move logic to `computed` values. Do not assume globals such as `new Date()`.
