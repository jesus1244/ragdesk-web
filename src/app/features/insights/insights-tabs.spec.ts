import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { ConversationsTab } from './conversations-tab';
import { UnansweredTab } from './unanswered-tab';

function setup<T>(component: new () => T) {
  TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
  const http = TestBed.inject(HttpTestingController);
  const fixture = TestBed.createComponent(component);
  fixture.componentRef.setInput('id', 'bot-1');
  const el = fixture.nativeElement as HTMLElement;
  const reply = async (path: string, body: object) => {
    const req = await vi.waitFor(() =>
      http.expectOne((r) => r.url === `/api/v1/bots/bot-1${path}`),
    );
    req.flush(body);
  };
  return { fixture, el, reply };
}

describe('ConversationsTab', () => {
  const stats = { conversations: 3, questions: 3, answered: 1, unanswered: 2, answer_rate: 0.333 };
  const page = (items: unknown[]) => ({ items, total: items.length, limit: 20, offset: 0 });

  it('shows the summary and the conversations', async () => {
    const { fixture, el, reply } = setup(ConversationsTab);
    await reply('/stats', stats);
    await reply(
      '/conversations',
      page([
        {
          id: 'c1',
          visitor_id: null,
          created_at: '2026-11-23T10:00:00Z',
          message_count: 2,
          last_question: 'How do refunds work?',
        },
      ]),
    );
    await vi.waitFor(() => expect(el.textContent).toContain('How do refunds work?'));
    expect(el.textContent).toContain('33%');
    expect(el.textContent).toContain('2 messages');
    fixture.destroy();
  });

  it('opens a transcript with the sources of each answer', async () => {
    const { fixture, el, reply } = setup(ConversationsTab);
    await reply('/stats', stats);
    await reply(
      '/conversations',
      page([
        {
          id: 'c1',
          visitor_id: null,
          created_at: '2026-11-23T10:00:00Z',
          message_count: 2,
          last_question: 'Refunds?',
        },
      ]),
    );
    await vi.waitFor(() => expect(el.textContent).toContain('Refunds?'));
    el.querySelector<HTMLButtonElement>('li button')!.click();
    await reply('/conversations/c1/messages', [
      {
        id: 'm1',
        role: 'user',
        content: 'Refunds?',
        citations: [],
        answered: null,
        created_at: '2026-11-23T10:00:00Z',
      },
      {
        id: 'm2',
        role: 'assistant',
        content: 'Within 14 days.',
        citations: [
          { index: 1, source_id: 's', source_name: 'policy.md', title: 'Refunds', snippet: 'x' },
        ],
        answered: true,
        created_at: '2026-11-23T10:00:01Z',
      },
    ]);
    await vi.waitFor(() => expect(el.textContent).toContain('Within 14 days.'));
    expect(el.textContent).toContain('[1] policy.md — Refunds');
    fixture.destroy();
  });

  it('uses the singular for a single message', async () => {
    const { fixture, el, reply } = setup(ConversationsTab);
    await reply('/stats', stats);
    await reply(
      '/conversations',
      page([
        {
          id: 'c1',
          visitor_id: null,
          created_at: '2026-11-23T10:00:00Z',
          message_count: 1,
          last_question: 'Hi',
        },
      ]),
    );
    await vi.waitFor(() => expect(el.textContent).toContain('1 message ·'));
    fixture.destroy();
  });

  it('shows an empty state without conversations', async () => {
    const { fixture, el, reply } = setup(ConversationsTab);
    await reply('/stats', {
      ...stats,
      conversations: 0,
      questions: 0,
      answered: 0,
      unanswered: 0,
      answer_rate: 0,
    });
    await reply('/conversations', page([]));
    await vi.waitFor(() => expect(el.textContent).toContain('No conversations yet'));
    fixture.destroy();
  });
});

describe('UnansweredTab', () => {
  it('lists the questions the documents could not answer', async () => {
    const { fixture, el, reply } = setup(UnansweredTab);
    await reply('/unanswered', {
      items: [
        {
          message_id: 'm1',
          conversation_id: 'c1',
          question: 'Do you ship to Mars?',
          created_at: '2026-11-23T10:00:00Z',
        },
      ],
      total: 1,
      limit: 50,
      offset: 0,
    });
    await vi.waitFor(() => expect(el.textContent).toContain('Do you ship to Mars?'));
    expect(el.textContent).toContain('Showing 1 of 1');
    fixture.destroy();
  });

  it('celebrates an empty list', async () => {
    const { fixture, el, reply } = setup(UnansweredTab);
    await reply('/unanswered', { items: [], total: 0, limit: 50, offset: 0 });
    await vi.waitFor(() => expect(el.textContent).toContain('Every question so far was answered'));
    fixture.destroy();
  });
});
