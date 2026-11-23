import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Bot } from './bot.models';
import { CurrentBot } from './current-bot';
import { SettingsTab } from './settings-tab';

const bot: Bot = {
  id: 'b1',
  name: 'Support',
  public_key: 'bot_abc',
  welcome_message: 'Hi there',
  instructions: '',
  allowed_origins: ['https://a.com'],
  is_demo: false,
  created_at: '2026-11-23T10:00:00Z',
};

describe('SettingsTab', () => {
  function setup() {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    TestBed.inject(CurrentBot).bot.set(bot);
    const http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(SettingsTab);
    return { http, fixture, el: fixture.nativeElement as HTMLElement };
  }

  it('fills the form from the current assistant', async () => {
    const { fixture, el } = setup();
    await fixture.whenStable();
    const inputs = el.querySelectorAll<HTMLInputElement>('input');
    expect(inputs[0].value).toBe('Support');
    expect(el.querySelector<HTMLTextAreaElement>('textarea.font-mono')?.value).toBe(
      'https://a.com',
    );
  });

  it('sends the edited values, with origins as a list', async () => {
    const { http, fixture, el } = setup();
    await fixture.whenStable();
    const name = el.querySelector<HTMLInputElement>('input')!;
    name.value = 'Docs helper';
    name.dispatchEvent(new Event('input'));
    const origins = el.querySelector<HTMLTextAreaElement>('textarea.font-mono')!;
    origins.value = 'https://a.com\nhttps://b.com';
    origins.dispatchEvent(new Event('input'));
    el.querySelector<HTMLFormElement>('form')?.requestSubmit();
    await fixture.whenStable();

    const request = http.expectOne((r) => r.method === 'PATCH');
    expect(request.request.url).toBe('/api/v1/bots/b1');
    expect(request.request.body.name).toBe('Docs helper');
    expect(request.request.body.allowed_origins).toEqual(['https://a.com', 'https://b.com']);
    request.flush({ ...bot, name: 'Docs helper' });
    await vi.waitFor(() => expect(TestBed.inject(CurrentBot).bot()?.name).toBe('Docs helper'));
  });

  it('asks for confirmation before deleting', async () => {
    const { http, fixture, el } = setup();
    await fixture.whenStable();
    const remove = [...el.querySelectorAll('button')].find((b) =>
      b.textContent?.includes('Delete'),
    );
    remove?.click();
    await fixture.whenStable();
    http.expectNone((r) => r.method === 'DELETE');
    expect(el.textContent).toContain('Yes, delete it');
  });
});
