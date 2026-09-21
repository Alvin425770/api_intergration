const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /listings?status=available&updatedSince=...
router.get('/', async (req, res) => {
  const { status, updatedSince } = req.query;

  if (!status || !updatedSince) {
    return res.status(400).json({ error: 'status and updatedSince are required query parameters' });
  }
  if (status !== 'available') {
    return res.status(400).json({ error: 'status must be "available"' });
  }

  try {
    const [rows] = await db.query(
      'SELECT id, status, previous_status, updated_at FROM listings WHERE status = ? AND updated_at >= ?',
      [status, updatedSince]
    );

    const shaped = rows.map(row => ({
      id: String(row.id),
      status: row.status,
      reason: row.previous_status === 'rented' ? 'vacated' : 'newly_listed',
      updatedAt: new Date(row.updated_at).toISOString()
    }));

    res.status(200).json(shaped);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch listings' });
  }
});

// GET /listings/:id/landlord-contact
router.get('/:id/landlord-contact', async (req, res) => {
  const { id } = req.params;

  try {
    const [listingRows] = await db.query('SELECT id FROM listings WHERE id = ?', [id]);
    if (listingRows.length === 0) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    const [landlordRows] = await db.query(
      'SELECT name, phone, email, opted_in FROM landlords WHERE listing_id = ?',
      [id]
    );

    const landlord = landlordRows[0];

    if (!landlord || !landlord.opted_in) {
      return res.status(200).json({ available: false, contact: null });
    }

    res.status(200).json({
      available: true,
      contact: {
        name: landlord.name,
        phone: landlord.phone,
        email: landlord.email
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch landlord contact' });
  }
});

// GET /listings/:id/location
router.get('/:id/location', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query('SELECT area, city FROM listings WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Listing not found' });
    }
    res.status(200).json({ area: rows[0].area, city: rows[0].city });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch listing location' });
  }
});

// GET /listings/:id/size
router.get('/:id/size', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query('SELECT bedrooms, bathrooms FROM listings WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Listing not found' });
    }
    res.status(200).json({ bedrooms: rows[0].bedrooms, bathrooms: rows[0].bathrooms });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch listing size' });
  }
});

module.exports = router;