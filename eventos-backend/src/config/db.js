const mysql = require('mysql2/promise')
require('dotenv').config()

// Las fechas de los eventos se guardan como hora local de Querétaro (UTC-6, sin horario de verano).
// Sin esto el contenedor las lee como UTC y la web las muestra seis horas antes.
const rawTimezone = (process.env.DB_TIMEZONE || '').trim()
const DB_TIMEZONE = /^[+-]\d{2}:\d{2}$/.test(rawTimezone) ? rawTimezone : '-06:00'

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'evently_db',
  charset: 'utf8mb4',
  waitForConnections: true,
  connectionLimit: 10,
  namedPlaceholders: true,
  timezone: DB_TIMEZONE,
})

// NOW() y CURRENT_TIMESTAMP usan la misma zona que las fechas que escribe la API.
pool.on('connection', (connection) => {
  connection.query(`SET time_zone = '${DB_TIMEZONE}'`)
})

async function query(sql, params = {}) {
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
