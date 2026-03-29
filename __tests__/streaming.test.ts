/**
 * SSE streaming utility tests
 */

import { describe, it, expect } from '@jest/globals';
import { createSSEStream, safeAll } from '../lib/streaming';

describe('createSSEStream', () => {
  it('creates stream, send and close functions', () => {
    const { stream, send, close, sendProgress } = createSSEStream();
    expect(stream).toBeInstanceOf(ReadableStream);
    expect(typeof send).toBe('function');
    expect(typeof close).toBe('function');
    expect(typeof sendProgress).toBe('function');
  });

  it('encodes events in SSE format', async () => {
    const { stream, send, close } = createSSEStream();
    const reader = stream.getReader();

    send('test_event', { hello: 'world' });
    close();

    const { value } = await reader.read();
    const text = new TextDecoder().decode(value);

    expect(text).toContain('event: test_event');
    expect(text).toContain('"hello":"world"');
    expect(text).toContain('\n\n');
  });

  it('handles close gracefully after events', () => {
    const { stream, send, close } = createSSEStream();
    expect(() => {
      send('event1', { data: 1 });
      send('event2', { data: 2 });
      close();
      // Sending after close should not throw
      send('event3', { data: 3 });
    }).not.toThrow();
  });
});

describe('safeAll', () => {
  it('returns values for fulfilled promises', async () => {
    const results = await safeAll([
      Promise.resolve(1),
      Promise.resolve(2),
      Promise.resolve(3),
    ]);
    expect(results).toEqual([1, 2, 3]);
  });

  it('returns null for rejected promises', async () => {
    const results = await safeAll([
      Promise.resolve(1),
      Promise.reject(new Error('fail')),
      Promise.resolve(3),
    ]);
    expect(results[0]).toBe(1);
    expect(results[1]).toBeNull();
    expect(results[2]).toBe(3);
  });

  it('handles all rejected promises', async () => {
    const results = await safeAll([
      Promise.reject(new Error('a')),
      Promise.reject(new Error('b')),
    ]);
    expect(results).toEqual([null, null]);
  });
});
