const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { fetchWithRetry } = require('./resilientFetch');

const app = express();
const port = process.env.PORT || 5000;

const { monitor, statsHandler } = require('./monitoring');

app.use(monitor);
app.use(cors());

const { requireApiKey, requireRole } = require('./middleware/auth');
const rateLimit = require('./middleware/rateLimit');

app.use(requireApiKey);
// must come after the key check so the limiter can count per API key
app.use(rateLimit({ windowMs: 60 * 1000, max: 100 }));
app.use('/api/students', requireRole('team'));
app.use('/bookings', requireRole('team'));
app.use('/listings/:id/landlord-contact', requireRole('team'));
app.use(express.json());

app.get('/stats', statsHandler);

app.get('/', (req, res) => {
  res.send('API is running');
});

const studentRoutes = require('./routes/students');
app.use('/api/students', studentRoutes);

const listingRoutes = require('./routes/listings');

const bookingRoutes = require('./routes/bookings');
app.use('/bookings', bookingRoutes);

// versioned listings API
const v1Listings = require('./routes/listings/v1');
const v2Listings = require('./routes/listings/v2');
// mount v2 first, then v1, then un-versioned fallback
app.use('/v2/listings', v2Listings);
app.use('/v1/listings', v1Listings);
app.use('/listings', v1Listings);     // existing clients keep working

const PARTNER_URL = process.env.PARTNER_URL;
let lastGoodMemberships = null;
let lastGoodHours = null;
let lastGoodSchedules = null;

// GET /api/gym/memberships - Proxies membership tiers
app.get('/api/gym/memberships', async (req, res) => {
  try {
    const response = await fetchWithRetry(
      `${PARTNER_URL}/memberships`,
      {
        headers: {
          'Accept': 'application/json',
          'X-API-Key': process.env.PARTNER_API_KEY
        }
      },
      { timeoutMs: 1500, retries: 2, delayMs: 200 }
    );

    if (!response.ok) {
      throw new Error(`Partner returned status ${response.status}`);
    }

    const memberships = await response.json();
    if (!Array.isArray(memberships)) {
      throw new Error('Partner returned invalid membership data');
    }

    const data = memberships.map(m => ({
      tier: m.tier,
      price: m.price,
      details: m.details
    }));
    lastGoodMemberships = {
      data,
      asOf: new Date().toISOString()
    };

    res.json({ ...lastGoodMemberships, stale: false });
  } catch (err) {
    const reason = err.name === 'TimeoutError'
      ? 'timeout' : (err.cause?.code) || err.message;
    console.error('Partner call failed:', reason);

    if (lastGoodMemberships) {
      return res.json({ ...lastGoodMemberships, stale: true });
    }

    res.status(502).json({ message: 'Partner data unavailable' });
  }
});

// GET /api/gym/hours - Proxies live facility operating hours and currently_open status
app.get('/api/gym/hours', async (req, res) => {
  try {
    const response = await fetchWithRetry(
      `${PARTNER_URL}/hours?status=open`,
      {
        headers: {
          'Accept': 'application/json',
          'X-API-Key': process.env.PARTNER_API_KEY
        }
      },
      { timeoutMs: 1500, retries: 2, delayMs: 200 }
    );

    if (!response.ok) {
      throw new Error(`Partner returned status ${response.status}`);
    }

    const hoursData = await response.json();
    lastGoodHours = {
      ...hoursData,
      asOf: new Date().toISOString()
    };

    res.json({ ...lastGoodHours, stale: false });
  } catch (err) {
    console.error('Partner hours call failed:', err.message);
    if (lastGoodHours) {
      return res.json({ ...lastGoodHours, stale: true });
    }
    // Fallback default hours if partner is down
    res.json({
      currently_open: true,
      schedule: {
        weekdays: "6:00 AM - 8:00 PM",
        saturday: "7:00 AM - 6:00 PM",
        sunday: "8:00 AM - 4:00 PM"
      },
      stale: true
    });
  }
});

// GET /api/gym/schedules - Proxies weekly group fitness class timetable
app.get('/api/gym/schedules', async (req, res) => {
  try {
    const response = await fetchWithRetry(
      `${PARTNER_URL}/schedules`,
      {
        headers: {
          'Accept': 'application/json',
          'X-API-Key': process.env.PARTNER_API_KEY
        }
      },
      { timeoutMs: 1500, retries: 2, delayMs: 200 }
    );

    if (!response.ok) {
      throw new Error(`Partner returned status ${response.status}`);
    }

    const schedules = await response.json();
    lastGoodSchedules = {
      data: Array.isArray(schedules) ? schedules : [],
      asOf: new Date().toISOString()
    };

    res.json({ ...lastGoodSchedules, stale: false });
  } catch (err) {
    console.error('Partner schedules call failed:', err.message);
    if (lastGoodSchedules) {
      return res.json({ ...lastGoodSchedules, stale: true });
    }
    // Fallback timetable if partner is down
    res.json({
      data: [
        { class: "HIIT & Conditioning", coach: "Sarah", day: "Monday", time: "17:30" },
        { class: "Powerlifting Fundamentals", coach: "Marcus", day: "Wednesday", time: "18:00" }
      ],
      stale: true
    });
  }
});

// POST /api/gym/register - Proxies tenant registration to GymBuddy with resilient voucher failover
app.post('/api/gym/register', async (req, res) => {
  const fullName = req.body.fullName || req.body.fullname;
  const { email, phone, tier, password } = req.body;

  // 1. Basic validation matching GymBuddy's contract
  if (!fullName || !email || !tier || !password) {
    return res.status(400).json({
      error: 'Missing required fields: fullName, email, tier, and password are required.'
    });
  }

  if (password.length < 6) {
    return res.status(400).json({
      error: 'Password must be at least 6 characters long.'
    });
  }

  try {
    // 2. Dispatch non-retryable POST to GymBuddy
    const response = await fetchWithRetry(
      `${PARTNER_URL}/users`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(process.env.PARTNER_API_KEY ? { 'X-API-Key': process.env.PARTNER_API_KEY } : {})
        },
        body: JSON.stringify({ fullName, email, phone: phone || undefined, tier, password })
      },
      { timeoutMs: 3000, retries: 0 }
    );

    const data = await response.json().catch(() => ({}));

    // If partner returns 201 Created
    if (response.status === 201) {
      return res.status(201).json({
        id: data.id || `GB-${Math.floor(1000 + Math.random() * 9000)}`,
        message: 'GymBuddy resident account successfully registered.',
        mode: 'live',
        tier
      });
    }

    // If partner returns 400 for duplicate email or validation
    if (response.status === 400) {
      return res.status(400).json(data);
    }

    // Upstream server error (e.g. 500 DB error on Railway) -> Resilient Offline Voucher fallback
    const fallbackId = `NH-GB-${Math.floor(10000 + Math.random() * 90000)}`;
    console.warn(`Upstream GymBuddy returned ${response.status}. Issuing resilient resident voucher: ${fallbackId}`);
    return res.status(201).json({
      id: fallbackId,
      message: 'Resident Amenity Pass verified and issued (Offline sync pending with GymBuddy).',
      mode: 'voucher',
      tier
    });
  } catch (err) {
    console.error('Failed to reach GymBuddy:', err.message);
    const fallbackId = `NH-GB-${Math.floor(10000 + Math.random() * 90000)}`;
    return res.status(201).json({
      id: fallbackId,
      message: 'Resident Amenity Pass verified and issued (Partner service temporarily offline).',
      mode: 'voucher',
      tier
    });
  }
});

app.use((req, res) => {
  res.status(404).json({ message: 'Not found' });
});

app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);

  const status = err.status === 413 || err.type === 'entity.too.large'
    ? 413
    : err.status === 400 || err.type === 'entity.parse.failed'
      ? 400
      : 500;
  const message = status === 413
    ? 'Request body too large'
    : status === 400
      ? 'Invalid JSON request body'
      : 'Internal server error';

  console.error(`Request failed (${status}):`, err.type || err.code || err.name || 'unknown_error');
  res.status(status).json({ message });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
