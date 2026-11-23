import { WidgetApi } from './api';
import { Widget, visitorId } from './widget';

/**
 * Entry point of widget.js:
 *   <script src="https://app.example.com/widget.js" data-bot="bot_xxx" defer></script>
 * The API lives on the same origin as the script unless `data-api` says otherwise.
 */
function boot(): void {
  const script = document.currentScript as HTMLScriptElement | null;
  const key = script?.dataset['bot'];
  if (!script || !key) {
    return;
  }
  const origin = script.dataset['api'] ?? new URL(script.src).origin;
  const host = document.createElement('div');
  host.id = 'ragdesk-widget';
  document.body.append(host);
  const widget = new Widget(host, new WidgetApi(`${origin}/api/v1`, key), visitorId());
  void widget.start();
}

boot();
