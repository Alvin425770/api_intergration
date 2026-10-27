const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

//middleware placeholders (loaded safely)
const authMiddleware = require('./middleware/auth');
const rateLimitMiddleware = require('./middleware/rateLimiter');

if (authMiddleware.requireApiKey) app.use(authMiddleware.requireApiKey);
if (rateLimitMiddleware.rateLimiter) app.use(rateLimitMiddleware.rateLimiter);

app.get('/', (req, res) => {
  res.send('API is running');
});

const studentRoutes = require('./routes/students');
app.use('/api/students', studentRoutes);

const listingRoutes = require('./routes/listings');
app.use('/listings', listingRoutes);

const bookingRoutes = require('./routes/bookings');
app.use('/bookings', bookingRoutes);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

const PARTNER_URL = process.env.PARTNER_URL;

app.get('/api/gym/memberships', async (req, res) => {
  try {
    const response = await fetch(`${PARTNER_URL}/memberships`, {
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) {
      console.error('Partner returned status:', response.status);
      return res.status(502).json({ message: 'Partner data unavailable' });
    }

    const memberships = await response.json();
    
    // (Optional debug log during build - remember to remove before commit)
    // console.log('Raw partner response:', memberships);

    // Map according to GymBuddy contract: { tier, price, details }
    const formattedData = memberships.map(m => ({
      tier: m.tier,
      price: m.price,
      details: m.details
    }));

    res.json(formattedData);
  } catch (err) {
    // Crucial for Part D: catch connection errors (ECONNREFUSED, ENOTFOUND, etc.)
    console.error('Partner call failed:', err.cause?.code || err.message);
    res.status(502).json({ message: 'Partner data unavailable' });
  }
});

