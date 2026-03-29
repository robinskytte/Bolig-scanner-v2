// SSE streaming utilities

import { StreamEventType } from './types';

export function createSSEStream() {
  const encoder = new TextEncoder();
  let controller: ReadableStreamDefaultController | null = null;
  let closed = false;

  const stream = new ReadableStream({
    start(ctrl) {
      controller = ctrl;
    },
    cancel() {
      closed = true;
    },
  });

  function send(event: StreamEventType, data: unknown): void {
    if (closed || !controller) return;
    try {
      const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
      controller.enqueue(encoder.encode(payload));
    } catch (err) {
      console.error('[streaming] Failed to send event:', event, err);
    }
  }

  function close(): void {
    if (closed || !controller) return;
    closed = true;
    try {
      controller.close();
    } catch {
      // already closed
    }
  }

  function sendProgress(step: string, status: 'loading' | 'done' | 'error' | 'unavailable' | 'searching', message: string, source?: string): void {
    send('progress', { step, status, message, source, timestamp: new Date().toISOString() });
  }

  return { stream, send, close, sendProgress };
}

export function sseResponse(stream: ReadableStream): Response {
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    },
  });
}

// Safe wrapper for Promise.allSettled that extracts values
export async function safeAll<T>(
  promises: Promise<T>[]
): Promise<Array<T | null>> {
  const results = await Promise.allSettled(promises);
  return results.map((r) => (r.status === 'fulfilled' ? r.value : null));
}
