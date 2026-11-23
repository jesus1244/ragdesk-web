import { Component, computed, inject } from '@angular/core';

import { CopyButton } from '../../shared/copy-button';
import { CurrentBot } from './current-bot';
import { embedSnippet } from './embed-snippet';

@Component({
  selector: 'app-install-tab',
  imports: [CopyButton],
  template: `
    @if (snippet(); as code) {
      <section class="card p-5" aria-labelledby="install-title">
        <h2 id="install-title" class="text-lg font-semibold">Add the assistant to your website</h2>
        <p class="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Paste this tag before the closing <code class="font-mono">&lt;/body&gt;</code> tag. A chat
          button appears in the corner and answers from your documents.
        </p>
        <pre
          class="mt-4 overflow-x-auto rounded-lg bg-slate-900 p-4 font-mono text-sm text-slate-100"
          tabindex="0"
          aria-label="Embed code"
          >{{ code }}</pre>
        <div class="mt-3"><app-copy-button [value]="code" label="Copy code" /></div>
        <p class="mt-4 text-sm text-slate-600 dark:text-slate-400">
          Limit which websites can use it under <strong>Settings → Allowed websites</strong>. When
          the list is empty any website can embed it.
        </p>
      </section>
    }
  `,
})
export class InstallTab {
  private readonly current = inject(CurrentBot);

  protected readonly snippet = computed(() => {
    const bot = this.current.bot();
    return bot ? embedSnippet(window.location.origin, bot.public_key) : null;
  });
}
