import { HttpClient } from '@angular/common/http';
import { Service, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  Observable,
  catchError,
  finalize,
  map,
  of,
  shareReplay,
  switchMap,
  tap,
  throwError,
} from 'rxjs';

import { API_URL } from '../http/api-url';
import { LoginRequest, RegisterRequest, TokenPair, User } from './auth.models';
import { TokenStorage } from './token-storage';

@Service()
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly storage = inject(TokenStorage);

  private readonly tokens = signal<TokenPair | null>(this.storage.read());
  private readonly currentUser = signal<User | null>(null);
  private refreshInFlight: Observable<string> | null = null;

  readonly user = this.currentUser.asReadonly();
  readonly isAuthenticated = computed(() => this.tokens() !== null);
  readonly accessToken = computed(() => this.tokens()?.access_token ?? null);
  readonly initials = computed(() =>
    (this.currentUser()?.full_name ?? '')
      .split(' ')
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase(),
  );

  login(credentials: LoginRequest): Observable<User> {
    return this.http.post<TokenPair>(`${API_URL}/auth/login`, credentials).pipe(
      tap((tokens) => this.setTokens(tokens)),
      switchMap(() => this.loadUser()),
    );
  }

  register(data: RegisterRequest): Observable<User> {
    return this.http
      .post<User>(`${API_URL}/auth/register`, data)
      .pipe(switchMap(() => this.login({ email: data.email, password: data.password })));
  }

  loadUser(): Observable<User> {
    return this.http
      .get<User>(`${API_URL}/auth/me`)
      .pipe(tap((user) => this.currentUser.set(user)));
  }

  /** Restores the session on startup. Never fails: an invalid session just logs out. */
  restoreSession(): Observable<unknown> {
    if (!this.tokens()) {
      return of(null);
    }
    return this.loadUser().pipe(catchError(() => of(this.clearSession())));
  }

  /**
   * Exchanges the refresh token for a new pair. Concurrent callers share a single request,
   * so a burst of 401s triggers only one refresh (important with rotating refresh tokens).
   */
  refreshAccessToken(): Observable<string> {
    const refreshToken = this.tokens()?.refresh_token;
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token'));
    }
    this.refreshInFlight ??= this.http
      .post<TokenPair>(`${API_URL}/auth/refresh`, { refresh_token: refreshToken })
      .pipe(
        tap((tokens) => this.setTokens(tokens)),
        map((tokens) => tokens.access_token),
        catchError((error: unknown) => {
          this.clearSession();
          return throwError(() => error);
        }),
        finalize(() => (this.refreshInFlight = null)),
        shareReplay({ bufferSize: 1, refCount: false }),
      );
    return this.refreshInFlight;
  }

  logout(): void {
    const refreshToken = this.tokens()?.refresh_token;
    if (refreshToken) {
      this.http
        .post(`${API_URL}/auth/logout`, { refresh_token: refreshToken })
        .pipe(catchError(() => of(null)))
        .subscribe();
    }
    this.clearSession();
    void this.router.navigate(['/login']);
  }

  private setTokens(tokens: TokenPair): void {
    this.tokens.set(tokens);
    this.storage.write(tokens);
  }

  private clearSession(): null {
    this.tokens.set(null);
    this.currentUser.set(null);
    this.storage.write(null);
    return null;
  }
}
