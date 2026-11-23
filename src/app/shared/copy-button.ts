import { Component, input, signal } from '@angular/core';

import { Icon } from './icon';

@Component({
  selector: 'app-copy-button',
  imports: [Icon],
  template: `
    <button type="button" class="btn-secondary px-2.5 py-1.5 text-xs" (click)="copy()">
      <app-icon [name]="copied() ? 'check' : 'copy'" class="size-3.5" />
      <span aria-live="polite">{{ copied() ? 'Copied' : label() }}</span>
    </button>
  `,
})
export class CopyButton {
  readonly value = input.required<string>();
  readonly label = input('Copy');
  protected readonly copied = signal(false);

  protected async copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.value());
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    } catch {
      // Clipboard can be blocked; the value stays visible for manual copy.
    }
  }
}
