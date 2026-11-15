const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');

// Mock the db BEFORE the routers are required
const dbPath = require.resolve('../db');
const rows = [
  { id: 1, status: 'available', previous_status: 'rented', updated_at: '2026-11-01T10:00:00Z' },
  { id: 2, status: 'available', previous_status: null,     updated_at: '2026-11-02T10:00:00Z' }
];
require.cache[dbPath] = {
  id: dbPath, filename: dbPath, loaded: true,
  exports: {
    query: async (sql) => {
      if (sql.startsWith('SELECT area, city')) {
        return [[{ area: 'Kilimani', city: 'Nairobi' }]];
      }
      if (sql.startsWith('SELECT bedrooms, bathrooms')) {
        return [[{ bedrooms: 2, bathrooms: 1 }]];
      }
      return [rows];
    }
  }
};

const app = express();
const legacyListings = require('../routes/listings');
app.use('/v2/listings', require('../routes/listings/v2'));
app.use('/v1/listings', require('../routes/listings/v1'));
app.use('/v1/listings', legacyListings);
app.use('/listings', require('../routes/listings/v1'));
app.use('/listings', legacyListings);

let server, base;
before(() => new Promise(resolve => {
  server = app.listen(0, () => {
    base = `http://localhost:${server.address().port}`;
    resolve();
  });
}));
after(() => new Promise(resolve => server.close(resolve)));

const Q = '?status=available&updatedSince=2020-01-01T00:00:00Z';

test('v1 keeps the old shape { listings }', async () => {
  const res = await fetch(`${base}/v1/listings${Q}`);
  const body = await res.json();
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(body.listings));
  assert.equal(body.data, undefined);
  assert.equal(body.count, undefined);
  assert.deepEqual(Object.keys(body.listings[0]).sort(), ['id', 'reason', 'status', 'updatedAt']);
});

test('v2 uses the new shape { data, count }', async () => {
  const res = await fetch(`${base}/v2/listings${Q}`);
  const body = await res.json();
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(body.data));
  assert.equal(body.count, body.data.length);
  assert.equal(body.listings, undefined);
});

test('v1 and v2 items are identical', async () => {
  const v1 = await (await fetch(`${base}/v1/listings${Q}`)).json();
  const v2 = await (await fetch(`${base}/v2/listings${Q}`)).json();
  assert.deepEqual(v1.listings, v2.data);
});

test('reason mapping: rented -> vacated, otherwise newly_listed', async () => {
  const body = await (await fetch(`${base}/v2/listings${Q}`)).json();
  assert.equal(body.data[0].reason, 'vacated');
  assert.equal(body.data[1].reason, 'newly_listed');
});

test('v1 sends the notice sunset and v2 successor headers', async () => {
  const res = await fetch(`${base}/v1/listings${Q}`);
  assert.equal(res.headers.get('deprecation'), 'true');
  assert.equal(res.headers.get('sunset'), 'Fri, 13 Nov 2026 00:00:00 GMT');
  assert.equal(res.headers.get('link'), '</v2/listings>; rel="successor-version"');
});

test('un-versioned /listings fallback also sends deprecation headers', async () => {
  const res = await fetch(`${base}/listings${Q}`);
  assert.equal(res.headers.get('deprecation'), 'true');
});

test('v2 does NOT send deprecation headers', async () => {
  const res = await fetch(`${base}/v2/listings${Q}`);
  assert.equal(res.headers.get('deprecation'), null);
});

test('un-versioned listings return exactly the v1 body', async () => {
  const legacy = await fetch(`${base}/listings${Q}`);
  const v1 = await fetch(`${base}/v1/listings${Q}`);
  assert.equal(legacy.status, 200);
  assert.deepEqual(await legacy.json(), await v1.json());
});

test('legacy listing subroutes remain available beside versioned lists', async () => {
  for (const prefix of ['/listings', '/v1/listings']) {
    const location = await fetch(`${base}${prefix}/1/location`);
    assert.equal(location.status, 200);
    assert.deepEqual(await location.json(), { area: 'Kilimani', city: 'Nairobi' });
    assert.equal(location.headers.get('deprecation'), 'true');

    const size = await fetch(`${base}${prefix}/1/size`);
    assert.equal(size.status, 200);
    assert.deepEqual(await size.json(), { bedrooms: 2, bathrooms: 1 });
  }
});

test('unknown paths do not send deprecation headers', async () => {
  const res = await fetch(`${base}/nope`);
  assert.equal(res.status, 404);
  assert.equal(res.headers.get('deprecation'), null);
});

test('v2 keeps the required query validation', async () => {
  const missing = await fetch(`${base}/v2/listings`);
  assert.equal(missing.status, 400);
  assert.equal((await missing.json()).code, 'invalid_query_param');

  const unsupported = await fetch(`${base}/v2/listings?status=rented&updatedSince=2020-01-01`);
  assert.equal(unsupported.status, 400);
});

test('v1 still returns the complete original error shape', async () => {
  const res = await fetch(`${base}/v1/listings`);
  const body = await res.json();
  assert.equal(res.status, 400);
  assert.deepEqual(body, {
    code: 'invalid_query_param',
    message: 'status and updatedSince are required query parameters'
  });
});
