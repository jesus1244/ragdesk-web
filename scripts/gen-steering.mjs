// Generates the per-topic rules for Claude Code, GitHub Copilot and Kiro from one source.
// Run: node scripts/gen-steering.mjs   (edit this file, never the generated copies)
import { mkdirSync, writeFileSync } from 'node:fs';

const VERIFIED = '2026-11-23';
const HEADER = `> Verified: ${VERIFIED} · Source: Angular 22 docs (angular.dev) and the project standards.\n\n`;

const topics = [
  {
    name: 'angular-components',
    title: 'Angular components and templates',
    globs: ['src/**/*.ts', 'src/**/*.html'],
    body: `- Standalone components only. Do NOT write \`standalone: true\` (it is the default) and do NOT set
  \`ChangeDetectionStrategy.OnPush\` (default in v22).
- Signals for state: \`signal\`, \`computed\`, \`linkedSignal\`. Never \`mutate\`; use \`set\` or \`update\`.
- Use \`input()\`, \`output()\` and \`model()\`, never the decorators. Host bindings go in the \`host\` object,
  never \`@HostBinding\` / \`@HostListener\`.
- Native control flow (\`@if\`, \`@for\` with \`track\`, \`@switch\`). No \`*ngIf\`, \`ngClass\`, \`ngStyle\`,
  \`CommonModule\`. Use \`class\` and \`style\` bindings.
- Prefer Signal Forms (\`@angular/forms/signals\`); otherwise Reactive forms. Never template-driven.
- Services: \`@Service()\` for singletons and \`inject()\`; no constructor injection.
- Lazy-load every feature route with \`loadComponent\`. Keep components small, one responsibility.
- Templates stay simple: move logic to \`computed\` values. Do not assume globals such as \`new Date()\`.`,
  },
  {
    name: 'http-and-state',
    title: 'HTTP, errors and server state',
    globs: ['src/app/**/*.ts'],
    body: `- All requests go through \`HttpClient\` with the base \`API_URL\` (same origin, \`/api/v1\`). No hard-coded hosts.
- Every request shows a loading state and a failure message built with \`errorMessage()\`; never swallow errors.
- Types mirror the API schemas (\`*.models.ts\`). Never use \`any\`; use \`unknown\` and narrow.
- Lists are paginated like the API (\`limit\`, \`offset\`, \`total\`). Do not fetch everything.
- The auth interceptor refreshes a 401 once and shares the refresh between concurrent calls.
- Server-Sent Events are read with \`fetch\` and a stream reader (POST with a body); parse events in one place
  and test the parser with split chunks.
- Store only tokens in \`localStorage\`, always inside try/catch, never other personal data.`,
  },
  {
    name: 'accessibility',
    title: 'Accessibility',
    globs: ['src/**/*.html', 'src/**/*.ts', 'src/**/*.css'],
    body: `- MUST pass all AXE checks and WCAG AA: colour contrast, focus order and visible focus, ARIA only where
  native elements are not enough.
- Every control has an accessible name. Icon-only buttons need \`aria-label\`. Decorative icons are \`aria-hidden\`.
- Form fields have a \`<label>\`; errors are tied with \`aria-describedby\` and \`aria-invalid\`.
- Dynamic updates (toasts, streaming answers) use \`role="status"\` or \`aria-live="polite"\`.
- Everything works with the keyboard; dialogs trap and restore focus.
- Use \`NgOptimizedImage\` for static images.`,
  },
  {
    name: 'widget-security',
    title: 'Embeddable widget and front-end security',
    globs: ['src/widget/**/*', 'src/app/**/*.ts'],
    body: `- The widget renders model and document text with \`textContent\`, NEVER \`innerHTML\`, \`insertAdjacentHTML\` or
  \`bypassSecurityTrust*\`. Answers are untrusted data.
- The widget runs in a Shadow DOM so host-page CSS cannot break it and its CSS cannot leak out.
- The widget never receives secrets: only the public bot key. It sends no cookies (\`credentials: 'omit'\`).
- Do not log tokens, questions or answers to the console.
- Never put secrets in \`environment\` files or the bundle. Never use \`eval\` or \`new Function\`.
- Keep the widget a single dependency-free file; size budget 20 kB gzipped.`,
  },
  {
    name: 'testing',
    title: 'Testing',
    globs: ['src/**/*.spec.ts'],
    body: `- Vitest through \`ng test\`. Test behaviour users can see (rendered text, requests made), not internals.
- Mock HTTP with \`provideHttpClientTesting\`; never call a real API.
- Every service with logic has a spec: auth refresh, SSE parser, widget state machine.
- Components that submit forms: test the valid path and the validation error.
- Name tests after behaviour. No test depends on the wall clock, the network or test order.
- MUST add a regression test for every bug.`,
  },
  {
    name: 'git-workflow',
    title: 'Git workflow',
    globs: ['**/*'],
    body: `- One topic per commit with a conventional prefix (\`feat\`, \`fix\`, \`test\`, \`docs\`, \`chore\`, \`ci\`, \`refactor\`).
- A feature and its tests go in the same commit. Never commit code that fails lint, format or tests.
- Before every commit: \`npx prettier --check "src/**/*.{ts,html,css}" && npx ng lint && npx ng test --watch=false\`.
- Never commit secrets or \`.env\` files. Do not rewrite published history.`,
  },
];

for (const dir of ['.claude/rules', '.github/instructions', '.kiro/steering']) {
  mkdirSync(dir, { recursive: true });
}
for (const t of topics) {
  const content = `${HEADER}# ${t.title}\n\n${t.body}\n`;
  const paths = t.globs.map((g) => `  - "${g}"`).join('\n');
  writeFileSync(`.claude/rules/${t.name}.md`, `---\npaths:\n${paths}\n---\n\n${content}`);
  writeFileSync(
    `.github/instructions/${t.name}.instructions.md`,
    `---\napplyTo: "${t.globs.join(',')}"\n---\n\n${content}`,
  );
  const pattern = t.globs.length > 1 ? `{${t.globs.join(',')}}` : t.globs[0];
  writeFileSync(
    `.kiro/steering/${t.name}.md`,
    `---\ninclusion: fileMatch\nfileMatchPattern: "${pattern}"\n---\n\n${content}`,
  );
}
console.log(`Generated ${topics.length} topics x 3 tools`);
