// traffic.js: sends a mix of requests to your API to generate monitoring data
// Run in PowerShell:
//   $env:API="http://localhost:5000"; $env:KEY="your_api_key"; $env:N=100; node traffic.js
const API = process.env.API || 'http://localhost:5000';
const KEY = process.env.KEY;
const N = Number(process.env.N || 60);

const mix = [
  { method: 'GET', path: '/listings?status=available&updatedSince=2026-01-01', key: true },
  { method: 'GET', path: '/listings/1/location', key: true },
  { method: 'GET', path: '/listings/99/location', key: true }, // no such id -> 404
  { method: 'GET', path: '/listings', key: false }, // no key -> 401
  { method: 'GET', path: '/api/gym/memberships', key: true }, // partner route
  { method: 'GET', path: '/not-a-route', key: true }, // 404
];

const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

(async () => {
  console.log(`Sending ${N} requests to ${API}...`);
  const counts = {};
  for (let i = 0; i < N; i++) {
    const r = mix[Math.floor(Math.random() * mix.length)];
    try {
      const res = await fetch(API + r.path, {
        method: r.method,
        headers: r.key ? { 'X-API-Key': KEY } : {},
      });
      counts[res.status] = (counts[res.status] || 0) + 1;
    } catch (err) {
      counts.failed = (counts.failed || 0) + 1;
    }
    await pause(50);
  }
  console.log('Status codes received:', counts);
})();
