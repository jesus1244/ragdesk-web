import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Bot } from './bot.models';
import { BotsPage } from './bots-page';

const bot = (over: Partial<Bot> = {}): Bot => ({
  id: 'b1',
  name: 'Support',
  public_key: 'bot_abc',
  welcome_message: 'Hi there',
  instructions: '',
  allowed_origins: [],
  is_demo: false,
  created_at: '2026-11-23T10:00:00Z',
  ...over,
});

function setup() {
  TestBed.configureTestingModule({
    providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
  });
  const http = TestBed.inject(HttpTestingController);
  const fixture = TestBed.createComponent(BotsPage);
  return { http, fixture, el: fixture.nativeElement as HTMLElement };
}

describe('BotsPage', () => {
  it('lists the assistants returned by the API', async () => {
    const { http, fixture, el } = setup();
    http
      .expectOne((r) => r.url === '/api/v1/bots')
      .flush({ items: [bot(), bot({ id: 'b2', name: 'Docs', is_demo: true })], total: 2 });
    await fixture.whenStable();
    expect(el.textContent).toContain('Support');
    expect(el.textContent).toContain('Docs');
    expect(el.textContent).toContain('Demo');
  });

  it('shows an empty state when there are none', async () => {
    const { http, fixture, el } = setup();
    http.expectOne((r) => r.url === '/api/v1/bots').flush({ items: [], total: 0 });
    await fixture.whenStable();
    expect(el.textContent).toContain('You have no assistants yet');
  });

  it('shows the error message when loading fails', async () => {
    const { http, fixture, el } = setup();
    http
      .expectOne((r) => r.url === '/api/v1/bots')
      .flush({ code: 'boom', message: 'Database is down' }, { status: 500, statusText: 'Error' });
    await fixture.whenStable();
    expect(el.querySelector('[role="alert"]')?.textContent).toContain('Database is down');
  });

  it('does not call the API when the name is empty', async () => {
    const { http, fixture, el } = setup();
    http.expectOne((r) => r.url === '/api/v1/bots').flush({ items: [], total: 0 });
    await fixture.whenStable();
    el.querySelector<HTMLFormElement>('form')?.requestSubmit();
    await fixture.whenStable();
    http.expectNone((r) => r.method === 'POST');
    expect(el.textContent).toContain('Give the assistant a name');
  });

  it('creates an assistant and adds it to the list', async () => {
    const { http, fixture, el } = setup();
    http.expectOne((r) => r.url === '/api/v1/bots').flush({ items: [], total: 0 });
    await fixture.whenStable();

    const input = el.querySelector<HTMLInputElement>('input')!;
    input.value = 'Sales bot';
    input.dispatchEvent(new Event('input'));
    el.querySelector<HTMLFormElement>('form')?.requestSubmit();
    await fixture.whenStable();

    const request = http.expectOne((r) => r.method === 'POST');
    expect(request.request.body).toEqual({ name: 'Sales bot' });
    request.flush(bot({ id: 'b9', name: 'Sales bot' }));
    await vi.waitFor(() => expect(el.textContent).toContain('Sales bot'));
  });
});
