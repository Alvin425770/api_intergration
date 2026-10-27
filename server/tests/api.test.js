// server/tests/api.test.js  (Part E: automated regression tests)
//
// Run from the server folder:   node --test tests/api.test.js
//
// Needs no extra packages: it uses Node's built-in test runner and fetch.
// The tests start the real server as a child process on spare ports, using
// throw-away API keys and a mock GymBuddy partner, so they do NOT need the
// real .env keys, the Railway partner or a working database.
// (Only requests that fail validation are sent to the DB routes, so the
// database is never queried.)
//
// Handout mapping (Week 9, Part E step 4):
//   - "request without a key gets 401"  -> describe('API key authentication')
//   - "valid key gets 200"              -> GET /api/gym/memberships with a valid key,
//                                          and GET / (public health check)

const { describe, test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const http = require('node:http');
const path = require('node:path');

const SERVER_DIR = path.join(__dirname, '..');

const MAIN_PORT = 5101; // server wired to the mock partner
const DEAD_PORT = 5102; // server whose partner is unreachable
const MOCK_PARTNER_PORT = 5103;

// Throw-away keys. Each group of tests uses its own key so a per-key rate
// limiter (Part C) cannot make unrelated tests fail.
const KEYS = {
  auth: 'test-key-auth',
  routes: 'test-key-routes',
  gym: 'test-key-gym',
  dead: 'test-key-dead',
  burst: 'test-key-burst',
  other: 'test-key-other',
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------- mock GymBuddy partner ----------
let partnerMode = 'ok'; // 'ok' | 'error'
const mockPartner = http.createServer((req, res) => {
  if (req.url === '/memberships') {
    if (partnerMode === 'error') {
      res.writeHead(500);
      return res.end('partner exploded');
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    // internal_cost is NOT in the contract and must never reach our clients
    return res.end(
      JSON.stringify([
        { tier: 'Test Tier', price: '100 KES', details: 'Test details', internal_cost: 42 },
      ])
    );
  }
  res.writeHead(404);
  res.end();
});

// ---------- helpers to start / stop the real server ----------
function startServer(port, partnerUrl) {
  const child = spawn(process.execPath, ['index.js'], {
    cwd: SERVER_DIR,
    env: {
      ...process.env,
      PORT: String(port),
      PARTNER_URL: partnerUrl,
      API_KEYS: Object.values(KEYS).join(','),
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let output = '';
  child.stdout.on('data', (d) => (output += d));
  child.stderr.on('data', (d) => (output += d));
  return { child, output: () => output };
}

async function waitUntilUp(port, srv, timeoutMs = 15000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (srv.child.exitCode !== null) {
      throw new Error(`Server exited early. Output:\n${srv.output()}`);
    }
    try {
      await fetch(`http://127.0.0.1:${port}/`);
      return;
    } catch {
      await sleep(200);
    }
  }
  throw new Error(`Server did not start on port ${port}. Output:\n${srv.output()}`);
}

async function stopServer(srv) {
  if (!srv || srv.child.exitCode !== null) return;
  await new Promise((resolve) => {
    srv.child.once('exit', resolve);
    srv.child.kill();
  });
}

// A port that is guaranteed to refuse connections (for the "partner down" test)
function getClosedPort() {
  return new Promise((resolve) => {
    const s = http.createServer().listen(0, () => {
      const { port } = s.address();
      s.close(() => resolve(port));
    });
  });
}

async function api(port, pathname, { key, method = 'GET', body, headers = {} } = {}) {
  const h = { ...headers };
  if (key) h['X-API-Key'] = key;
  if (body) h['Content-Type'] = 'application/json';
  const res = await fetch(`http://127.0.0.1:${port}${pathname}`, {
    method,
    headers: h,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* not JSON */
  }
  return { status: res.status, json, text, headers: res.headers };
}

// ---------- setup / teardown ----------
let mainServer;
let deadServer;

before(async () => {
  await new Promise((resolve) => mockPartner.listen(MOCK_PARTNER_PORT, resolve));

  mainServer = startServer(MAIN_PORT, `http://127.0.0.1:${MOCK_PARTNER_PORT}`);
  const closedPort = await getClosedPort();
  deadServer = startServer(DEAD_PORT, `http://127.0.0.1:${closedPort}`);

  await waitUntilUp(MAIN_PORT, mainServer);
  await waitUntilUp(DEAD_PORT, deadServer);
});

after(async () => {
  await stopServer(mainServer);
  await stopServer(deadServer);
  await new Promise((resolve) => mockPartner.close(resolve));
});

// =====================================================================
// Part A/B: API key authentication
// =====================================================================
describe('API key authentication', () => {
  test('GET / (health check) is public and needs no key', async () => {
    const r = await api(MAIN_PORT, '/');
    assert.equal(r.status, 200);
  });

  test('protected route without a key returns 401', async () => {
    const r = await api(MAIN_PORT, '/listings');
    assert.equal(r.status, 401);
    assert.equal(r.json.message, 'Missing or invalid API key');
  });

  test('protected route with a wrong key returns 401', async () => {
    const r = await api(MAIN_PORT, '/listings', { key: 'wrongkey' });
    assert.equal(r.status, 401);
    assert.equal(r.json.message, 'Missing or invalid API key');
  });

  test('key sent in the wrong header (Authorization) is rejected', async () => {
    const r = await api(MAIN_PORT, '/listings', {
      headers: { Authorization: `Bearer ${KEYS.auth}` },
    });
    assert.equal(r.status, 401);
  });

  test('a valid key gets past auth (reaches the route, which returns 400 for missing params)', async () => {
    const r = await api(MAIN_PORT, '/listings', { key: KEYS.auth });
    assert.equal(r.status, 400);
  });

  test('write routes are protected too: POST /api/students without a key returns 401', async () => {
    const r = await api(MAIN_PORT, '/api/students', {
      method: 'POST',
      body: { name: 'A', email: 'a@b.com', course: 'CS' },
    });
    assert.equal(r.status, 401);
  });

  test('DELETE /api/students/1 without a key returns 401', async () => {
    const r = await api(MAIN_PORT, '/api/students/1', { method: 'DELETE' });
    assert.equal(r.status, 401);
  });
});

// =====================================================================
// Input validation (these never reach the database)
// =====================================================================
describe('input validation', () => {
  test('GET /listings without status or updatedSince returns 400 invalid_query_param', async () => {
    const r = await api(MAIN_PORT, '/listings', { key: KEYS.routes });
    assert.equal(r.status, 400);
    assert.equal(r.json.code, 'invalid_query_param');
  });

  test('GET /listings with status but no updatedSince returns 400', async () => {
    const r = await api(MAIN_PORT, '/listings?status=available', { key: KEYS.routes });
    assert.equal(r.status, 400);
    assert.equal(r.json.code, 'invalid_query_param');
  });

  test('GET /listings with an unsupported status returns 400', async () => {
    const r = await api(MAIN_PORT, '/listings?status=rented&updatedSince=2026-01-01', {
      key: KEYS.routes,
    });
    assert.equal(r.status, 400);
    assert.equal(r.json.code, 'invalid_query_param');
  });

  test('GET /bookings without params returns 400 invalid_query_param', async () => {
    const r = await api(MAIN_PORT, '/bookings', { key: KEYS.routes });
    assert.equal(r.status, 400);
    assert.equal(r.json.code, 'invalid_query_param');
  });

  test('GET /bookings with a status other than "refunded" returns 400', async () => {
    const r = await api(MAIN_PORT, '/bookings?status=paid&updatedSince=2026-01-01', {
      key: KEYS.routes,
    });
    assert.equal(r.status, 400);
    assert.equal(r.json.code, 'invalid_query_param');
  });

  test('POST /api/students with missing fields returns 400', async () => {
    const r = await api(MAIN_PORT, '/api/students', {
      method: 'POST',
      key: KEYS.routes,
      body: { name: 'Only a name' },
    });
    assert.equal(r.status, 400);
    assert.equal(r.json.error, 'name, email, and course are required');
  });
});

// =====================================================================
// GymBuddy partner integration (/api/gym/memberships)
// =====================================================================
describe('GET /api/gym/memberships', () => {
  test('without a key returns 401', async () => {
    const r = await api(MAIN_PORT, '/api/gym/memberships');
    assert.equal(r.status, 401);
  });

  test('with a valid key returns 200 and only { tier, price, details }', async () => {
    partnerMode = 'ok';
    const r = await api(MAIN_PORT, '/api/gym/memberships', { key: KEYS.gym });
    assert.equal(r.status, 200);
    assert.ok(Array.isArray(r.json));
    assert.deepEqual(r.json, [
      { tier: 'Test Tier', price: '100 KES', details: 'Test details' },
    ]);
    // internal_cost from the partner must be stripped out
    assert.equal(r.json[0].internal_cost, undefined);
  });

  test('returns 502 "Partner data unavailable" when the partner answers with an error status', async () => {
    partnerMode = 'error';
    try {
      const r = await api(MAIN_PORT, '/api/gym/memberships', { key: KEYS.gym });
      assert.equal(r.status, 502);
      assert.equal(r.json.message, 'Partner data unavailable');
    } finally {
      partnerMode = 'ok';
    }
  });

  test('returns 502 "Partner data unavailable" when the partner is unreachable', async () => {
    const r = await api(DEAD_PORT, '/api/gym/memberships', { key: KEYS.dead });
    assert.equal(r.status, 502);
    assert.equal(r.json.message, 'Partner data unavailable');
  });
});

// =====================================================================
// Part C: rate limiting (Peace's work)
// Skipped by default. Run it once the rate limiter is merged AND wired into
// index.js (app.use(rateLimit(...)) after the key check):
//   PowerShell:  $env:RUN_RATE_LIMIT_TEST=1; node --test tests/api.test.js
// If your limit is higher than 200 per window, also set BURST_SIZE.
// =====================================================================
describe('rate limiting (per key)', () => {
  const skip = !process.env.RUN_RATE_LIMIT_TEST && 'set RUN_RATE_LIMIT_TEST=1 once Part C is merged and wired';
  const BURST = Number(process.env.BURST_SIZE || 200);

  test('a burst on one key returns 429 with Retry-After and a JSON body; another key is unaffected', { skip }, async () => {
    const statuses = [];
    let limited = null;
    for (let i = 0; i < BURST; i++) {
      const r = await api(MAIN_PORT, '/listings', { key: KEYS.burst });
      statuses.push(r.status);
      if (r.status === 429 && !limited) limited = r;
    }

    assert.equal(statuses[0], 400, 'first request should pass auth and the limiter (400 = missing params)');
    assert.ok(limited, 'expected at least one 429 during the burst');

    // Handout Part C step 4: Retry-After header and a JSON body
    assert.ok(Number(limited.headers.get('retry-after')) > 0, 'expected a Retry-After header');
    assert.equal(limited.json.message, 'Too many requests');
    assert.equal(typeof limited.json.retryAfter, 'number');

    const other = await api(MAIN_PORT, '/listings', { key: KEYS.other });
    assert.notEqual(other.status, 429, 'a different key must not be throttled');
  });
});