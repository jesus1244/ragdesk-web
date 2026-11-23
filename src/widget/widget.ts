import { Citation, WidgetApi } from './api';

const STYLE = `
:host { all: initial; }
* { box-sizing: border-box; font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; }
.launcher { position: fixed; right: 20px; bottom: 20px; z-index: 2147483000; width: 56px; height: 56px;
  border-radius: 50%; border: 0; background: #0f766e; color: #fff; cursor: pointer;
  box-shadow: 0 6px 20px rgba(0,0,0,.25); font-size: 24px; }
.launcher:focus-visible, button:focus-visible, textarea:focus-visible { outline: 3px solid #5eead4; outline-offset: 2px; }
.panel { position: fixed; right: 20px; bottom: 88px; z-index: 2147483000; width: min(380px, calc(100vw - 24px));
  height: min(560px, calc(100vh - 110px)); display: none; flex-direction: column; background: #fff; color: #0f172a;
  border-radius: 16px; box-shadow: 0 12px 40px rgba(0,0,0,.28); overflow: hidden; }
.panel[data-open='true'] { display: flex; }
header { background: #0f766e; color: #fff; padding: 14px 16px; font-weight: 600; display: flex; justify-content: space-between; }
header button { background: none; border: 0; color: inherit; font-size: 20px; cursor: pointer; }
.log { flex: 1; overflow-y: auto; padding: 14px; display: flex; flex-direction: column; gap: 10px; background: #f8fafc; }
.msg { max-width: 88%; padding: 9px 12px; border-radius: 12px; font-size: 14px; line-height: 1.45; white-space: pre-wrap; overflow-wrap: anywhere; }
.msg.user { align-self: flex-end; background: #0f766e; color: #fff; }
.msg.bot { align-self: flex-start; background: #fff; border: 1px solid #e2e8f0; }
.sources { align-self: flex-start; font-size: 12px; color: #475569; margin: -4px 0 0 4px; }
.sources li { list-style: none; }
.sources ul { margin: 2px 0 0; padding: 0; }
form { display: flex; gap: 8px; padding: 10px; border-top: 1px solid #e2e8f0; background: #fff; }
textarea { flex: 1; resize: none; border: 1px solid #94a3b8; border-radius: 10px; padding: 8px 10px; font-size: 14px; max-height: 90px; }
form button { border: 0; border-radius: 10px; background: #0f766e; color: #fff; padding: 0 14px; font-weight: 600; cursor: pointer; }
form button:disabled { opacity: .5; cursor: not-allowed; }
@media (prefers-color-scheme: dark) { .panel { background: #0f172a; color: #e2e8f0; } .log { background: #020617; }
  .msg.bot { background: #1e293b; border-color: #334155; color: #e2e8f0; } form { background: #0f172a; border-color: #334155; }
  textarea { background: #020617; color: #e2e8f0; border-color: #64748b; } .sources { color: #94a3b8; } }
@media (prefers-reduced-motion: no-preference) { .panel { transition: opacity .15s; } }
`;

const MAX_QUESTION = 1000;
const VISITOR_KEY = 'ragdesk.visitor';

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) {
    node.className = className;
  }
  if (text !== undefined) {
    node.textContent = text; // never innerHTML: answers are untrusted
  }
  return node;
}

/** A random id kept in the visitor's browser so the owner can group their conversations. */
export function visitorId(storage: Storage | null = safeStorage()): string | null {
  try {
    let id = storage?.getItem(VISITOR_KEY) ?? null;
    if (!id) {
      id = crypto.randomUUID();
      storage?.setItem(VISITOR_KEY, id);
    }
    return id;
  } catch {
    return null;
  }
}

function safeStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export class Widget {
  private readonly root: ShadowRoot;
  private readonly panel = el('section', 'panel');
  private readonly launcher = el('button', 'launcher', '💬');
  private readonly log = el('div', 'log');
  private readonly input = el('textarea');
  private readonly send = el('button', undefined, 'Send');
  private conversationId: string | null = null;
  private busy = false;

  constructor(
    host: HTMLElement,
    private readonly api: WidgetApi,
    private readonly visitor: string | null,
  ) {
    this.root = host.attachShadow({ mode: 'open' });
    this.build();
  }

  async start(): Promise<void> {
    try {
      const config = await this.api.config();
      this.panel.setAttribute('aria-label', config.name);
      this.title.textContent = config.name;
      this.addMessage('bot', config.welcome_message);
    } catch {
      this.addMessage('bot', 'Hi! Ask me a question.');
    }
  }

  open(open: boolean): void {
    this.panel.dataset['open'] = String(open);
    this.launcher.setAttribute('aria-expanded', String(open));
    if (open) {
      this.input.focus();
    } else {
      this.launcher.focus();
    }
  }

  async ask(question: string): Promise<void> {
    const text = question.trim().slice(0, MAX_QUESTION);
    if (!text || this.busy) {
      return;
    }
    this.setBusy(true);
    this.addMessage('user', text);
    const answer = this.addMessage('bot', '…');
    let received = false;
    try {
      for await (const event of this.api.ask(text, this.conversationId, this.visitor)) {
        if (event.type === 'meta') {
          this.conversationId = event.conversationId;
        } else if (event.type === 'delta') {
          answer.textContent = received ? (answer.textContent ?? '') + event.text : event.text;
          received = true;
        } else if (event.type === 'citations') {
          this.addSources(event.citations);
        } else if (event.type === 'error') {
          answer.textContent = event.message;
        }
        this.log.scrollTop = this.log.scrollHeight;
      }
    } catch {
      answer.textContent = 'Sorry, something went wrong. Please try again.';
    } finally {
      this.setBusy(false);
    }
  }

  private readonly title = el('span', undefined, 'Assistant');

  private build(): void {
    const style = el('style');
    style.textContent = STYLE;

    this.launcher.type = 'button';
    this.launcher.setAttribute('aria-label', 'Open chat');
    this.launcher.setAttribute('aria-expanded', 'false');
    this.launcher.addEventListener('click', () => this.open(this.panel.dataset['open'] !== 'true'));

    this.panel.setAttribute('role', 'dialog');
    this.panel.setAttribute('aria-label', 'Assistant');
    this.panel.dataset['open'] = 'false';
    this.panel.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.open(false);
      }
    });

    const close = el('button', undefined, '×');
    close.type = 'button';
    close.setAttribute('aria-label', 'Close chat');
    close.addEventListener('click', () => this.open(false));
    const header = el('header');
    header.append(this.title, close);

    this.log.setAttribute('role', 'log');
    this.log.setAttribute('aria-live', 'polite');

    this.input.rows = 1;
    this.input.maxLength = MAX_QUESTION;
    this.input.placeholder = 'Ask a question…';
    this.input.setAttribute('aria-label', 'Your question');
    this.input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        void this.submit();
      }
    });
    this.send.type = 'submit';

    const form = el('form');
    form.append(this.input, this.send);
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      void this.submit();
    });

    this.panel.append(header, this.log, form);
    this.root.append(style, this.launcher, this.panel);
  }

  private async submit(): Promise<void> {
    const value = this.input.value;
    this.input.value = '';
    await this.ask(value);
  }

  private setBusy(busy: boolean): void {
    this.busy = busy;
    this.send.disabled = busy;
    this.log.setAttribute('aria-busy', String(busy));
  }

  private addMessage(who: 'user' | 'bot', text: string): HTMLElement {
    const node = el('div', `msg ${who}`, text);
    this.log.append(node);
    this.log.scrollTop = this.log.scrollHeight;
    return node;
  }

  private addSources(citations: Citation[]): void {
    if (citations.length === 0) {
      return;
    }
    const box = el('div', 'sources', 'Sources');
    const list = el('ul');
    for (const c of citations) {
      list.append(el('li', undefined, `[${c.index}] ${c.source_name} — ${c.title}`));
    }
    box.append(list);
    this.log.append(box);
  }
}
