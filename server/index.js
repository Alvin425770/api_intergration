const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { fetchWithRetry } = require('./resilientFetch');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());

const { requireApiKey } = require('./middleware/auth');
const rateLimit = require('./middleware/rateLimit');

app.use(requireApiKey);
// must come after the key check so the limiter can count per API key
app.use(rateLimit({ windowMs: 60 * 1000, max: 100 }));
app.use(express.json());

app.get('/', (req, res) => {
  res.send('API is running');
});

const studentRoutes = require('./routes/students');
app.use('/api/students', studentRoutes);

const listingRoutes = require('./routes/listings');
app.use('/listings', listingRoutes);

const bookingRoutes = require('./routes/bookings');
app.use('/bookings', bookingRoutes);

const PARTNER_URL = process.env.PARTNER_URL;
let lastGoodMemberships = null;

app.get('/api/gym/memberships', async (req, res) => {
  try {
    const response = await fetchWithRetry(`${PARTNER_URL}/memberships`, {
      headers: {
        'Accept': 'application/json',
        'X-API-Key': process.env.PARTNER_API_KEY
      },
    }, { timeoutMs: 1500, retries: 2, delayMs: 200 });

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