---
applyTo: "src/**/*.html,src/**/*.ts,src/**/*.css"
---

> Verified: 2026-11-23 · Source: Angular 22 docs (angular.dev) and the project standards.

# Accessibility

- MUST pass all AXE checks and WCAG AA: colour contrast, focus order and visible focus, ARIA only where
  native elements are not enough.
- Every control has an accessible name. Icon-only buttons need `aria-label`. Decorative icons are `aria-hidden`.
- Form fields have a `<label>`; errors are tied with `aria-describedby` and `aria-invalid`.
- Dynamic updates (toasts, streaming answers) use `role="status"` or `aria-live="polite"`.
- Everything works with the keyboard; dialogs trap and restore focus.
- Use `NgOptimizedImage` for static images.
