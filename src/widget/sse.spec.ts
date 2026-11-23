import { SseEvent, createSseParser } from './sse';

function collect(chunks: string[]): SseEvent[] {
  const events: SseEvent[] = [];
  const push = createSseParser((e) => events.push(e));
  chunks.forEach(push);
  return events;
}

describe('createSseParser', () => {
  it('parses named events with JSON data', () => {
    expect(collect(['event: delta\ndata: {"text":"Hi"}\n\n'])).toEqual([
      { event: 'delta', data: '{"text":"Hi"}' },
    ]);
  });

  it('handles events split across chunks, even mid-line', () => {
    const events = collect([
      'event: del',
      'ta\ndata: {"te',
      'xt":"Hi"}\n',
      '\nevent: done\ndata: {}\n\n',
    ]);
    expect(events.map((e) => e.event)).toEqual(['delta', 'done']);
    expect(events[0].data).toBe('{"text":"Hi"}');
  });

  it('accepts CRLF line endings', () => {
    expect(collect(['event: meta\r\ndata: {"a":1}\r\n\r\n'])).toEqual([
      { event: 'meta', data: '{"a":1}' },
    ]);
  });

  it('joins multi-line data and defaults the event name', () => {
    expect(collect(['data: one\ndata: two\n\n'])).toEqual([{ event: 'message', data: 'one\ntwo' }]);
  });

  it('ignores comments, keep-alives and incomplete trailing events', () => {
    expect(collect([': ping\n\n', 'event: delta\ndata: {"text":"x"}'])).toEqual([]);
  });
});
