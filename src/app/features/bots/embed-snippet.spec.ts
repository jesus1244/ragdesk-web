import { demoPageUrl, embedSnippet } from './embed-snippet';

describe('embedSnippet', () => {
  it('builds a deferred script tag with the public key', () => {
    expect(embedSnippet('https://app.example.com', 'bot_abc')).toBe(
      '<script src="https://app.example.com/widget.js" data-bot="bot_abc" defer></script>',
    );
  });

  it('links to the demo page with the key encoded', () => {
    expect(demoPageUrl('https://app.example.com', 'bot_a b')).toBe(
      'https://app.example.com/widget-demo.html?bot=bot_a%20b',
    );
  });
});
