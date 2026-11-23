import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { AuthService } from '../../core/auth/auth.service';
import { Login } from './login';

describe('Login', () => {
  const auth = { login: vi.fn() };

  function setup() {
    TestBed.configureTestingModule({
      imports: [Login],
      providers: [provideRouter([]), { provide: AuthService, useValue: auth }],
    });
    const fixture = TestBed.createComponent(Login);
    const el = fixture.nativeElement as HTMLElement;
    const type = (selector: string, value: string) => {
      const input = el.querySelector<HTMLInputElement>(selector)!;
      input.value = value;
      input.dispatchEvent(new Event('input'));
      input.dispatchEvent(new Event('blur'));
    };
    const submit = () =>
      el.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
    return { fixture, el, type, submit };
  }

  beforeEach(() => auth.login.mockReset());

  it('shows validation errors and does not call the API for an invalid form', async () => {
    const { fixture, el, type, submit } = setup();
    await fixture.whenStable();
    type('input[type=email]', 'not-an-email');
    submit();
    await fixture.whenStable();

    expect(auth.login).not.toHaveBeenCalled();
    expect(el.textContent).toContain('Enter a valid email address');
    expect(el.textContent).toContain('Password is required');
  });

  it('signs in and navigates to the assistants page', async () => {
    auth.login.mockReturnValue(of({}));
    const { fixture, type, submit } = setup();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    await fixture.whenStable();

    type('input[type=email]', 'ana@example.com');
    type('input[type=password]', 'Secret123');
    submit();
    await fixture.whenStable();

    expect(auth.login).toHaveBeenCalledWith({ email: 'ana@example.com', password: 'Secret123' });
    expect(navigate).toHaveBeenCalledWith('/bots');
  });

  it('shows the server error message', async () => {
    auth.login.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 401,
            error: { code: 'unauthorized', message: 'Invalid email or password' },
          }),
      ),
    );
    const { fixture, el, type, submit } = setup();
    await fixture.whenStable();
    type('input[type=email]', 'ana@example.com');
    type('input[type=password]', 'wrong');
    submit();
    await fixture.whenStable();

    expect(el.querySelector('[role=alert]')?.textContent).toContain('Invalid email or password');
  });
});
