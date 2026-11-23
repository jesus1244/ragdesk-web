export interface SseEvent {
  event: string;
  data: string;
}

/**
 * Incremental Server-Sent Events parser. Feed it text as it arrives; chunks may split an event,
 * a line or even a multi-byte character boundary (the caller decodes with `stream: true`).
 */
export function createSseParser(onEvent: (event: SseEvent) => void): (chunk: string) => void {
  let buffer = '';

  const dispatch = (block: string): void => {
    let event = 'message';
    const data: string[] = [];
    for (const line of block.split('\n')) {
      if (line.startsWith(':') || line === '') {
        continue;
      }
      const colon = line.indexOf(':');
      const field = colon === -1 ? line : line.slice(0, colon);
      const value = colon === -1 ? '' : line.slice(colon + 1).replace(/^ /, '');
      if (field === 'event') {
        event = value;
      } else if (field === 'data') {
        data.push(value);
      }
    }
    if (data.length > 0) {
      onEvent({ event, data: data.join('\n') });
    }
  };

  return (chunk: string): void => {
    buffer += chunk.replace(/\r\n?/g, '\n');
    let end = buffer.indexOf('\n\n');
    while (end !== -1) {
      dispatch(buffer.slice(0, end));
      buffer = buffer.slice(end + 2);
      end = buffer.indexOf('\n\n');
    }
  };
}
