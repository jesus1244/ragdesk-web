import { Component, effect, inject, signal } from '@angular/core';
import { FormField, FormRoot, form, maxLength, minLength, required } from '@angular/forms/signals';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { errorMessage } from '../../core/http/api-error';
import { ToastService } from '../../core/notifications/toast.service';
import { FieldError } from '../../shared/field-error';
import { BotsApi } from './bots-api';
import { CurrentBot } from './current-bot';
import { BotLanguage } from './bot.models';
import { parseLines } from './lines';
import { parseOrigins } from './origins';

@Component({
  selector: 'app-settings-tab',
  imports: [FormField, FormRoot, FieldError],
  template: `
    <form
      [formRoot]="settingsForm"
      class="card max-w-2xl space-y-4 p-5"
      aria-label="Assistant settings"
    >
      <label class="block">
        <span class="label">Name</span>
        <input class="input" [formField]="settingsForm.name" />
        <app-field-error [field]="settingsForm.name" />
      </label>
      <label class="block">
        <span class="label">Welcome message</span>
        <input class="input" [formField]="settingsForm.welcome_message" />
        <app-field-error [field]="settingsForm.welcome_message" />
      </label>
      <label class="block">
        <span class="label">Assistant language</span>
        <select class="input" [formField]="settingsForm.language">
          <option value="en">English</option>
          <option value="es">Español</option>
        </select>
        <span class="mt-1 block text-xs text-slate-600 dark:text-slate-400">
          Sets the chat button labels and the default messages. Answers follow the language of each
          question.
        </span>
      </label>
      <label class="block">
        <span class="label">Suggested questions (one per line, up to 4)</span>
        <textarea
          class="input"
          rows="4"
          placeholder="How long does shipping take?"
          [formField]="settingsForm.suggested"
        ></textarea>
        <span class="mt-1 block text-xs text-slate-600 dark:text-slate-400">
          Shown as buttons when the chat opens, so visitors start with questions your documents can
          answer.
        </span>
      </label>
      <label class="block">
        <span class="label">Message when nothing matches (optional)</span>
        <input
          class="input"
          placeholder="Email help@example.com and we will answer you"
          [formField]="settingsForm.fallback_message"
        />
        <span class="mt-1 block text-xs text-slate-600 dark:text-slate-400">
          Shown when the documents have nothing on the question. Leave empty for a default message.
        </span>
        <app-field-error [field]="settingsForm.fallback_message" />
      </label>
      <label class="block">
        <span class="label">Extra guidance (optional)</span>
        <textarea class="input" rows="3" [formField]="settingsForm.instructions"></textarea>
        <span class="mt-1 block text-xs text-slate-600 dark:text-slate-400">
          Tone or topics to avoid. The assistant still answers only from your documents.
        </span>
        <app-field-error [field]="settingsForm.instructions" />
      </label>
      <label class="block">
        <span class="label">Allowed websites (one per line)</span>
        <textarea
          class="input font-mono"
          rows="3"
          placeholder="https://www.example.com"
          [formField]="settingsForm.origins"
        ></textarea>
        <span class="mt-1 block text-xs text-slate-600 dark:text-slate-400">
          Leave empty to let any website embed the widget.
        </span>
      </label>
      @if (serverError(); as message) {
        <p class="text-sm text-rose-700 dark:text-rose-400" role="alert">{{ message }}</p>
      }
      <button type="submit" class="btn-primary" [disabled]="settingsForm().submitting()">
        {{ settingsForm().submitting() ? 'Saving…' : 'Save changes' }}
      </button>
    </form>

    <section class="card mt-6 max-w-2xl p-5" aria-labelledby="danger-title">
      <h2 id="danger-title" class="text-lg font-semibold">Delete this assistant</h2>
      <p class="mt-1 text-sm text-slate-600 dark:text-slate-400">
        The widget stops answering immediately. Conversations are kept for your records.
      </p>
      @if (confirmingDelete()) {
        <div class="mt-3 flex gap-2">
          <button type="button" class="btn-danger" (click)="remove()">Yes, delete it</button>
          <button type="button" class="btn-secondary" (click)="confirmingDelete.set(false)">
            Cancel
          </button>
        </div>
      } @else {
        <button type="button" class="btn-danger mt-3" (click)="confirmingDelete.set(true)">
          Delete assistant
        </button>
      }
    </section>
  `,
})
export class SettingsTab {
  private readonly api = inject(BotsApi);
  private readonly current = inject(CurrentBot);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  protected readonly serverError = signal<string | null>(null);
  protected readonly confirmingDelete = signal(false);

  protected readonly model = signal({
    name: '',
    welcome_message: '',
    instructions: '',
    origins: '',
    language: 'en' as BotLanguage,
    fallback_message: '',
    suggested: '',
  });
  protected readonly settingsForm = form(
    this.model,
    (path) => {
      required(path.name, { message: 'Give the assistant a name' });
      minLength(path.name, 2);
      maxLength(path.name, 120);
      required(path.welcome_message, { message: 'Write a welcome message' });
      maxLength(path.welcome_message, 300);
      maxLength(path.instructions, 2000);
      maxLength(path.fallback_message, 300);
    },
    { submission: { action: () => this.save() } },
  );

  constructor() {
    effect(() => {
      const bot = this.current.bot();
      if (bot) {
        this.model.set({
          name: bot.name,
          welcome_message: bot.welcome_message,
          instructions: bot.instructions,
          origins: bot.allowed_origins.join('\n'),
          language: bot.language,
          fallback_message: bot.fallback_message,
          suggested: bot.suggested_questions.join('\n'),
        });
      }
    });
  }

  private async save(): Promise<undefined> {
    const bot = this.current.bot();
    if (!bot) {
      return undefined;
    }
    this.serverError.set(null);
    const value = this.model();
    try {
      const updated = await firstValueFrom(
        this.api.update(bot.id, {
          name: value.name.trim(),
          welcome_message: value.welcome_message.trim(),
          instructions: value.instructions.trim(),
          allowed_origins: parseOrigins(value.origins),
          language: value.language,
          fallback_message: value.fallback_message.trim(),
          suggested_questions: parseLines(value.suggested),
        }),
      );
      this.current.bot.set(updated);
      this.toast.success('Settings saved');
    } catch (error) {
      this.serverError.set(errorMessage(error, 'Could not save the settings'));
    }
    return undefined;
  }

  protected async remove(): Promise<void> {
    const bot = this.current.bot();
    if (!bot) {
      return;
    }
    try {
      await firstValueFrom(this.api.remove(bot.id));
      this.current.bot.set(null);
      this.toast.success('Assistant deleted');
      await this.router.navigateByUrl('/bots');
    } catch (error) {
      this.toast.error(errorMessage(error, 'Could not delete the assistant'));
    }
  }
}
