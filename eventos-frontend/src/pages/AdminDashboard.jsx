import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { apiAdminOverview } from '../lib/api.js'

const NAV = [
  { id: 'resumen', label: 'Resumen' },
  { id: 'eventos', label: 'Eventos' },
  { id: 'personas', label: 'Personas' },
  { id: 'reservas', label: 'Reservas' },
]

function formatWhen(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('es-MX', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function AdminDashboard() {
  const { user, login, logout, booting } = useAuth()
  const [section, setSection] = useState('resumen')
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user || user.role !== 'admin') return undefined
    let cancelled = false
    setLoading(true)
    setError('')
    apiAdminOverview().then((result) => {
      if (cancelled) return
      setLoading(false)
      if (!result.ok) setError(result.error || 'No se pudo cargar el panel.')
      else setData(result)
    })
    return () => {
      cancelled = true
    }
  }, [user])

  if (booting) {
    return <Shell><p className="text-sm text-neutral-500">Cargando sesión…</p></Shell>
  }

  if (!user) return <Gate login={login} />
  if (user.role !== 'admin') {
    return (
      <Shell>
        <p className="text-lg font-semibold">Esta cuenta no es de administrador.</p>
        <button type="button" onClick={logout} className="mt-4 text-sm underline">Cerrar sesión</button>
      </Shell>
    )
  }

  const maxCategory = Math.max(1, ...(data?.categories || []).map((item) => item.reservations))

  return (
    <div className="min-h-screen bg-[#f4f1ea] text-[#1a1a1a] md:grid md:grid-cols-[220px_1fr]">
      <aside className="bg-[#161616] text-white px-5 py-6 flex md:flex-col gap-6 md:min-h-screen">
        <div>
          <p className="text-[11px] tracking-[0.18em] uppercase text-white/50">Evently</p>
          <p className="text-lg font-semibold tracking-tight">Administración</p>
        </div>
        <nav className="flex md:flex-col gap-1 flex-1">
          {NAV.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSection(item.id)}
              className={`text-left px-3 py-2 rounded-lg text-sm ${
                section === item.id ? 'bg-white text-[#161616]' : 'text-white/75 hover:bg-white/10'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <div className="hidden md:block text-xs text-white/50">
          <p className="text-white/80">{user.name}</p>
          <a href="/" className="underline mt-2 inline-block">Volver al sitio</a>
          <button type="button" onClick={logout} className="block mt-2 underline">Cerrar sesión</button>
        </div>
      </aside>

      <main className="px-5 py-6 sm:px-8 sm:py-8">
        <header className="flex items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-neutral-500">Panel</p>
            <h1 className="text-3xl font-semibold tracking-tight">{NAV.find((item) => item.id === section)?.label}</h1>
          </div>
          <p className="text-xs text-neutral-500">{data ? formatWhen(data.generatedAt) : ''}</p>
        </header>

        {loading && <p className="text-sm text-neutral-500">Cargando datos…</p>}
        {error && <p className="text-sm text-red-700">{error}</p>}

        {data && section === 'resumen' && (
          <div className="space-y-8">
            <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
              <Stat label="Personas" value={data.stats.users} note={`${data.stats.admins} admin`} />
              <Stat label="Eventos activos" value={data.stats.activeEvents} note={`${data.stats.events} en total`} />
              <Stat label="Reservas" value={data.stats.confirmed} note={`${data.stats.cancelled} canceladas`} />
              <Stat label="Ocupación" value={`${data.stats.occupancy}%`} note={`${data.stats.favorites} favoritos`} />
            </div>
            <section className="bg-white border border-[#e4e0d6] rounded-2xl p-5">
              <h2 className="text-sm font-semibold mb-4">Reservas por categoría</h2>
              <div className="space-y-3">
                {data.categories.map((item) => (
                  <div key={item.name}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{item.name}</span>
                      <span className="text-neutral-500">{item.reservations} reservas · {item.events} eventos</span>
                    </div>
                    <div className="h-2 bg-[#f4f1ea] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#2f4a3c]"
                        style={{ width: `${Math.round((item.reservations / maxCategory) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {data && section === 'eventos' && (
          <Table
            columns={['Evento', 'Categoría', 'Fecha', 'Cupo', 'Reservas', 'Estado']}
            rows={data.events.map((event) => [
              event.title,
              event.category,
              formatWhen(event.startsAt),
              `${event.taken}/${event.totalSpots}`,
              event.reservations,
              event.status,
            ])}
          />
        )}

        {data && section === 'personas' && (
          <Table
            columns={['Nombre', 'Correo', 'Ciudad', 'Rol', 'Reservas', 'Último acceso']}
            rows={data.users.map((person) => [
              person.name,
              person.email,
              person.ciudad || '—',
              person.role,
              person.reservations,
              formatWhen(person.lastAccess),
            ])}
          />
        )}

        {data && section === 'reservas' && (
          <Table
            columns={['Persona', 'Evento', 'Estado', 'Fecha']}
            rows={data.reservations.map((item) => [
              item.user,
              item.eventTitle,
              item.status,
              formatWhen(item.confirmedAt),
            ])}
          />
        )}
      </main>
    </div>
  )
}

function Stat({ label, value, note }) {
  return (
    <article className="bg-white border border-[#e4e0d6] rounded-2xl p-4">
      <p className="text-xs uppercase tracking-[0.14em] text-neutral-500">{label}</p>
      <p className="text-3xl font-semibold tracking-tight mt-2">{value}</p>
      <p className="text-sm text-neutral-500 mt-1">{note}</p>
    </article>
  )
}

function Table({ columns, rows }) {
  return (
    <div className="bg-white border border-[#e4e0d6] rounded-2xl overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-neutral-500 border-b border-[#e4e0d6]">
            {columns.map((column) => (
              <th key={column} className="px-4 py-3 font-medium">{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr><td className="px-4 py-6 text-neutral-500" colSpan={columns.length}>Sin registros.</td></tr>
          )}
          {rows.map((row, index) => (
            <tr key={index} className="border-b border-[#f0ece4] last:border-0">
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="px-4 py-3 align-top">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Shell({ children }) {
  return <div className="min-h-screen bg-[#f4f1ea] grid place-items-center px-6">{children}</div>
}

function Gate({ login }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    const result = await login({ email, password })
    setBusy(false)
    if (!result.ok) setError(result.error || 'No se pudo entrar.')
  }

  return (
    <Shell>
      <form onSubmit={submit} className="w-full max-w-sm bg-white border border-[#e4e0d6] rounded-2xl p-6">
        <p className="text-xs uppercase tracking-[0.16em] text-neutral-500">Evently</p>
        <h1 className="text-2xl font-semibold tracking-tight mt-1 mb-5">Administración</h1>
        <label className="block text-sm mb-3">
          Correo
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-1 w-full border border-[#e4e0d6] rounded-xl px-3 py-2"
          />
        </label>
        <label className="block text-sm mb-4">
          Contraseña
          <input
            type="password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-1 w-full border border-[#e4e0d6] rounded-xl px-3 py-2"
          />
        </label>
        {error && <p className="text-sm text-red-700 mb-3">{error}</p>}
        <button type="submit" disabled={busy} className="w-full bg-[#161616] text-white rounded-xl py-2.5 text-sm">
          {busy ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </Shell>
  )
}
