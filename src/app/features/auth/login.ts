import { Component, inject, input, signal } from '@angular/core';
import { FormField, FormRoot, email, form, required } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { AuthService } from '../../core/auth/auth.service';
import { errorMessage } from '../../core/http/api-error';
import { FieldError } from '../../shared/field-error';

@Component({
  selector: 'app-login',
  imports: [FormField, FormRoot, RouterLink, FieldError],
  template: `
    <h1 class="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">Sign in</h1>
    <p class="mt-1 text-sm text-slate-600 dark:text-slate-400">
      New here?
      <a routerLink="/register" class="font-medium text-teal-700 hover:underline dark:text-teal-400"
        >Create an account</a
      >
    </p>

    <form [formRoot]="loginForm" class="mt-8 space-y-4" aria-label="Sign in">
      @if (serverError()) {
        <p
          class="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800 dark:bg-rose-950 dark:text-rose-200"
          role="alert"
        >
          {{ serverError() }}
        </p>
      }
      <label class="block">
        <span class="label">Email</span>
        <input class="input" type="email" autocomplete="email" [formField]="loginForm.email" />
        <app-field-error [field]="loginForm.email" />
      </label>
      <label class="block">
        <span class="label">Password</span>
        <input
          class="input"
          type="password"
          autocomplete="current-password"
          [formField]="loginForm.password"
        />
        <app-field-error [field]="loginForm.password" />
      </label>
      <button
        type="submit"
        class="btn-primary w-full justify-center"
        [disabled]="loginForm().submitting()"
      >
        {{ loginForm().submitting() ? 'Signing in…' : 'Sign in' }}
      </button>
    </form>
  `,
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  /** Query param set by the auth guard. */
  readonly returnUrl = input<string>();
  protected readonly serverError = signal<string | null>(null);

  protected readonly model = signal({ email: '', password: '' });
  protected readonly loginForm = form(
    this.model,
    (path) => {
      required(path.email, { message: 'Email is required' });
      email(path.email);
      required(path.password, { message: 'Password is required' });
    },
    { submission: { action: () => this.submit() } },
  );

  private async submit(): Promise<undefined> {
    this.serverError.set(null);
    try {
      await firstValueFrom(this.auth.login(this.model()));
      await this.router.navigateByUrl(this.safeReturnUrl());
    } catch (error) {
      this.serverError.set(errorMessage(error, 'Could not sign in'));
    }
    return undefined;
  }

  /** Only allow in-app paths, to avoid open redirects. */
  private safeReturnUrl(): string {
    const url = this.returnUrl();
    return url?.startsWith('/') && !url.startsWith('//') ? url : '/bots';
  }
}
