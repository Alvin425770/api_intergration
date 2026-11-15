const { test, afterEach } = require('node:test');
const assert = require('node:assert/strict');

const dbPath = require.resolve('../db');
const mysqlPath = require.resolve('mysql2');
const originalDb = require.cache[dbPath];
const originalMysql = require.cache[mysqlPath];

function loadDb(query) {
  delete require.cache[dbPath];
  require.cache[mysqlPath] = {
    id: mysqlPath,
    filename: mysqlPath,
    loaded: true,
    exports: {
      createPool: () => ({ promise: () => ({ query }) })
    }
  };
  return require('../db');
}

afterEach(() => {
  if (originalDb) require.cache[dbPath] = originalDb;
  else delete require.cache[dbPath];
  if (originalMysql) require.cache[mysqlPath] = originalMysql;
  else delete require.cache[mysqlPath];
});

test('a transient connection reset retries a SELECT once', async () => {
  let calls = 0;
  const db = loadDb(async () => {
    calls += 1;
    if (calls === 1) {
      const err = new Error('connection reset');
      err.code = 'ECONNRESET';
      throw err;
    }
    return [[{ id: 1 }]];
  });

  const [rows] = await db.query('SELECT id FROM listings');
  assert.deepEqual(rows, [{ id: 1 }]);
  assert.equal(calls, 2);
});

test('a transient connection reset never retries a write', async () => {
  let calls = 0;
  const db = loadDb(async () => {
    calls += 1;
    const err = new Error('connection reset');
    err.code = 'ECONNRESET';
    throw err;
  });

  await assert.rejects(db.query('DELETE FROM students WHERE id = ?', [1]), { code: 'ECONNRESET' });
  assert.equal(calls, 1);
});
