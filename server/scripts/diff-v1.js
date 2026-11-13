const fs = require('fs');
const path = require('path');
const assert = require('assert');
require('dotenv').config({ path: path.join(__dirname, '..', '.env'), quiet: true });

const url = process.env.V1_URL ||
  'http://localhost:5000/v1/listings?status=available&updatedSince=2020-01-01T00:00:00Z';
const apiKey = process.env.API_KEY || (process.env.TEAM_API_KEYS || process.env.API_KEYS || '').split(',')[0].trim();
const headers = apiKey ? { 'X-API-Key': apiKey } : {};
const read = p => JSON.parse(fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, ''));

(async () => {
  const before = read(path.join(__dirname, '..', '..', 'v1_before.json'));
  if (before.code) {
    console.error('v1_before.json is an error response. Retake the snapshot with the DB running.');
    process.exit(1);
  }
  const res = await fetch(url, { headers });
  const after = await res.json();
  fs.writeFileSync(path.join(__dirname, '..', '..', 'v1_after.json'), JSON.stringify(after));
  try {
    assert.deepStrictEqual(after, before);
    console.log('v1 unchanged');
  } catch (e) {
    console.error('v1 CHANGED\n', e.message);
    process.exit(1);
  }
})();