import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import {
  apiAdminCreateEvent,
  apiAdminCreateUser,
  apiAdminOverview,
  apiAdminSetTicketSolved,
  apiAdminSetUserActive,
  apiAdminUpdateEvent,
  apiAdminUpdateUser,
} from '../lib/api.js'

const NAV = [
  { id: 'resumen', label: 'Resumen' },
  { id: 'eventos', label: 'Eventos' },
  { id: 'personas', label: 'Personas' },
  { id: 'reservas', label: 'Reservas' },
  { id: 'soporte', label: 'Soporte' },
]

const EVENT_STATES = [
  { id: 'activo', label: 'Activo' },
  { id: 'borrador', label: 'Borrador' },
  { id: 'agotado', label: 'Agotado' },
  { id: 'cancelado', label: 'Cancelado' },
]

const FIELD = 'mt-1 w-full border border-[#e4e0d6] rounded-xl px-3 py-2 text-sm bg-white'
const BTN_DARK = 'bg-[#161616] text-white rounded-xl px-4 py-2 text-sm disabled:opacity-60'
const BTN_LINE = 'border border-[#d9d4c8] rounded-lg px-2.5 py-1 text-xs hover:bg-[#f4f1ea] disabled:opacity-50'

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

/** Fecha del evento tal como se escribió (hora local del evento), con año. */
function formatEventDate(local) {
  if (!local) return '—'
  const date = new Date(local)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function AdminDashboard() {
  const { user, login, logout, booting } = useAuth()
  const [section, setSection] = useState('resumen')
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(false)
  const [dialog, setDialog] = useState(null)
  const [busyKey, setBusyKey] = useState('')
  const [showSolved, setShowSolved] = useState(true)

  const isAdmin = Boolean(user && user.role === 'admin')

  const load = useCallback(async () => {
    const result = await apiAdminOverview()
    if (!result.ok) {
      setError(result.error || 'No se pudo cargar el panel.')
      return false
    }
    setError('')
    setData(result)
    return true
  }, [])

  useEffect(() => {
    if (!isAdmin) return
    setLoading(true)
    load().then(() => setLoading(false))
  }, [isAdmin, load])

  /** Ejecuta un cambio, recarga los datos y muestra el resultado. */
  async function run(key, action) {
    setBusyKey(key)
    setNotice('')
    const result = await action()
    if (result.ok) {
      await load()
      setNotice(result.message || 'Cambios guardados.')
    } else {
      setError(result.error || 'No se pudo guardar el cambio.')
    }
    setBusyKey('')
    return result
  }

  if (booting) {
    return <Shell><p className="text-sm text-neutral-500">Cargando sesión…</p></Shell>
  }

  if (!user) return <Gate login={login} />
  if (!isAdmin) {
    return (
      <Shell>
        <p className="text-lg font-semibold">Esta cuenta no es de administrador.</p>
        <button type="button" onClick={logout} className="mt-4 text-sm underline">Cerrar sesión</button>
      </Shell>
    )
  }

  const maxCategory = Math.max(1, ...(data?.categories || []).map((item) => item.reservations))
  const openTickets = data?.stats.openTickets || 0
  const tickets = (data?.support || []).filter((ticket) => showSolved || ticket.status === 'pendiente')

  return (
    <div className="min-h-screen bg-[#f4f1ea] text-[#1a1a1a] md:grid md:grid-cols-[220px_1fr]">
      <aside className="bg-[#161616] text-white px-5 py-6 flex md:flex-col gap-6 md:min-h-screen">
        <div>
          <p className="text-[11px] tracking-[0.18em] uppercase text-white/50">Evently</p>
          <p className="text-lg font-semibold tracking-tight">Administración</p>
        </div>
        <nav className="flex md:flex-col gap-1 flex-1 overflow-x-auto">
          {NAV.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setSection(item.id)
                setNotice('')
                setError('')
              }}
              className={`flex items-center justify-between gap-2 text-left px-3 py-2 rounded-lg text-sm whitespace-nowrap ${
                section === item.id ? 'bg-white text-[#161616]' : 'text-white/75 hover:bg-white/10'
              }`}
            >
              {item.label}
              {item.id === 'soporte' && openTickets > 0 && (
                <span className="text-[11px] leading-none bg-[#c8553d] text-white rounded-full px-1.5 py-1">
                  {openTickets}
                </span>
              )}
            </button>
          ))}
        </nav>
        <div className="hidden md:block text-xs text-white/50">
          <p className="text-white/80">{user.name}</p>
          <a href="/" className="underline mt-2 inline-block">Volver al sitio</a>
          <button type="button" onClick={logout} className="block mt-2 underline">Cerrar sesión</button>
        </div>
      </aside>

      <main className="px-5 py-6 sm:px-8 sm:py-8 min-w-0">
        <header className="flex flex-wrap items-end justify-between gap-4 mb-6">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-neutral-500">Panel</p>
            <h1 className="text-3xl font-semibold tracking-tight">{NAV.find((item) => item.id === section)?.label}</h1>
          </div>
          <div className="flex items-center gap-3">
            <p className="text-xs text-neutral-500">{data ? formatWhen(data.generatedAt) : ''}</p>
            {data && section === 'eventos' && (
              <button type="button" className={BTN_DARK} onClick={() => setDialog({ type: 'event', item: null })}>
                Nuevo evento
              </button>
            )}
            {data && section === 'personas' && (
              <button type="button" className={BTN_DARK} onClick={() => setDialog({ type: 'user', item: null })}>
                Nueva persona
              </button>
            )}
          </div>
        </header>

        {loading && <p className="text-sm text-neutral-500 mb-4">Cargando datos…</p>}
        {error && <p role="alert" className="text-sm text-red-700 mb-4">{error}</p>}
        {notice && !error && <p role="status" className="text-sm text-[#2f4a3c] mb-4">{notice}</p>}

        {data && section === 'resumen' && (
          <div className="space-y-8">
            <div className="grid sm:grid-cols-2 xl:grid-cols-5 gap-3">
              <Stat label="Personas" value={data.stats.users} note={`${data.stats.activeUsers} activas · ${data.stats.admins} admin`} />
              <Stat label="Eventos activos" value={data.stats.activeEvents} note={`${data.stats.events} en total`} />
              <Stat label="Reservas" value={data.stats.confirmed} note={`${data.stats.cancelled} canceladas`} />
              <Stat label="Ocupación" value={`${data.stats.occupancy}%`} note={`${data.stats.favorites} favoritos`} />
              <Stat label="Soporte pendiente" value={openTickets} note={`${data.stats.tickets} reportes en total`} />
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
            columns={['Evento', 'Categoría', 'Fecha', 'Cupo', 'Reservas', 'Estado', '']}
            rows={data.events.map((event) => [
              <span key="title" className="font-medium">
                {event.title}
                {event.featured && <span className="ml-2 text-xs text-neutral-500">Destacado</span>}
              </span>,
              event.category,
              formatEventDate(event.startsAtLocal),
              `${event.taken}/${event.totalSpots}`,
              event.reservations,
              <Pill key="status" tone={event.status === 'activo' ? 'good' : event.status === 'cancelado' ? 'bad' : 'idle'}>
                {EVENT_STATES.find((state) => state.id === event.status)?.label || event.status}
              </Pill>,
              <button key="edit" type="button" className={BTN_LINE} onClick={() => setDialog({ type: 'event', item: event })}>
                Editar
              </button>,
            ])}
          />
        )}

        {data && section === 'personas' && (
          <Table
            columns={['Nombre', 'Correo', 'Ciudad', 'Rol', 'Reservas', 'Último acceso', 'Estado', '']}
            rows={data.users.map((person) => {
              const isSelf = Number(person.id) === Number(user.id)
              return [
                <span key="name" className={person.active ? 'font-medium' : 'font-medium text-neutral-400'}>
                  {person.name}
                  {isSelf && <span className="ml-2 text-xs text-neutral-500">Tú</span>}
                </span>,
                person.email,
                person.ciudad || '—',
                person.role === 'admin' ? 'Admin' : 'Usuario',
                person.reservations,
                formatWhen(person.lastAccess),
                <Pill key="status" tone={person.active ? 'good' : 'bad'}>{person.active ? 'Activa' : 'Baja'}</Pill>,
                <div key="actions" className="flex gap-2 justify-end">
                  <button type="button" className={BTN_LINE} onClick={() => setDialog({ type: 'user', item: person })}>
                    Editar
                  </button>
                  {person.active ? (
                    <button
                      type="button"
                      className={BTN_LINE}
                      disabled={isSelf}
                      title={isSelf ? 'No puedes dar de baja tu propia cuenta' : undefined}
                      onClick={() => setDialog({ type: 'deactivate', item: person })}
                    >
                      Dar de baja
                    </button>
                  ) : (
                    <button
                      type="button"
                      className={BTN_LINE}
                      disabled={busyKey === `user-${person.id}`}
                      onClick={() => run(`user-${person.id}`, () => apiAdminSetUserActive(person.id, true))}
                    >
                      Reactivar
                    </button>
                  )}
                </div>,
              ]
            })}
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

        {data && section === 'soporte' && (
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-sm text-neutral-600">
              <input type="checkbox" checked={showSolved} onChange={(event) => setShowSolved(event.target.checked)} />
              Mostrar también los solucionados
            </label>
            {tickets.length === 0 && (
              <p className="bg-white border border-[#e4e0d6] rounded-2xl px-4 py-6 text-sm text-neutral-500">
                {data.support.length === 0 ? 'Todavía no hay reportes.' : 'No hay reportes pendientes.'}
              </p>
            )}
            {tickets.map((ticket) => {
              const solved = ticket.status === 'solucionado'
              return (
                <article key={ticket.id} className="bg-white border border-[#e4e0d6] rounded-2xl p-4 sm:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="font-semibold break-words">{ticket.subject}</h2>
                      <p className="text-xs text-neutral-500 mt-1">
                        {ticket.name} · {ticket.email} · {formatWhen(ticket.createdAt)}
                        {!ticket.userId && ' · sin cuenta'}
                      </p>
                    </div>
                    <Pill tone={solved ? 'good' : 'warn'}>{solved ? 'Solucionado' : 'Pendiente'}</Pill>
                  </div>
                  <p className="text-sm mt-3 whitespace-pre-wrap break-words">{ticket.message}</p>
                  <div className="flex flex-wrap items-center gap-3 mt-4">
                    <button
                      type="button"
                      className={solved ? BTN_LINE : BTN_DARK}
                      disabled={busyKey === `ticket-${ticket.id}`}
                      onClick={() => run(`ticket-${ticket.id}`, () => apiAdminSetTicketSolved(ticket.id, !solved))}
                    >
                      {solved ? 'Volver a pendiente' : 'Marcar como solucionado'}
                    </button>
                    {solved && (
                      <span className="text-xs text-neutral-500">Solucionado el {formatWhen(ticket.solvedAt)}</span>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </main>

      {dialog?.type === 'user' && (
        <UserDialog
          person={dialog.item}
          isSelf={dialog.item ? Number(dialog.item.id) === Number(user.id) : false}
          onClose={() => setDialog(null)}
          onSaved={async (message) => {
            setDialog(null)
            await load()
            setNotice(message)
          }}
        />
      )}

      {dialog?.type === 'event' && (
        <EventDialog
          event={dialog.item}
          categories={data?.categories || []}
          onClose={() => setDialog(null)}
          onSaved={async (message) => {
            setDialog(null)
            await load()
            setNotice(message)
          }}
        />
      )}

      {dialog?.type === 'deactivate' && (
        <Dialog title="Dar de baja" onClose={() => setDialog(null)}>
          <p className="text-sm">
            <strong>{dialog.item.name}</strong> ya no podrá iniciar sesión y se cerrarán sus sesiones abiertas.
            Su cuenta y sus reservas se conservan, y puedes reactivarla cuando quieras.
          </p>
          <div className="flex justify-end gap-2 mt-6">
            <button type="button" className="text-sm px-4 py-2" onClick={() => setDialog(null)}>
              Cancelar
            </button>
            <button
              type="button"
              className={BTN_DARK}
              disabled={busyKey === `user-${dialog.item.id}`}
              onClick={async () => {
                await run(`user-${dialog.item.id}`, () => apiAdminSetUserActive(dialog.item.id, false))
                setDialog(null)
              }}
            >
              Dar de baja
            </button>
          </div>
        </Dialog>
      )}
    </div>
  )
}

function UserDialog({ person, isSelf, onClose, onSaved }) {
  const editing = Boolean(person)
  const [form, setForm] = useState({
    name: person?.name || '',
    email: person?.email || '',
    ciudad: person?.ciudad || 'Querétaro',
    telefono: person?.telefono || '',
    role: person?.role || 'usuario',
    password: '',
  })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const set = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }))

  async function submit(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    const result = editing ? await apiAdminUpdateUser(person.id, form) : await apiAdminCreateUser(form)
    setBusy(false)
    if (result.ok) onSaved(result.message)
    else setError(result.error || 'No se pudo guardar.')
  }

  return (
    <Dialog title={editing ? 'Editar persona' : 'Nueva persona'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <label className="block text-sm">
          Nombre
          <input required minLength={2} maxLength={100} value={form.name} onChange={set('name')} className={FIELD} />
        </label>
        <label className="block text-sm">
          Correo
          <input type="email" required value={form.email} onChange={set('email')} className={FIELD} />
        </label>
        <div className="grid sm:grid-cols-2 gap-3">
          <label className="block text-sm">
            Ciudad
            <input maxLength={80} value={form.ciudad} onChange={set('ciudad')} className={FIELD} />
          </label>
          <label className="block text-sm">
            Teléfono
            <input type="tel" maxLength={20} value={form.telefono} onChange={set('telefono')} className={FIELD} />
          </label>
        </div>
        <label className="block text-sm">
          Rol
          <select value={form.role} onChange={set('role')} disabled={isSelf} className={FIELD}>
            <option value="usuario">Usuario</option>
            <option value="admin">Administrador</option>
          </select>
          {isSelf && <span className="text-xs text-neutral-500">No puedes cambiar tu propio rol.</span>}
        </label>
        <label className="block text-sm">
          {editing ? 'Nueva contraseña' : 'Contraseña'}
          <input
            type="password"
            autoComplete="new-password"
            required={!editing}
            minLength={6}
            value={form.password}
            onChange={set('password')}
            placeholder={editing ? 'Déjala vacía para no cambiarla' : 'Mínimo 6 caracteres'}
            className={FIELD}
          />
        </label>
        <DialogActions error={error} busy={busy} onClose={onClose} label={editing ? 'Guardar cambios' : 'Crear persona'} />
      </form>
    </Dialog>
  )
}

function EventDialog({ event, categories, onClose, onSaved }) {
  const editing = Boolean(event)
  const [form, setForm] = useState({
    title: event?.title || '',
    description: event?.description || '',
    categoryId: String(event?.categoryId || categories[0]?.id || ''),
    startsAt: event?.startsAtLocal || '',
    location: event?.location || '',
    totalSpots: String(event?.totalSpots || 100),
    image: event?.image || '',
    status: event?.status || 'activo',
    featured: Boolean(event?.featured),
    free: event ? Boolean(event.free) : true,
  })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const set = (key) => (change) => setForm((current) => ({ ...current, [key]: change.target.value }))
  const toggle = (key) => (change) => setForm((current) => ({ ...current, [key]: change.target.checked }))

  async function submit(submitEvent) {
    submitEvent.preventDefault()
    setBusy(true)
    setError('')
    const payload = {
      ...form,
      categoryId: Number(form.categoryId),
      totalSpots: Number(form.totalSpots),
    }
    const result = editing ? await apiAdminUpdateEvent(event.id, payload) : await apiAdminCreateEvent(payload)
    setBusy(false)
    if (result.ok) onSaved(result.message)
    else setError(result.error || 'No se pudo guardar.')
  }

  return (
    <Dialog title={editing ? 'Editar evento' : 'Nuevo evento'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <label className="block text-sm">
          Título
          <input required minLength={3} maxLength={200} value={form.title} onChange={set('title')} className={FIELD} />
        </label>
        <label className="block text-sm">
          Descripción
          <textarea rows={3} maxLength={2000} value={form.description} onChange={set('description')} className={FIELD} />
        </label>
        <div className="grid sm:grid-cols-2 gap-3">
          <label className="block text-sm">
            Categoría
            <select required value={form.categoryId} onChange={set('categoryId')} className={FIELD}>
              {[...categories]
                .sort((a, b) => a.name.localeCompare(b.name, 'es'))
                .map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
            </select>
          </label>
          <label className="block text-sm">
            Fecha y hora
            <input type="datetime-local" required value={form.startsAt} onChange={set('startsAt')} className={FIELD} />
          </label>
        </div>
        <label className="block text-sm">
          Lugar
          <input maxLength={255} value={form.location} onChange={set('location')} className={FIELD} />
        </label>
        <div className="grid sm:grid-cols-2 gap-3">
          <label className="block text-sm">
            Cupo total
            <input
              type="number"
              required
              min={Math.max(1, event?.taken || 1)}
              max={100000}
              value={form.totalSpots}
              onChange={set('totalSpots')}
              className={FIELD}
            />
            {editing && event.taken > 0 && (
              <span className="text-xs text-neutral-500">{event.taken} lugares ya reservados.</span>
            )}
          </label>
          <label className="block text-sm">
            Estado
            <select value={form.status} onChange={set('status')} className={FIELD}>
              {EVENT_STATES.map((state) => (
                <option key={state.id} value={state.id}>{state.label}</option>
              ))}
            </select>
            <span className="text-xs text-neutral-500">Solo los activos se ven en el sitio.</span>
          </label>
        </div>
        <label className="block text-sm">
          Imagen (enlace)
          <input type="url" maxLength={500} value={form.image} onChange={set('image')} placeholder="https://…" className={FIELD} />
        </label>
        <div className="flex flex-wrap gap-5 text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.featured} onChange={toggle('featured')} />
            Destacado
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.free} onChange={toggle('free')} />
            Gratuito
          </label>
        </div>
        <DialogActions error={error} busy={busy} onClose={onClose} label={editing ? 'Guardar cambios' : 'Crear evento'} />
      </form>
    </Dialog>
  )
}

function DialogActions({ error, busy, onClose, label }) {
  return (
    <>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" className="text-sm px-4 py-2" onClick={onClose}>Cancelar</button>
        <button type="submit" disabled={busy} className={BTN_DARK}>{busy ? 'Guardando…' : label}</button>
      </div>
    </>
  )
}

function Dialog({ title, onClose, children }) {
  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white border border-[#e4e0d6] rounded-2xl p-5 sm:p-6"
      >
        <div className="flex items-center justify-between gap-4 mb-4">
          <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="text-neutral-500 hover:text-black text-xl leading-none">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

const PILL_TONES = {
  good: 'bg-[#e6efe9] text-[#2f4a3c]',
  bad: 'bg-[#f6e3de] text-[#9a3b26]',
  warn: 'bg-[#f7ecd0] text-[#7a5a12]',
  idle: 'bg-[#ecebe6] text-neutral-600',
}

function Pill({ tone = 'idle', children }) {
  return (
    <span className={`inline-block text-xs font-medium rounded-full px-2.5 py-1 whitespace-nowrap ${PILL_TONES[tone]}`}>
      {children}
    </span>
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
            {columns.map((column, index) => (
              <th key={column || index} className="px-4 py-3 font-medium">{column}</th>
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
