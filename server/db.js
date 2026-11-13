const mysql = require('mysql2');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const poolConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  enableKeepAlive: true,
};

// Enable SSL automatically for cloud databases like TiDB
if (process.env.DB_SSL === 'true' || (process.env.DB_HOST && process.env.DB_HOST !== 'localhost' && process.env.DB_HOST !== '127.0.0.1')) {
  poolConfig.ssl = {
    minVersion: 'TLSv1.2',
    rejectUnauthorized: true,
  };
}

const pool = mysql.createPool(poolConfig).promise();
const transientConnectionErrors = new Set(['ECONNRESET', 'PROTOCOL_CONNECTION_LOST', 'EPIPE']);

async function query(sql, values) {
  try {
    return await pool.query(sql, values);
  } catch (err) {
    const retryableRead = /^\s*SELECT\b/i.test(sql) && transientConnectionErrors.has(err.code);
    if (!retryableRead) throw err;
    return pool.query(sql, values);
  }
}

module.exports = { query };
