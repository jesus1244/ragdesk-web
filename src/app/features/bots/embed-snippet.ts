/** The script tag a site owner pastes before </body>. The widget reads its own attributes. */
export function embedSnippet(origin: string, publicKey: string): string {
  return `<script src="${origin}/widget.js" data-bot="${publicKey}" defer></script>`;
}

/** A page that stands in for the owner's website, so the assistant can be tried before installing it. */
export function demoPageUrl(origin: string, publicKey: string): string {
  return `${origin}/widget-demo.html?bot=${encodeURIComponent(publicKey)}`;
}
