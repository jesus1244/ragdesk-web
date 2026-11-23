import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { DocumentsTab } from './documents-tab';
import { Source } from './source.models';

const source = (over: Partial<Source> = {}): Source => ({
  id: 's1',
  kind: 'file',
  name: 'handbook.pdf',
  url: null,
  status: 'ready',
  error: null,
  chunk_count: 12,
  created_at: '2026-11-23T10:00:00Z',
  ...over,
});

function setup() {
  TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
  const http = TestBed.inject(HttpTestingController);
  const fixture = TestBed.createComponent(DocumentsTab);
  fixture.componentRef.setInput('id', 'bot-1');
  const el = fixture.nativeElement as HTMLElement;
  const list = (items: Source[]) =>
    vi
      .waitFor(() => http.expectOne((r) => r.url === '/api/v1/bots/bot-1/sources'))
      .then((req) => {
        req.flush({ items, total: items.length, limit: 100, offset: 0 });
      });
  return { http, fixture, el, list };
}

describe('DocumentsTab', () => {
  it('lists documents with their status and passage count', async () => {
    const { fixture, el, list } = setup();
    await list([
      source(),
      source({ id: 's2', name: 'old.pdf', status: 'failed', error: 'Bad PDF' }),
    ]);
    await vi.waitFor(() => expect(el.textContent).toContain('handbook.pdf'));
    expect(el.textContent).toContain('12 passages');
    expect(el.textContent).toContain('Bad PDF');
    expect(el.textContent).toContain('Retry');
    fixture.destroy();
  });

  it('shows an empty state', async () => {
    const { fixture, el, list } = setup();
    await list([]);
    await vi.waitFor(() => expect(el.textContent).toContain('No documents yet'));
    fixture.destroy();
  });

  it('adds a pasted text and reloads the list', async () => {
    const { http, fixture, el, list } = setup();
    await list([]);
    await vi.waitFor(() => expect(el.textContent).toContain('No documents yet'));

    [...el.querySelectorAll('button')].find((b) => b.textContent?.includes('Paste text'))?.click();
    await fixture.whenStable();
    el.querySelector<HTMLInputElement>('form input')!.value = 'Policy';
    el.querySelector<HTMLTextAreaElement>('form textarea')!.value = 'Refunds in 14 days';
    el.querySelector<HTMLFormElement>('form')!.requestSubmit();

    const post = await vi.waitFor(() => http.expectOne((r) => r.method === 'POST'));
    expect(post.request.url).toBe('/api/v1/bots/bot-1/sources/text');
    expect(post.request.body).toEqual({ name: 'Policy', text: 'Refunds in 14 days' });
    post.flush(source({ name: 'Policy', status: 'ready' }));
    await list([source({ name: 'Policy' })]);
    await vi.waitFor(() => expect(el.textContent).toContain('Policy'));
    fixture.destroy();
  });

  it('deletes a document from the list', async () => {
    const { http, fixture, el, list } = setup();
    await list([source()]);
    await vi.waitFor(() => expect(el.textContent).toContain('handbook.pdf'));
    el.querySelector<HTMLButtonElement>('[aria-label="Delete handbook.pdf"]')!.click();
    const del = await vi.waitFor(() => http.expectOne((r) => r.method === 'DELETE'));
    del.flush(null, { status: 204, statusText: 'No Content' });
    await vi.waitFor(() => expect(el.textContent).not.toContain('handbook.pdf'));
    fixture.destroy();
  });

  it('shows an error when loading fails', async () => {
    const { http, fixture, el } = setup();
    const req = await vi.waitFor(() =>
      http.expectOne((r) => r.url === '/api/v1/bots/bot-1/sources'),
    );
    req.flush({ code: 'x', message: 'Server unavailable' }, { status: 500, statusText: 'Error' });
    await vi.waitFor(() =>
      expect(el.querySelector('[role="alert"]')?.textContent).toContain('Server unavailable'),
    );
    fixture.destroy();
  });
});
