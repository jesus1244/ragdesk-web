import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { authInterceptor } from './auth.interceptor';
import { AuthService } from './auth.service';

describe('authInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;
  const token = signal<string | null>('old-token');
  const auth = {
    accessToken: token,
    isAuthenticated: () => token() !== null,
    refreshAccessToken: vi.fn(),
    logout: vi.fn(),
  };

  beforeEach(() => {
    token.set('old-token');
    auth.refreshAccessToken.mockReset();
    auth.logout.mockReset();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: auth },
      ],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
  });

  afterEach(() => backend.verify());

  it('adds the bearer token to API calls', () => {
    http.get('/api/v1/documents').subscribe();
    const req = backend.expectOne('/api/v1/documents');
    expect(req.request.headers.get('Authorization')).toBe('Bearer old-token');
    req.flush({});
  });

  it('does not send the token to public auth endpoints or other origins', () => {
    http.post('/api/v1/auth/login', {}).subscribe();
    http.get('https://example.com/data').subscribe();
    expect(backend.expectOne('/api/v1/auth/login').request.headers.has('Authorization')).toBe(
      false,
    );
    expect(backend.expectOne('https://example.com/data').request.headers.has('Authorization')).toBe(
      false,
    );
  });

  it('refreshes once on 401 and retries with the new token', () => {
    auth.refreshAccessToken.mockReturnValue(of('new-token'));
    let body: unknown;
    http.get('/api/v1/documents').subscribe((b) => (body = b));

    backend.expectOne('/api/v1/documents').flush(null, { status: 401, statusText: 'Unauthorized' });
    const retry = backend.expectOne('/api/v1/documents');
    expect(retry.request.headers.get('Authorization')).toBe('Bearer new-token');
    retry.flush({ ok: true });

    expect(body).toEqual({ ok: true });
    expect(auth.refreshAccessToken).toHaveBeenCalledTimes(1);
  });

  it('logs out when the refresh fails', () => {
    auth.refreshAccessToken.mockReturnValue(throwError(() => new Error('expired')));
    let failed = false;
    http.get('/api/v1/documents').subscribe({ error: () => (failed = true) });

    backend.expectOne('/api/v1/documents').flush(null, { status: 401, statusText: 'Unauthorized' });
    expect(failed).toBe(true);
    expect(auth.logout).toHaveBeenCalled();
  });
});
