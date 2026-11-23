import { DatePipe } from '@angular/common';
import { Component, inject, input, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { errorMessage } from '../../core/http/api-error';
import { formatRate } from './answer-rate';
import { InsightsApi } from './insights-api';
import { BotStats, Conversation, Message } from './insights.models';

@Component({
  selector: 'app-conversations-tab',
  imports: [DatePipe],
  template: `
    @if (stats(); as s) {
      <dl class="grid gap-4 sm:grid-cols-4" aria-label="Summary">
        @for (item of summary(s); track item.label) {
          <div class="card p-4">
            <dt class="text-xs font-medium text-slate-600 dark:text-slate-400">{{ item.label }}</dt>
            <dd class="mt-1 text-2xl font-semibold">{{ item.value }}</dd>
          </div>
        }
      </dl>
    }

    <section class="mt-6" aria-label="Conversations" aria-live="polite">
      @if (loading()) {
        <p class="text-sm text-slate-600 dark:text-slate-400" role="status">
          Loading conversations…
        </p>
      } @else if (error(); as message) {
        <p class="text-sm text-rose-700 dark:text-rose-400" role="alert">{{ message }}</p>
      } @else if (conversations().length === 0) {
        <p class="card p-8 text-center text-sm text-slate-600 dark:text-slate-400">
          No conversations yet. They appear here as soon as visitors use the widget.
        </p>
      } @else {
        <ul class="card divide-y divide-slate-200 dark:divide-slate-800">
          @for (c of conversations(); track c.id) {
            <li>
              <button
                type="button"
                class="flex w-full items-center gap-3 p-4 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50"
                [attr.aria-expanded]="openId() === c.id"
                (click)="toggle(c)"
              >
                <span class="min-w-0 flex-1 truncate font-medium">
                  {{ c.last_question ?? 'Conversation' }}
                </span>
                <span class="text-xs text-slate-600 dark:text-slate-400">
                  {{ c.message_count }} messages · {{ c.created_at | date: 'medium' }}
                </span>
              </button>
              @if (openId() === c.id) {
                <div class="space-y-3 bg-slate-50 p-4 dark:bg-slate-950/50">
                  @if (transcriptError(); as message) {
                    <p class="text-sm text-rose-700 dark:text-rose-400" role="alert">
                      {{ message }}
                    </p>
                  }
                  @for (m of transcript(); track m.id) {
                    <div [class]="m.role === 'user' ? 'text-right' : ''">
                      <p
                        class="inline-block max-w-prose rounded-xl px-3 py-2 text-left text-sm whitespace-pre-wrap"
                        [class]="
                          m.role === 'user'
                            ? 'bg-teal-700 text-white'
                            : 'bg-white shadow-sm dark:bg-slate-900'
                        "
                      >
                        {{ m.content }}
                      </p>
                      @if (m.role === 'assistant') {
                        <p class="mt-1 text-xs text-slate-600 dark:text-slate-400">
                          @if (m.citations.length > 0) {
                            Sources:
                            @for (cite of m.citations; track cite.index) {
                              <span class="mr-2"
                                >[{{ cite.index }}] {{ cite.source_name }} — {{ cite.title }}</span
                              >
                            }
                          } @else {
                            No source found
                          }
                        </p>
                      }
                    </div>
                  }
                </div>
              }
            </li>
          }
        </ul>
      }
    </section>
  `,
})
export class ConversationsTab {
  private readonly api = inject(InsightsApi);

  /** The assistant id, from the parent route. */
  readonly id = input.required<string>();

  protected readonly stats = signal<BotStats | null>(null);
  protected readonly conversations = signal<Conversation[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly openId = signal<string | null>(null);
  protected readonly transcript = signal<Message[]>([]);
  protected readonly transcriptError = signal<string | null>(null);

  constructor() {
    queueMicrotask(() => void this.load());
  }

  protected summary(s: BotStats): { label: string; value: string }[] {
    return [
      { label: 'Conversations', value: String(s.conversations) },
      { label: 'Questions', value: String(s.questions) },
      { label: 'Answered', value: formatRate(s.answer_rate, s.questions) },
      { label: 'Unanswered', value: String(s.unanswered) },
    ];
  }

  private async load(): Promise<void> {
    try {
      const [stats, page] = await Promise.all([
        firstValueFrom(this.api.stats(this.id())),
        firstValueFrom(this.api.conversations(this.id())),
      ]);
      this.stats.set(stats);
      this.conversations.set(page.items);
    } catch (error) {
      this.error.set(errorMessage(error, 'Could not load the conversations'));
    } finally {
      this.loading.set(false);
    }
  }

  protected async toggle(conversation: Conversation): Promise<void> {
    if (this.openId() === conversation.id) {
      this.openId.set(null);
      return;
    }
    this.openId.set(conversation.id);
    this.transcript.set([]);
    this.transcriptError.set(null);
    try {
      this.transcript.set(await firstValueFrom(this.api.messages(this.id(), conversation.id)));
    } catch (error) {
      this.transcriptError.set(errorMessage(error, 'Could not load the messages'));
    }
  }
}
