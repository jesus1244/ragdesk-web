import { Component, inject, signal } from '@angular/core';
import { FormField, FormRoot, form, maxLength, minLength, required } from '@angular/forms/signals';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { errorMessage } from '../../core/http/api-error';
import { ToastService } from '../../core/notifications/toast.service';
import { FieldError } from '../../shared/field-error';
import { Icon } from '../../shared/icon';
import { Bot } from './bot.models';
import { BotsApi } from './bots-api';

@Component({
  selector: 'app-bots-page',
  imports: [FormField, FormRoot, FieldError, Icon, RouterLink],
  template: `
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">Assistants</h1>
        <p class="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Each assistant answers from its own documents and has its own widget.
        </p>
      </div>
    </header>

    <form
      [formRoot]="createForm"
      class="card mt-6 flex flex-wrap items-end gap-3 p-4"
      aria-label="Create assistant"
    >
      <label class="min-w-64 flex-1">
        <span class="label">New assistant name</span>
        <input class="input" placeholder="Support assistant" [formField]="createForm.name" />
        <app-field-error [field]="createForm.name" />
      </label>
      <button type="submit" class="btn-primary" [disabled]="createForm().submitting()">
        <app-icon name="plus" class="size-4" />
        {{ createForm().submitting() ? 'Creating…' : 'Create assistant' }}
      </button>
    </form>

    <section class="mt-8" aria-label="Your assistants" aria-live="polite">
      @if (loading()) {
        <p class="text-sm text-slate-600 dark:text-slate-400" role="status">Loading assistants…</p>
      } @else if (loadError(); as message) {
        <p class="text-sm text-rose-700 dark:text-rose-400" role="alert">{{ message }}</p>
      } @else if (bots().length === 0) {
        <p class="card p-8 text-center text-sm text-slate-600 dark:text-slate-400">
          You have no assistants yet. Create one above, then add documents to it.
        </p>
      } @else {
        <ul class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          @for (bot of bots(); track bot.id) {
            <li class="card p-5">
              <a
                [routerLink]="['/bots', bot.id]"
                class="text-lg font-semibold hover:underline focus-visible:underline"
              >
                {{ bot.name }}
              </a>
              @if (bot.is_demo) {
                <span
                  class="ml-2 rounded-full bg-teal-100 px-2 py-0.5 text-xs font-medium text-teal-900 dark:bg-teal-900 dark:text-teal-100"
                  >Demo</span
                >
              }
              <p class="mt-2 line-clamp-2 text-sm text-slate-600 dark:text-slate-400">
                {{ bot.welcome_message }}
              </p>
            </li>
          }
        </ul>
      }
    </section>
  `,
})
export class BotsPage {
  private readonly api = inject(BotsApi);
  private readonly toast = inject(ToastService);

  protected readonly bots = signal<Bot[]>([]);
  protected readonly loading = signal(true);
  protected readonly loadError = signal<string | null>(null);

  protected readonly model = signal({ name: '' });
  protected readonly createForm = form(
    this.model,
    (path) => {
      required(path.name, { message: 'Give the assistant a name' });
      minLength(path.name, 2);
      maxLength(path.name, 120);
    },
    { submission: { action: () => this.create() } },
  );

  constructor() {
    void this.load();
  }

  private async load(): Promise<void> {
    try {
      const page = await firstValueFrom(this.api.list());
      this.bots.set(page.items);
    } catch (error) {
      this.loadError.set(errorMessage(error, 'Could not load your assistants'));
    } finally {
      this.loading.set(false);
    }
  }

  private async create(): Promise<undefined> {
    try {
      const bot = await firstValueFrom(this.api.create({ name: this.model().name.trim() }));
      this.bots.update((list) => [bot, ...list]);
      this.model.set({ name: '' });
      this.toast.success(`Created “${bot.name}”`);
    } catch (error) {
      this.toast.error(errorMessage(error, 'Could not create the assistant'));
    }
    return undefined;
  }
}
