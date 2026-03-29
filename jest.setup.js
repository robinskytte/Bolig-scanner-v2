// Jest setup — polyfills for Node/jsdom test environment

// TextEncoder / TextDecoder are used by ReadableStream (streaming.ts)
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// ReadableStream / WritableStream — available in Node 18+ but not in jsdom
if (typeof global.ReadableStream === 'undefined') {
  const streams = require('stream/web');
  global.ReadableStream = streams.ReadableStream;
  global.WritableStream = streams.WritableStream;
  global.TransformStream = streams.TransformStream;
}

// fetch polyfill — Node 18+ has fetch but jsdom may shadow it
if (typeof global.fetch === 'undefined') {
  const nodeFetch = require('node-fetch');
  global.fetch = nodeFetch;
  global.Headers = nodeFetch.Headers;
  global.Request = nodeFetch.Request;
  global.Response = nodeFetch.Response;
}
