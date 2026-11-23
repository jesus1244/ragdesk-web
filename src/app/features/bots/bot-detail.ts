import { Component, effect, inject, input } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { Icon } from '../../shared/icon';
import { CurrentBot } from './current-bot';

interface Tab {
  path: string;
  label: string;
}

/** Header and tabs for one assistant. The tab pages read the same `id` route param. */
@Component({
  selector: 'app-bot-detail',
  imports: [RouterLink, RouterLinkActive, RouterOutlet, Icon],
  template: `
    <a
      routerLink="/bots"
      class="inline-flex items-center gap-1 text-sm text-slate-600 hover:underline dark:text-slate-400"
    >
      <app-icon name="arrowLeft" class="size-4" /> All assistants
    </a>

    @if (current.error(); as message) {
      <p class="mt-4 text-sm text-rose-700 dark:text-rose-400" role="alert">{{ message }}</p>
    } @else if (current.bot(); as bot) {
      <h1 class="mt-3 text-2xl font-semibold tracking-tight">{{ bot.name }}</h1>
      <nav
        class="mt-4 flex gap-1 border-b border-slate-200 dark:border-slate-800"
        aria-label="Assistant sections"
      >
        @for (tab of tabs; track tab.path) {
          <a
            [routerLink]="tab.path"
            routerLinkActive="border-teal-600 text-teal-800 dark:border-teal-400 dark:text-teal-300"
            ariaCurrentWhenActive="page"
            class="-mb-px border-b-2 border-transparent px-3 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 dark:text-slate-300"
          >
            {{ tab.label }}
          </a>
        }
      </nav>
      <div class="mt-6"><router-outlet /></div>
    } @else {
      <p class="mt-4 text-sm text-slate-600 dark:text-slate-400" role="status">Loading…</p>
    }
  `,
})
export class BotDetail {
  protected readonly current = inject(CurrentBot);

  readonly id = input.required<string>();

  protected readonly tabs: Tab[] = [
    { path: 'documents', label: 'Documents' },
    { path: 'install', label: 'Install' },
    { path: 'settings', label: 'Settings' },
  ];

  constructor() {
    effect(() => void this.current.load(this.id()));
  }
}
