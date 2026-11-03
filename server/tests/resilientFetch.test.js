const { afterEach, describe, test } = require('node:test');
const assert = require('node:assert/strict');
const { fetchWithRetry } = require('../resilientFetch');

const originalFetch = global.fetch;
const originalWarn = console.warn;

afterEach(() => {
  global.fetch = originalFetch;
  console.warn = originalWarn;
});

describe('fetchWithRetry', () => {
  test('retries 5xx responses at most twice with increasing delays', async () => {
    let calls = 0;
    const warnings = [];
    global.fetch = async () => {
      calls += 1;
      return new Response('unavailable', { status: 503 });
    };
    console.warn = (message) => warnings.push(message);

    const response = await fetchWithRetry('http://partner.test', {}, { delayMs: 1 });

    assert.equal(response.status, 503);
    assert.equal(calls, 3);
    assert.deepEqual(warnings, [
      'Partner request failed; retrying in 1 ms',
      'Partner request failed; retrying in 2 ms',
    ]);
  });

  test('does not retry a 4xx response', async () => {
    let calls = 0;
    global.fetch = async () => {
      calls += 1;
      return new Response('not found', { status: 404 });
    };

    const response = await fetchWithRetry('http://partner.test');

    assert.equal(response.status, 404);
    assert.equal(calls, 1);
  });

  test('does not retry a write request', async () => {
    let calls = 0;
    global.fetch = async () => {
      calls += 1;
      return new Response('unavailable', { status: 503 });
    };

    const response = await fetchWithRetry(
      'http://partner.test',
      { method: 'POST' },
      { delayMs: 1 }
    );

    assert.equal(response.status, 503);
    assert.equal(calls, 1);
  });

  test('honors Retry-After for 429 responses', async () => {
    let calls = 0;
    const startedAt = Date.now();
    global.fetch = async () => {
      calls += 1;
      return calls === 1
        ? new Response('slow down', { status: 429, headers: { 'Retry-After': '1' } })
        : new Response('ok', { status: 200 });
    };

    const response = await fetchWithRetry('http://partner.test');

    assert.equal(response.status, 200);
    assert.equal(calls, 2);
    assert.ok(Date.now() - startedAt >= 900);
  });

  test('retries connection errors no more than twice', async () => {
    let calls = 0;
    const warnings = [];
    global.fetch = async () => {
      calls += 1;
      throw new TypeError('connection failed');
    };
    console.warn = (message) => warnings.push(message);

    await assert.rejects(
      fetchWithRetry('http://partner.test', {}, { delayMs: 1 }),
      /connection failed/
    );
    assert.equal(calls, 3);
    assert.equal(warnings.length, 2);
  });

  test('applies a timeout to every attempt and stops after two retries', async () => {
    let calls = 0;
    global.fetch = (_url, { signal }) => {
      calls += 1;
      return new Promise((resolve, reject) => {
        const rejectOnAbort = () => reject(signal.reason);
        if (signal.aborted) {
          rejectOnAbort();
        } else {
          signal.addEventListener('abort', rejectOnAbort, { once: true });
        }
      });
    };

    await assert.rejects(
      fetchWithRetry('http://partner.test', {}, { timeoutMs: 10, delayMs: 1 }),
      (error) => error.name === 'TimeoutError'
    );
    assert.equal(calls, 3);
  });
});
