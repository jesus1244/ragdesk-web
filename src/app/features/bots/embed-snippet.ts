/** The script tag a site owner pastes before </body>. The widget reads its own attributes. */
export function embedSnippet(origin: string, publicKey: string): string {
  return `<script src="${origin}/widget.js" data-bot="${publicKey}" defer></script>`;
}
