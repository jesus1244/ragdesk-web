# AGENTS.md (RAGDesk Web)

Rules for any coding agent or contributor in this repository. Per-topic rules live in `.claude/rules/`,
`.github/instructions/` and `.kiro/steering/`; they are generated from one source by
`scripts/gen-steering.mjs` (edit that script, not the copies).

## What this is

The Angular admin panel and the embeddable chat widget of RAGDesk. Owners create assistants, upload
documents, watch conversations and see the questions the assistant could not answer. Visitors use the
widget on the owner's website. Backend: [ragdesk-api](https://github.com/jesus1244/ragdesk-api).

## Stack

Angular 22 (zoneless, standalone, signals) · TypeScript strict · Tailwind 4 · Vitest · ESLint
(angular-eslint) · Prettier · npm. The widget is a separate dependency-free bundle in `src/widget/`.

## Commands

```bash
npm ci
npm start                      # http://localhost:4200, proxies /api to localhost:8000
npx prettier --check "src/**/*.{ts,html,css}" && npx ng lint && npx ng test --watch=false
npx ng build --configuration production
```

## Layout

```
src/app/
  core/       auth (tokens, interceptor, guards), http helpers, notifications
  shared/     small reusable UI (icon, field error, pipes)
  layout/     the signed-in shell
  features/   auth, bots, sources, conversations, unanswered
src/widget/   the embeddable widget (vanilla TypeScript, Shadow DOM)
```

## Always

- Small commits, one topic each, tests with the feature. Run format, lint and tests before committing.
- Follow `.claude/rules/angular-components.md`: signals, `input()`/`output()`, native control flow, no
  explicit OnPush, no `standalone: true`.
- Accessibility is a requirement: AXE clean, WCAG AA, labelled controls, keyboard support.
- Model and document text is untrusted: render with `textContent`, never `innerHTML`.

## Never

- No `any`, no `innerHTML`, no secrets in the bundle, no hard-coded API host.
- No new dependency when Angular or the platform already covers the need.
