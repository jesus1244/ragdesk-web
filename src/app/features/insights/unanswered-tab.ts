import { DatePipe } from '@angular/common';
import { Component, inject, input, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { errorMessage } from '../../core/http/api-error';
import { InsightsApi } from './insights-api';
import { Unanswered } from './insights.models';

@Component({
  selector: 'app-unanswered-tab',
  imports: [DatePipe],
  template: `
    <p class="text-sm text-slate-600 dark:text-slate-400">
      Questions visitors asked that the documents could not answer. Add the missing information as a
      document and the assistant will pick it up.
    </p>
    <section class="mt-4" aria-label="Unanswered questions" aria-live="polite">
      @if (loading()) {
        <p class="text-sm text-slate-600 dark:text-slate-400" role="status">Loading…</p>
      } @else if (error(); as message) {
        <p class="text-sm text-rose-700 dark:text-rose-400" role="alert">{{ message }}</p>
      } @else if (items().length === 0) {
        <p class="card p-8 text-center text-sm text-slate-600 dark:text-slate-400">
          Nothing here. Every question so far was answered from your documents.
        </p>
      } @else {
        <ul class="card divide-y divide-slate-200 dark:divide-slate-800">
          @for (item of items(); track item.message_id) {
            <li class="flex flex-wrap items-center justify-between gap-2 p-4">
              <span class="min-w-0 flex-1">{{ item.question }}</span>
              <span class="text-xs text-slate-600 dark:text-slate-400">
                {{ item.created_at | date: 'medium' }}
              </span>
            </li>
          }
        </ul>
        <p class="mt-2 text-xs text-slate-600 dark:text-slate-400">
          Showing {{ items().length }} of {{ total() }}
        </p>
      }
    </section>
  `,
})
export class UnansweredTab {
  private readonly api = inject(InsightsApi);

  /** The assistant id, from the parent route. */
  readonly id = input.required<string>();

  protected readonly items = signal<Unanswered[]>([]);
  protected readonly total = signal(0);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  constructor() {
    queueMicrotask(() => void this.load());
  }

  private async load(): Promise<void> {
    try {
      const page = await firstValueFrom(this.api.unanswered(this.id(), 50));
      this.items.set(page.items);
      this.total.set(page.total);
    } catch (error) {
      this.error.set(errorMessage(error, 'Could not load the questions'));
    } finally {
      this.loading.set(false);
    }
  }
}
