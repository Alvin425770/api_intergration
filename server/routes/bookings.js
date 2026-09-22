const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /bookings?status=refunded&updatedSince=...
router.get('/', async (req, res) => {
  const { status, updatedSince } = req.query;

  if (!status || !updatedSince) {
    return res.status(400).json({
      code: 'invalid_query_param',
      message: 'status and updatedSince are required query parameters'
    });
  }
  if (status !== 'refunded') {
    return res.status(400).json({
      code: 'invalid_query_param',
      message: 'status must be "refunded"'
    });
  }

  try {
    const [rows] = await db.query(
      'SELECT id, listing_id, status, reason_category, updated_at FROM bookings WHERE status = ? AND updated_at >= ?',
      [status, updatedSince]
    );

    const bookings = rows.map(row => ({
      id: String(row.id),
      listingId: String(row.listing_id),
      status: row.status,
      refundReasonCategory: row.reason_category ?? 'other',
      updatedAt: new Date(row.updated_at).toISOString()
    }));

    res.status(200).json({ bookings });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 'internal_error', message: 'Failed to fetch bookings' });
  }
});

// GET /bookings/:id/escrow-status
router.get('/:id/escrow-status', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query(
      'SELECT id, escrow_status, updated_at FROM bookings WHERE id = ?',
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({
        code: 'booking_not_found',
        message: `No booking with id ${id}`
      });
    }
    res.status(200).json({
      bookingId: String(rows[0].id),
      escrowStatus: rows[0].escrow_status,
      updatedAt: new Date(rows[0].updated_at).toISOString()
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ code: 'internal_error', message: 'Failed to fetch escrow status' });
  }
});

module.exports = router;