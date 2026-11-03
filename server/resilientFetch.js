const RETRY_STATUSES = new Set([429]);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function retryDelay(response, fallbackMs) {
  if (!RETRY_STATUSES.has(response.status)) return fallbackMs;

  const retryAfter = response.headers.get('Retry-After');
  if (!retryAfter) return fallbackMs;

  const seconds = Number(retryAfter);
  const requestedMs = Number.isFinite(seconds)
    ? seconds * 1000
    : Date.parse(retryAfter) - Date.now();

  return Number.isFinite(requestedMs) && requestedMs > 0
    ? Math.min(requestedMs, 5000)
    : fallbackMs;
}

async function fetchWithRetry(url, options = {}, config = {}) {
  const { timeoutMs = 1500, retries = 2, delayMs = 200 } = config;
  const method = (options.method || 'GET').toUpperCase();
  const maxRetries = method === 'GET' ? retries : 0;

  for (let attempt = 0; ; attempt += 1) {
    let wait = delayMs * 2 ** attempt;

    try {
      const response = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(timeoutMs),
      });

      const shouldRetry = response.status === 429 || response.status >= 500;
      if (!shouldRetry || attempt >= maxRetries) return response;

      wait = retryDelay(response, wait);
      await response.body?.cancel();
    } catch (error) {
      if (attempt >= maxRetries) throw error;
    }

    console.warn(`Partner request failed; retrying in ${wait} ms`);
    await sleep(wait);
  }
}

module.exports = { fetchWithRetry };
