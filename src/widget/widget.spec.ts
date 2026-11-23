import { WidgetApi, toChatEvent } from './api';
import { Widget } from './widget';

function sse(...events: [string, unknown][]): string {
  return events.map(([name, data]) => `event: ${name}\ndata: ${JSON.stringify(data)}\n\n`).join('');
}

/** A fetch double that serves config and a streamed answer, in small chunks to exercise buffering. */
function fakeFetch(answer: string, status = 200, extraConfig: Record<string, unknown> = {}) {
  const calls: { url: string; body?: Record<string, unknown>; credentials?: string }[] = [];
  const fetcher = (async (url: string, init?: RequestInit) => {
    calls.push({
      url,
      body: init?.body ? JSON.parse(init.body as string) : undefined,
      credentials: init?.credentials,
    });
    if (url.includes('/public/bots/')) {
      return Response.json({
        name: 'Acme help',
        welcome_message: 'Hello from Acme',
        ...extraConfig,
      });
    }
    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        for (let i = 0; i < answer.length; i += 7) {
          controller.enqueue(encoder.encode(answer.slice(i, i + 7)));
        }
        controller.close();
      },
    });
    return new Response(status === 200 ? stream : null, { status });
  }) as typeof fetch;
  return { fetcher, calls };
}

function mount(answer: string, status = 200, extraConfig: Record<string, unknown> = {}) {
  const { fetcher, calls } = fakeFetch(answer, status, extraConfig);
  const host = document.createElement('div');
  document.body.append(host);
  const widget = new Widget(
    host,
    new WidgetApi('https://x.test/api/v1', 'bot_k', fetcher),
    'visitor-1',
  );
  const root = host.shadowRoot!;
  return {
    widget,
    root,
    calls,
    texts: () => [...root.querySelectorAll('.msg')].map((n) => n.textContent),
  };
}

describe('Widget', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('shows the welcome message from the assistant settings', async () => {
    const { widget, root } = mount('');
    await widget.start();
    expect(root.querySelector('header')?.textContent).toContain('Acme help');
    expect(root.querySelector('.msg.bot')?.textContent).toBe('Hello from Acme');
  });

  it('streams the answer and lists its sources', async () => {
    const { widget, root, texts } = mount(
      sse(
        ['meta', { conversation_id: 'c1' }],
        ['delta', { text: 'Refunds ' }],
        ['delta', { text: 'take 14 days.' }],
        [
          'citations',
          [{ index: 1, source_id: 's', source_name: 'policy.md', title: 'Refunds', snippet: 'x' }],
        ],
        ['done', { answered: true }],
      ),
    );
    await widget.start();
    await widget.ask('How long are refunds?');
    expect(texts()).toEqual(['Hello from Acme', 'How long are refunds?', 'Refunds take 14 days.']);
    expect(root.querySelector('.sources')?.textContent).toContain('[1] policy.md — Refunds');
  });

  it('never renders model output as HTML', async () => {
    const payload = '<img src=x onerror="window.pwned=1"><b>bold</b>';
    const { widget, root } = mount(
      sse(['delta', { text: payload }], ['done', { answered: false }]),
    );
    await widget.start();
    await widget.ask('hi');
    expect(root.querySelector('img')).toBeNull();
    expect(root.querySelector('b')).toBeNull();
    expect(root.querySelectorAll('.msg.bot')[1].textContent).toBe(payload);
  });

  it('keeps the conversation id for the next question and sends no credentials', async () => {
    const { widget, calls } = mount(
      sse(
        ['meta', { conversation_id: 'c42' }],
        ['delta', { text: 'ok' }],
        ['done', { answered: true }],
      ),
    );
    await widget.start();
    await widget.ask('first');
    await widget.ask('second');
    const chats = calls.filter((c) => c.url.includes('/public/chat/'));
    expect(chats[0].body).toMatchObject({
      question: 'first',
      conversation_id: null,
      visitor_id: 'visitor-1',
    });
    expect(chats[1].body).toMatchObject({ question: 'second', conversation_id: 'c42' });
    expect(chats.every((c) => c.credentials === 'omit')).toBe(true);
  });

  it('shows the error event message instead of an answer', async () => {
    const { widget, texts } = mount(sse(['error', { message: 'Please try again in a moment.' }]));
    await widget.start();
    await widget.ask('hi');
    expect(texts().at(-1)).toBe('Please try again in a moment.');
  });

  it('explains rate limiting', async () => {
    const { widget, texts } = mount('', 429);
    await widget.start();
    await widget.ask('hi');
    expect(texts().at(-1)).toContain('Too many questions');
  });

  it('ignores empty questions', async () => {
    const { widget, calls } = mount('');
    await widget.start();
    await widget.ask('   ');
    expect(calls.filter((c) => c.url.includes('/public/chat/'))).toHaveLength(0);
  });

  it('opens and closes the panel with accessible state', async () => {
    const { widget, root } = mount('');
    await widget.start();
    const launcher = root.querySelector<HTMLButtonElement>('.launcher')!;
    launcher.click();
    expect(root.querySelector<HTMLElement>('.panel')?.dataset['open']).toBe('true');
    expect(launcher.getAttribute('aria-expanded')).toBe('true');
    root.querySelector<HTMLButtonElement>('[aria-label="Close chat"]')!.click();
    expect(root.querySelector<HTMLElement>('.panel')?.dataset['open']).toBe('false');
  });
});

describe('toChatEvent', () => {
  it('drops malformed and unknown events', () => {
    expect(toChatEvent('delta', 'not json')).toBeNull();
    expect(toChatEvent('delta', '{"text":5}')).toBeNull();
    expect(toChatEvent('mystery', '{}')).toBeNull();
  });

  it('maps done and meta', () => {
    expect(toChatEvent('done', '{"answered":true}')).toEqual({ type: 'done', answered: true });
    expect(toChatEvent('meta', '{"conversation_id":"c"}')).toEqual({
      type: 'meta',
      conversationId: 'c',
    });
  });

  it('shows its own labels in the assistant language', async () => {
    const { widget, root } = mount('', 200, { language: 'es' });
    await widget.start();
    expect(root.querySelector('form button')?.textContent).toBe('Enviar');
    expect(root.querySelector('textarea')?.placeholder).toBe('Escribe tu pregunta…');
    expect(root.querySelector('.launcher')?.getAttribute('aria-label')).toBe('Abrir chat');
  });

  it('falls back to English for an unknown language', async () => {
    const { widget, root } = mount('', 200, { language: 'fr' });
    await widget.start();
    expect(root.querySelector('form button')?.textContent).toBe('Send');
  });

  it('offers the suggested questions and asks one when it is clicked', async () => {
    const { widget, root, calls } = mount(
      sse(['delta', { text: 'Five days.' }], ['done', { answered: true }]),
      200,
      { suggested_questions: ['How long is shipping?', 'What can I order?'] },
    );
    await widget.start();
    const chips = [...root.querySelectorAll<HTMLButtonElement>('.chips button')];
    expect(chips.map((c) => c.textContent)).toEqual(['How long is shipping?', 'What can I order?']);
    chips[0].click();
    await vi.waitFor(() =>
      expect(root.querySelector('.msg.bot:last-of-type')?.textContent).toBe('Five days.'),
    );
    expect(calls.at(-1)?.body?.['question']).toBe('How long is shipping?');
    expect(root.querySelector('.chips')).toBeNull();
  });

  it('shows no suggestion area when the owner set none', async () => {
    const { widget, root } = mount('');
    await widget.start();
    expect(root.querySelector('.chips')).toBeNull();
  });

  it('reports a rate limit in the assistant language', async () => {
    const { widget, texts } = mount('', 429, { language: 'es' });
    await widget.start();
    await widget.ask('Hola');
    expect(texts().at(-1)).toBe('Demasiadas preguntas, espera un momento.');
  });
});
