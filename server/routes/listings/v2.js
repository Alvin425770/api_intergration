// v2.js — New shape: { data: [...], count: N }
const express = require('express');
const router = express.Router();
const db = require('../../db');

const toV2 = row => ({
  id: String(row.id),
  status: row.status,
  reason: row.previous_status === 'rented' ? 'vacated' : 'newly_listed',
  updatedAt: new Date(row.updated_at).toISOString()
});

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

    res.status(200).json({
      data: rows.map(toV2),   // <-- new shape: { data: [...], count: N }
      count: rows.length
    });
  } catch (err) {
    console.error('Failed to fetch listings v2:', err.code || err.name);
    res.status(500).json({ code: 'internal_error', message: 'Failed to fetch listings' });
  }
});

module.exports = router;