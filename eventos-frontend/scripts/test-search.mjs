/**
 * Pruebas básicas del buscador in-site (Prácticas 3–4).
 * Ejecutar: npm run test:search
 */

function normalize(str = '') {
  return String(str)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function search(index, query) {
  const q = normalize(query.trim())
  if (!q) return []
  const tokens = q.split(/\s+/).filter(Boolean)
  const scored = []
  for (const item of index) {
    let score = 0
    let allMatch = true
    for (const tk of tokens) {
      const idx = item.keywords.indexOf(tk)
      if (idx === -1) {
        allMatch = false
        break
      }
      score += idx === 0 ? 3 : 1
      if (normalize(item.title).startsWith(tk)) score += 5
    }
    if (allMatch) scored.push({ ...item, score })
  }
  scored.sort((a, b) => b.score - a.score)
  return scored
}

const INDEX = [
  {
    id: 'event-1',
    title: 'Festival de Jazz en el Centro Histórico',
    keywords: normalize('Festival de Jazz en el Centro Histórico música Querétaro'),
  },
  {
    id: 'event-2',
    title: 'Feria de Tequisquiapan',
    keywords: normalize('Feria de Tequisquiapan gastronomía vino'),
  },
  {
    id: 'cat-1',
    title: 'Conciertos',
    keywords: normalize('Conciertos música live'),
  },
  {
    id: 'sec-1',
    title: 'Cómo funciona',
    keywords: normalize('como funciona pasos smartwatch'),
  },
]

const cases = [
  { q: 'jazz', expectId: 'event-1' },
  { q: 'tequis', expectId: 'event-2' },
  { q: 'conciertos', expectId: 'cat-1' },
  { q: 'smartwatch', expectId: 'sec-1' },
  { q: 'xyznoexiste', expectId: null },
]

let failed = 0
for (const { q, expectId } of cases) {
  const results = search(INDEX, q)
  const top = results[0]?.id ?? null
  const ok = top === expectId
  if (!ok) failed += 1
  console.log(
    ok ? 'PASS' : 'FAIL',
    `| query="${q}" → top=${top ?? '∅'} (esperado ${expectId ?? '∅'})`
  )
}

if (failed) {
  console.error(`\n${failed} prueba(s) fallaron`)
  process.exit(1)
}
console.log('\nTodas las pruebas básicas del buscador pasaron.')
