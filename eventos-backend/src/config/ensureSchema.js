const { query } = require('./db')

async function ensureSupportTable() {
  await query(
    `CREATE TABLE IF NOT EXISTS soporte_tickets (
       id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
       usuario_id   INT UNSIGNED NULL,
       nombre       VARCHAR(100) NOT NULL,
       email        VARCHAR(255) NOT NULL,
       asunto       VARCHAR(150) NOT NULL,
       mensaje      TEXT NOT NULL,
       estado       ENUM('pendiente','solucionado') NOT NULL DEFAULT 'pendiente',
       creado_en    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
       resuelto_en  DATETIME NULL,
       KEY idx_soporte_estado (estado),
       CONSTRAINT fk_soporte_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
     ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
  )
}

// Columnas que se llenan desde los .sql iniciales.
const SEEDED_TEXT = {
  categorias: ['nombre'],
  eventos: ['titulo', 'descripcion', 'ubicacion'],
  usuarios: ['ciudad'],
}

/**
 * El primer arranque cargó los .sql con el cliente en latin1 y los acentos quedaron
 * guardados dos veces codificados ("MÃºsica"). Esto deshace esa conversión.
 *
 * Solo toca un valor cuando el camino inverso es exacto: el texto cabe entero en latin1
 * y sus bytes forman UTF-8 válido. Un texto ya correcto no cumple lo segundo, así que
 * volver a ejecutarlo no cambia nada.
 */
async function repairSeedEncoding() {
  let fixed = 0

  for (const [table, columns] of Object.entries(SEEDED_TEXT)) {
    for (const column of columns) {
      const rows = await query(
        `SELECT id,
                ${column} AS original,
                CONVERT(CAST(CONVERT(${column} USING latin1) AS BINARY) USING utf8mb4) AS repaired,
                CAST(CONVERT(CONVERT(${column} USING latin1) USING utf8mb4) AS BINARY)
                  = CAST(${column} AS BINARY) AS lossless
         FROM ${table}
         WHERE ${column} IS NOT NULL`
      )

      for (const row of rows) {
        if (!Number(row.lossless) || row.repaired == null || row.repaired === row.original) continue
        try {
          await query(`UPDATE ${table} SET ${column} = :value WHERE id = :id`, {
            value: row.repaired,
            id: row.id,
          })
          fixed += 1
        } catch (err) {
          console.error(`[schema/encoding] ${table}.${column} #${row.id}: ${err.message}`)
        }
      }
    }
  }

  // El valor por defecto de la columna se creó con el mismo problema.
  await query(`ALTER TABLE usuarios ALTER COLUMN ciudad SET DEFAULT 'Querétaro'`)

  if (fixed) console.log(`Acentos corregidos en ${fixed} valores.`)
}

async function ensureSchema() {
  await ensureSupportTable()
  await repairSeedEncoding()
}

module.exports = { ensureSchema }
