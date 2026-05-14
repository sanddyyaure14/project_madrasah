const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT
});

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Gagal konek ke database:', err.message);
  } else {
    console.log('Database Madrasah Siap di Port', process.env.DB_PORT);
  }
});

module.exports = pool;