const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
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

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});