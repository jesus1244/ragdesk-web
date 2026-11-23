import { createSseParser } from './sse';
import { Strings, strings } from './strings';

export interface WidgetConfig {
  name: string;
  welcome_message: string;
  language?: string;
  suggested_questions?: string[];
}

export interface Citation {
  index: number;
  source_name: string;
  title: string;
}

export type ChatEvent =
  | { type: 'meta'; conversationId: string }
  | { type: 'delta'; text: string }
  | { type: 'citations'; citations: Citation[] }
  | { type: 'done'; answered: boolean }
  | { type: 'error'; message: string };

export class WidgetApiError extends Error {}

/** Maps a raw SSE event to a typed one. Unknown or malformed events are dropped. */
export function toChatEvent(
  name: string,
  raw: string,
  genericError: string = strings('en').genericError,
): ChatEvent | null {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }
  const record = (data ?? {}) as Record<string, unknown>;
  switch (name) {
    case 'meta':
      return typeof record['conversation_id'] === 'string'
        ? { type: 'meta', conversationId: record['conversation_id'] }
        : null;
    case 'delta':
      return typeof record['text'] === 'string' ? { type: 'delta', text: record['text'] } : null;
    case 'citations':
      return Array.isArray(data) ? { type: 'citations', citations: data as Citation[] } : null;
    case 'done':
      return { type: 'done', answered: record['answered'] === true };
    case 'error':
      return {
        type: 'error',
        message: typeof record['message'] === 'string' ? record['message'] : genericError,
      };
    default:
      return null;
  }
}

export class WidgetApi {
  /** Texts for the assistant's language; known once the config has been loaded. */
  private texts: Strings = strings(navigator.language);

  get ui(): Strings {
    return this.texts;
  }

  constructor(
    private readonly apiBase: string,
    private readonly botKey: string,
    private readonly fetcher: typeof fetch = (...args) => fetch(...args),
  ) {}

  async config(): Promise<WidgetConfig> {
    const response = await this.fetcher(`${this.apiBase}/public/bots/${this.botKey}`, {
      credentials: 'omit',
    });
    if (!response.ok) {
      throw new WidgetApiError(`Config request failed (${response.status})`);
    }
    const config = (await response.json()) as WidgetConfig;
    this.texts = strings(config.language);
    return config;
  }

  /** Streams the answer. The generator ends after `done` or `error`. */
  async *ask(
    question: string,
    conversationId: string | null,
    visitorId: string | null,
  ): AsyncGenerator<ChatEvent> {
    const response = await this.fetcher(`${this.apiBase}/public/chat/${this.botKey}`, {
      method: 'POST',
      credentials: 'omit',
      headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
      body: JSON.stringify({
        question,
        conversation_id: conversationId,
        visitor_id: visitorId,
      }),
    });
    if (!response.ok || !response.body) {
      const message = response.status === 429 ? this.texts.tooMany : this.texts.genericError;
      yield { type: 'error', message };
      return;
    }

    const queue: ChatEvent[] = [];
    const push = createSseParser((e) => {
      const parsed = toChatEvent(e.event, e.data, this.texts.genericError);
      if (parsed) {
        queue.push(parsed);
      }
    });
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    try {
      for (;;) {
        const { value, done } = await reader.read();
        if (done) {
          push(decoder.decode());
          break;
        }
        push(decoder.decode(value, { stream: true }));
        while (queue.length > 0) {
          const event = queue.shift() as ChatEvent;
          yield event;
          if (event.type === 'done' || event.type === 'error') {
            return;
          }
        }
      }
      while (queue.length > 0) {
        yield queue.shift() as ChatEvent;
      }
    } finally {
      void reader.cancel().catch(() => undefined);
    }
  }
}
