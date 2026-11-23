import { Component, inject } from '@angular/core';

import { Icon } from '../../shared/icon';
import { ToastService } from './toast.service';

@Component({
  selector: 'app-toast-outlet',
  imports: [Icon],
  host: {
    class:
      'pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4 sm:items-end sm:right-4 sm:left-auto',
  },
  template: `
    <div aria-live="polite" class="contents">
      @for (toast of toasts.toasts(); track toast.id) {
        <div
          class="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border bg-white p-3 shadow-lg dark:bg-slate-900"
          [class.border-emerald-200]="toast.kind === 'success'"
          [class.border-rose-200]="toast.kind === 'error'"
          [class.border-slate-200]="toast.kind === 'info'"
          [attr.role]="toast.kind === 'error' ? 'alert' : 'status'"
        >
          <app-icon
            [name]="toast.kind === 'error' ? 'alert' : toast.kind === 'success' ? 'check' : 'info'"
            class="mt-0.5 size-5 shrink-0"
            [class.text-emerald-600]="toast.kind === 'success'"
            [class.text-rose-600]="toast.kind === 'error'"
            [class.text-teal-600]="toast.kind === 'info'"
          />
          <p class="flex-1 text-sm text-slate-700 dark:text-slate-200">{{ toast.message }}</p>
          <button
            type="button"
            class="rounded p-0.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Dismiss notification"
            (click)="toasts.dismiss(toast.id)"
          >
            <app-icon name="x" class="size-4" />
          </button>
        </div>
      }
    </div>
  `,
})
export class ToastOutlet {
  protected readonly toasts = inject(ToastService);
}
