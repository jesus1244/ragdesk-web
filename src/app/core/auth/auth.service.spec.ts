import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { TokenPair, User } from './auth.models';
import { AuthService } from './auth.service';
import { TokenStorage } from './token-storage';

const tokens = (suffix: string): TokenPair => ({
  access_token: `access-${suffix}`,
  refresh_token: `refresh-${suffix}`,
  token_type: 'bearer',
  expires_in: 900,
});

const user: User = { id: 'u1', email: 'ana@example.com', full_name: 'Ana Pérez', created_at: '' };

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;
  let stored: TokenPair | null;

  beforeEach(() => {
    stored = null;
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: TokenStorage,
          useValue: { read: () => stored, write: (t: TokenPair | null) => (stored = t) },
        },
      ],
    });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('logs in, stores the tokens and loads the user', () => {
    let result: User | undefined;
    service.login({ email: user.email, password: 'Secret123' }).subscribe((u) => (result = u));

    http.expectOne('/api/v1/auth/login').flush(tokens('1'));
    http.expectOne('/api/v1/auth/me').flush(user);

    expect(result).toEqual(user);
    expect(service.isAuthenticated()).toBe(true);
    expect(service.accessToken()).toBe('access-1');
    expect(service.initials()).toBe('AP');
    expect(stored?.refresh_token).toBe('refresh-1');
  });

  it('shares one refresh request between concurrent callers', () => {
    service.login({ email: user.email, password: 'x' }).subscribe();
    http.expectOne('/api/v1/auth/login').flush(tokens('1'));
    http.expectOne('/api/v1/auth/me').flush(user);

    const results: string[] = [];
    service.refreshAccessToken().subscribe((t) => results.push(t));
    service.refreshAccessToken().subscribe((t) => results.push(t));

    const request = http.expectOne('/api/v1/auth/refresh');
    expect(request.request.body).toEqual({ refresh_token: 'refresh-1' });
    request.flush(tokens('2'));

    expect(results).toEqual(['access-2', 'access-2']);
    expect(service.accessToken()).toBe('access-2');
  });

  it('clears the session when the refresh fails', () => {
    service.login({ email: user.email, password: 'x' }).subscribe();
    http.expectOne('/api/v1/auth/login').flush(tokens('1'));
    http.expectOne('/api/v1/auth/me').flush(user);

    let failed = false;
    service.refreshAccessToken().subscribe({ error: () => (failed = true) });
    http
      .expectOne('/api/v1/auth/refresh')
      .flush({ code: 'unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    expect(failed).toBe(true);
    expect(service.isAuthenticated()).toBe(false);
    expect(stored).toBeNull();
  });
});
