import { Component, computed, input } from '@angular/core';

/** Structural subset of a Signal Forms field, so any field type can be passed in. */
export type ErrorSource = () => {
  errors: () => readonly { kind: string; message?: string }[];
  touched: () => boolean;
};

const DEFAULT_MESSAGES: Record<string, string> = {
  required: 'This field is required',
  email: 'Enter a valid email address',
  minLength: 'Too short',
  maxLength: 'Too long',
  pattern: 'Invalid format',
  min: 'Value is too low',
};

/** Shows the first validation error of a field once the user has interacted with it. */
@Component({
  selector: 'app-field-error',
  template: `
    @if (message(); as text) {
      <p class="mt-1 text-xs text-rose-700 dark:text-rose-400" [id]="errorId()" role="alert">
        {{ text }}
      </p>
    }
  `,
})
export class FieldError {
  readonly field = input.required<ErrorSource>();
  readonly errorId = input<string>();

  protected readonly message = computed(() => {
    const state = this.field()();
    if (!state.touched()) {
      return null;
    }
    const first = state.errors()[0];
    return first ? (first.message ?? DEFAULT_MESSAGES[first.kind] ?? 'Invalid value') : null;
  });
}
