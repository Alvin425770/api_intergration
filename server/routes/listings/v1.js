// v1.js - FROZEN. Do not change the shape of anything in this file.
const express = require('express');
const router = express.Router();
const db = require('../../db');
const deprecate = require('../../middleware/deprecate');

router.use(deprecate({
  sunset: '2026-11-13',
  successor: '/v2/listings'
}));

// GET /listings?status=available&updatedSince=...  (original shape)
router.get('/', async (req, res) => {
  const { status, updatedSince } = req.query;

  if (!status || !updatedSince) {
    return res.status(400).json({
      code: 'invalid_query_param',
      message: 'status and updatedSince are required query parameters'
    });
  }
  if (status !== 'available') {
    return res.status(400).json({
      code: 'invalid_query_param',
      message: 'status must be "available"'
    });
  }

  try {
    const [rows] = await db.query(
      'SELECT id, status, previous_status, updated_at FROM listings WHERE status = ? AND updated_at >= ?',
      [status, updatedSince]
    );

    const listings = rows.map(row => ({
      id: String(row.id),
      status: row.status,
      reason: row.previous_status === 'rented' ? 'vacated' : 'newly_listed',
      updatedAt: new Date(row.updated_at).toISOString()
    }));

    res.status(200).json({ listings });       // <-- old shape: { listings: [...] }
  } catch (err) {
    console.error('Failed to fetch listings:', err.code || err.name);
    res.status(500).json({ code: 'internal_error', message: 'Failed to fetch listings' });
  }
});

module.exports = router;