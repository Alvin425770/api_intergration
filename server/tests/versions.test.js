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
  exports: { query: async () => [rows] }
};

const app = express();
app.use('/v2/listings', require('../routes/listings/v2'));
app.use('/v1/listings', require('../routes/listings/v1'));
app.use('/listings', require('../routes/listings/v1'));

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

test('v1 sends deprecation headers', async () => {
  const res = await fetch(`${base}/v1/listings${Q}`);
  assert.equal(res.headers.get('deprecation'), 'true');
  assert.ok(!Number.isNaN(Date.parse(res.headers.get('sunset'))));
  assert.match(res.headers.get('link'), /rel="deprecation"/);
});

test('un-versioned /listings fallback also sends deprecation headers', async () => {
  const res = await fetch(`${base}/listings${Q}`);
  assert.equal(res.headers.get('deprecation'), 'true');
});

test('v2 does NOT send deprecation headers', async () => {
  const res = await fetch(`${base}/v2/listings${Q}`);
  assert.equal(res.headers.get('deprecation'), null);
});

test('v1 still returns 400 for missing params', async () => {
  const res = await fetch(`${base}/v1/listings`);
  const body = await res.json();
  assert.equal(res.status, 400);
  assert.equal(body.code, 'invalid_query_param');
});