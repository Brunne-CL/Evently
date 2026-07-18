const mysql = require('mysql2/promise')
require('dotenv').config()

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'evently_db',
  waitForConnections: true,
  connectionLimit: 10,
  namedPlaceholders: true,
})

async function query(sql, params) {
  const [rows] = await pool.execute(sql, params)
  return rows
}

async function ping() {
  const conn = await pool.getConnection()
  try {
    await conn.ping()
    return true
  } finally {
    conn.release()
  }
}

module.exports = { pool, query, ping }
