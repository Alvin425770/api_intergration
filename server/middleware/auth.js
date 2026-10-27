const path = require('path');
require('dotenv').config({path: path.join(__dirname, '../.env') });

//load keys from .env, split by comma, and trim whitespace
const VALID_KEYS = (process.env.API_KEYS || '')
    .split(',')
    .map(k => k.trim())
    .filter(Boolean);

function requireApiKey(req, res, next) {
    //allow root health check endpoint to remain public (GET /)
    if (req.path == '/' && req.method === 'GET') {
        return next();
    }

    //look for the X-API-key header
    const key = req.get('X-API-Key');

    //if header is missing or not in our authorized list, reject with 401
    if (!key || !VALID_KEYS.includes(key)) {
        return res.status(401).json({ message: 'Missing or invalid API key'});
    }

    //attach key to request object for downstream use (e.g. rate limiting)
    req.apiKey = key;
    next();
}

module.exports = { requireApiKey };