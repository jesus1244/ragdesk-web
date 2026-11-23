import { Component, DestroyRef, inject, input, signal } from '@angular/core';
import { firstValueFrom, Observable } from 'rxjs';

import { errorMessage } from '../../core/http/api-error';
import { ToastService } from '../../core/notifications/toast.service';
import { Icon } from '../../shared/icon';
import { Source, shouldPoll } from './source.models';
import { SourcesApi } from './sources-api';

type Mode = 'file' | 'url' | 'text';
const POLL_MS = 3000;
const MODES: { id: Mode; label: string }[] = [
  { id: 'file', label: 'Upload a file' },
  { id: 'url', label: 'Web page' },
  { id: 'text', label: 'Paste text' },
];

@Component({
  selector: 'app-documents-tab',
  imports: [Icon],
  template: `
    <section class="card p-5" aria-labelledby="add-title">
      <h2 id="add-title" class="text-lg font-semibold">Add knowledge</h2>
      <div class="mt-3 flex gap-1" role="group" aria-label="Kind of source">
        @for (m of modes; track m.id) {
          <button
            type="button"
            [class]="mode() === m.id ? 'btn-primary' : 'btn-secondary'"
            [attr.aria-pressed]="mode() === m.id"
            (click)="mode.set(m.id)"
          >
            {{ m.label }}
          </button>
        }
      </div>

      @switch (mode()) {
        @case ('file') {
          <div class="mt-4">
            <label class="label" for="file-input">PDF, Markdown or text file (up to 20 MB)</label>
            <input
              id="file-input"
              class="input"
              type="file"
              accept=".pdf,.md,.markdown,.txt,.html,application/pdf,text/*"
              (change)="upload($event)"
            />
          </div>
        }
        @case ('url') {
          <form class="mt-4 flex flex-wrap items-end gap-3" (submit)="addUrl($event, url)">
            <label class="min-w-64 flex-1">
              <span class="label">Page address</span>
              <input
                #url
                class="input"
                type="url"
                required
                placeholder="https://example.com/help"
              />
            </label>
            <button type="submit" class="btn-primary" [disabled]="busy()">Add page</button>
          </form>
        }
        @case ('text') {
          <form class="mt-4 space-y-3" (submit)="addText($event, name, text)">
            <label class="block">
              <span class="label">Title</span>
              <input #name class="input" required maxlength="255" />
            </label>
            <label class="block">
              <span class="label">Content</span>
              <textarea #text class="input" rows="5" required></textarea>
            </label>
            <button type="submit" class="btn-primary" [disabled]="busy()">Add text</button>
          </form>
        }
      }
    </section>

    <section class="mt-6" aria-label="Documents" aria-live="polite">
      @if (loading()) {
        <p class="text-sm text-slate-600 dark:text-slate-400" role="status">Loading documents…</p>
      } @else if (loadError(); as message) {
        <p class="text-sm text-rose-700 dark:text-rose-400" role="alert">{{ message }}</p>
      } @else if (sources().length === 0) {
        <p class="card p-8 text-center text-sm text-slate-600 dark:text-slate-400">
          No documents yet. Add one above and the assistant can start answering from it.
        </p>
      } @else {
        <ul class="card divide-y divide-slate-200 dark:divide-slate-800">
          @for (source of sources(); track source.id) {
            <li class="flex flex-wrap items-center gap-3 p-4">
              <div class="min-w-0 flex-1">
                <p class="truncate font-medium">{{ source.name }}</p>
                <p class="text-xs text-slate-600 dark:text-slate-400">
                  {{ kindLabel(source) }}
                  @if (source.status === 'ready') {
                    · {{ source.chunk_count }} passages
                  }
                </p>
                @if (source.error) {
                  <p class="mt-1 text-xs text-rose-700 dark:text-rose-400">{{ source.error }}</p>
                }
              </div>
              <span
                class="rounded-full px-2.5 py-0.5 text-xs font-medium"
                [class]="badge(source)"
                [class.animate-pulse]="source.status === 'processing'"
              >
                {{ source.status }}
              </span>
              @if (source.status === 'failed') {
                <button
                  type="button"
                  class="btn-secondary px-2.5 py-1.5 text-xs"
                  (click)="retry(source)"
                >
                  <app-icon name="refresh" class="size-3.5" /> Retry
                </button>
              }
              <button
                type="button"
                class="btn-ghost px-2"
                [attr.aria-label]="'Delete ' + source.name"
                (click)="remove(source)"
              >
                <app-icon name="trash" class="size-4" />
              </button>
            </li>
          }
        </ul>
      }
    </section>
  `,
})
export class DocumentsTab {
  private readonly api = inject(SourcesApi);
  private readonly toast = inject(ToastService);

  /** The assistant id, from the parent route. */
  readonly id = input.required<string>();

  protected readonly modes = MODES;
  protected readonly mode = signal<Mode>('file');
  protected readonly sources = signal<Source[]>([]);
  protected readonly loading = signal(true);
  protected readonly loadError = signal<string | null>(null);
  protected readonly busy = signal(false);
  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    inject(DestroyRef).onDestroy(() => clearTimeout(this.timer));
    queueMicrotask(() => void this.refresh());
  }

  protected kindLabel(source: Source): string {
    if (source.kind === 'url') {
      return source.url ?? 'Web page';
    }
    return source.kind === 'file' ? 'File' : 'Pasted text';
  }

  protected badge(source: Source): string {
    switch (source.status) {
      case 'ready':
        return 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200';
      case 'failed':
        return 'bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-200';
      default:
        return 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200';
    }
  }

  private async refresh(): Promise<void> {
    clearTimeout(this.timer);
    try {
      const page = await firstValueFrom(this.api.list(this.id()));
      this.sources.set(page.items);
      this.loadError.set(null);
    } catch (error) {
      this.loadError.set(errorMessage(error, 'Could not load the documents'));
    } finally {
      this.loading.set(false);
    }
    if (shouldPoll(this.sources())) {
      this.timer = setTimeout(() => void this.refresh(), POLL_MS);
    }
  }

  private async submit(action: Observable<Source>, success: string): Promise<boolean> {
    this.busy.set(true);
    try {
      await firstValueFrom(action);
      this.toast.success(success);
      await this.refresh();
      return true;
    } catch (error) {
      this.toast.error(errorMessage(error, 'Could not add the document'));
      return false;
    } finally {
      this.busy.set(false);
    }
  }

  protected async upload(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      await this.submit(this.api.uploadFile(this.id(), file), `Uploaded ${file.name}`);
      input.value = '';
    }
  }

  protected async addUrl(event: Event, field: HTMLInputElement): Promise<void> {
    event.preventDefault();
    if (await this.submit(this.api.addUrl(this.id(), field.value.trim()), 'Page added')) {
      field.value = '';
    }
  }

  protected async addText(
    event: Event,
    name: HTMLInputElement,
    text: HTMLTextAreaElement,
  ): Promise<void> {
    event.preventDefault();
    if (
      await this.submit(this.api.addText(this.id(), name.value.trim(), text.value), 'Text added')
    ) {
      name.value = '';
      text.value = '';
    }
  }

  protected async retry(source: Source): Promise<void> {
    await this.submit(this.api.retry(this.id(), source.id), 'Retrying');
  }

  protected async remove(source: Source): Promise<void> {
    try {
      await firstValueFrom(this.api.remove(this.id(), source.id));
      this.sources.update((list) => list.filter((s) => s.id !== source.id));
      this.toast.success(`Deleted ${source.name}`);
    } catch (error) {
      this.toast.error(errorMessage(error, 'Could not delete the document'));
    }
  }
}
