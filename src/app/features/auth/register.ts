import { Component, inject, signal } from '@angular/core';
import {
  FormField,
  FormRoot,
  email,
  form,
  maxLength,
  minLength,
  pattern,
  required,
} from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { AuthService } from '../../core/auth/auth.service';
import { errorMessage } from '../../core/http/api-error';
import { FieldError } from '../../shared/field-error';

@Component({
  selector: 'app-register',
  imports: [FormField, FormRoot, RouterLink, FieldError],
  template: `
    <h1 class="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
      Create your account
    </h1>
    <p class="mt-1 text-sm text-slate-600 dark:text-slate-400">
      Already registered?
      <a routerLink="/login" class="font-medium text-teal-700 hover:underline dark:text-teal-400"
        >Sign in</a
      >
    </p>

    <form [formRoot]="registerForm" class="mt-8 space-y-4" aria-label="Create account">
      @if (serverError()) {
        <p
          class="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800 dark:bg-rose-950 dark:text-rose-200"
          role="alert"
        >
          {{ serverError() }}
        </p>
      }
      <label class="block">
        <span class="label">Full name</span>
        <input class="input" autocomplete="name" [formField]="registerForm.full_name" />
        <app-field-error [field]="registerForm.full_name" />
      </label>
      <label class="block">
        <span class="label">Work email</span>
        <input class="input" type="email" autocomplete="email" [formField]="registerForm.email" />
        <app-field-error [field]="registerForm.email" />
      </label>
      <label class="block">
        <span class="label">Password</span>
        <input
          class="input"
          type="password"
          autocomplete="new-password"
          aria-describedby="password-hint"
          [formField]="registerForm.password"
        />
        <span id="password-hint" class="mt-1 block text-xs text-slate-600 dark:text-slate-400">
          At least 8 characters, with upper and lower case letters and a number.
        </span>
        <app-field-error [field]="registerForm.password" />
      </label>
      <button
        type="submit"
        class="btn-primary w-full justify-center"
        [disabled]="registerForm().submitting()"
      >
        {{ registerForm().submitting() ? 'Creating account…' : 'Create account' }}
      </button>
    </form>
  `,
})
export class Register {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly serverError = signal<string | null>(null);

  protected readonly model = signal({ full_name: '', email: '', password: '' });
  protected readonly registerForm = form(
    this.model,
    (path) => {
      required(path.full_name, { message: 'Tell us your name' });
      minLength(path.full_name, 2);
      maxLength(path.full_name, 120);
      required(path.email, { message: 'Email is required' });
      email(path.email);
      required(path.password, { message: 'Choose a password' });
      // Same rule the API enforces (auth/schemas.py), checked early for a better UX.
      pattern(path.password, /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,128}$/, {
        message: 'Use 8+ characters with upper, lower case and a number',
      });
    },
    { submission: { action: () => this.submit() } },
  );

  private async submit(): Promise<undefined> {
    this.serverError.set(null);
    try {
      await firstValueFrom(this.auth.register(this.model()));
      await this.router.navigateByUrl('/bots');
    } catch (error) {
      this.serverError.set(errorMessage(error, 'Could not create the account'));
    }
    return undefined;
  }
}
