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
  language: 'en',
  fallback_message: '',
  suggested_questions: ['What can I order?'],
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

  it('saves the language, the fallback message and the suggested questions', async () => {
    const { http, fixture, el } = setup();
    await fixture.whenStable();
    expect(el.querySelector<HTMLSelectElement>('select')?.value).toBe('en');
    const questions = el.querySelector<HTMLTextAreaElement>('textarea[placeholder^="How long"]')!;
    expect(questions.value).toBe('What can I order?');

    const language = el.querySelector<HTMLSelectElement>('select')!;
    language.value = 'es';
    language.dispatchEvent(new Event('input'));
    language.dispatchEvent(new Event('change'));
    questions.value = '¿Qué puedo pedir?\n\n¿Cuánto tarda el envío?\n¿Qué puedo pedir?';
    questions.dispatchEvent(new Event('input'));
    const fallback = el.querySelector<HTMLInputElement>('input[placeholder^="Email"]')!;
    fallback.value = '  Escríbenos a ayuda@tienda.com  ';
    fallback.dispatchEvent(new Event('input'));
    el.querySelector<HTMLFormElement>('form')?.requestSubmit();
    await fixture.whenStable();

    const body = http.expectOne((r) => r.method === 'PATCH').request.body;
    expect(body.language).toBe('es');
    expect(body.fallback_message).toBe('Escríbenos a ayuda@tienda.com');
    expect(body.suggested_questions).toEqual(['¿Qué puedo pedir?', '¿Cuánto tarda el envío?']);
  });
});
