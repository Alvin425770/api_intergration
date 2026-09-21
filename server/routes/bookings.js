const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /bookings?status=refunded&updatedSince=...
router.get('/', async (req, res) => {
  const { status, updatedSince } = req.query;

  if (!status || !updatedSince) {
    return res.status(400).json({ error: 'status and updatedSince are required query parameters' });
  }
  if (status !== 'refunded') {
    return res.status(400).json({ error: 'status must be "refunded"' });
  }

  try {
    const [rows] = await db.query(
      'SELECT id, status, reason_category, updated_at FROM bookings WHERE status = ? AND updated_at >= ?',
      [status, updatedSince]
    );

    const shaped = rows.map(row => ({
      id: String(row.id),
      status: row.status,
      reasonCategory: row.reason_category === 'property_mismatch' ? 'property_mismatch' : 'other',
      updatedAt: new Date(row.updated_at).toISOString()
    }));

    res.status(200).json(shaped);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// GET /bookings/:id/escrow-status
// NOTE: not currently defined in openapi.yaml — see CONTRACT_DEVIATIONS.md
router.get('/:id/escrow-status', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query('SELECT escrow_status FROM bookings WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    res.status(200).json({ escrowStatus: rows[0].escrow_status });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch escrow status' });
  }
});

module.exports = router;