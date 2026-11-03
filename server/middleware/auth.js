const path = require('path');
require('dotenv').config({path: path.join(__dirname, '../.env') });

//load keys from .env, split by comma, and trim whitespace
const VALID_KEYS = (process.env.API_KEYS || '')
    .split(',')
    .map(k => k.trim())
    .filter(Boolean);
const TEAM_KEYS = new Set(
    (process.env.TEAM_API_KEYS || '')
        .split(',')
        .map(k => k.trim())
        .filter(Boolean)
);

function requireApiKey(req, res, next) {
    // Keep the health check and public read-only memberships endpoint open.
    if (
        req.method === 'GET' &&
        (req.path === '/' || req.path === '/api/gym/memberships')
    ) {
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
    req.apiKeyRole = TEAM_KEYS.has(key) ? 'team' : 'partner';
    next();
}

function requireRole(role) {
    return (req, res, next) => {
        if (req.apiKeyRole !== role) {
            return res.status(403).json({ message: 'Insufficient permissions' });
        }
        next();
    };
}

module.exports = { requireApiKey, requireRole };