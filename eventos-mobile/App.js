import { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { api, getToken, parseQrCode, setToken } from './src/api'

const INK = '#161616'
const MUTED = '#6E6E68'
const LINE = '#E4E2DC'
const PAPER = '#F6F5F2'
const CARD = '#FFFFFF'

export default function App() {
  const [ready, setReady] = useState(false)
  const [user, setUser] = useState(null)
  const [tab, setTab] = useState('eventos')

  const loadMe = useCallback(async () => {
    const token = await getToken()
    if (!token) {
      setUser(null)
      setReady(true)
      return
    }
    const data = await api('/api/auth/me', { auth: true })
    if (data.ok && data.user) setUser(data.user)
    else {
      await setToken(null)
      setUser(null)
    }
    setReady(true)
  }, [])

  useEffect(() => {
    loadMe()
  }, [loadMe])

  async function onAuthed(data) {
    await setToken(data.token)
    setUser(data.user)
    setTab('eventos')
  }

  async function logout() {
    await api('/api/auth/logout', { method: 'POST', auth: true })
    await setToken(null)
    setUser(null)
  }

  if (!ready) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={INK} />
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor={PAPER} />
      {user ? (
        <>
          <View style={styles.header}>
            <Text style={styles.brand}>Evently</Text>
            <Text style={styles.headerMeta}>{user.name?.split(' ')[0]}</Text>
          </View>
          <View style={styles.body}>
            {tab === 'eventos' && <EventList />}
            {tab === 'mios' && <MyEvents />}
            {tab === 'cuenta' && <Account user={user} onUser={setUser} onLogout={logout} />}
          </View>
          <View style={styles.tabs}>
            <Tab label="Eventos" active={tab === 'eventos'} onPress={() => setTab('eventos')} />
            <Tab label="Míos" active={tab === 'mios'} onPress={() => setTab('mios')} />
            <Tab label="Cuenta" active={tab === 'cuenta'} onPress={() => setTab('cuenta')} />
          </View>
        </>
      ) : (
        <AuthScreen onAuthed={onAuthed} />
      )}
    </SafeAreaView>
  )
}

function AuthScreen({ onAuthed }) {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    telefono: '',
    pin: '',
    qr: '',
  })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  function set(key, value) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function submit() {
    setBusy(true)
    setError('')
    const path = mode === 'register' ? '/api/auth/register' : '/api/auth/login'
    const body =
      mode === 'register'
        ? {
            name: form.name,
            email: form.email,
            password: form.password,
            confirmPassword: form.confirmPassword,
            telefono: form.telefono,
            pin: form.pin,
          }
        : { email: form.email, password: form.password }
    const data = await api(path, { method: 'POST', body })
    setBusy(false)
    if (!data.ok || !data.token) {
      setError(data.error || 'No se pudo entrar.')
      return
    }
    onAuthed(data)
  }

  async function redeem() {
    const code = parseQrCode(form.qr)
    if (!code) {
      setError('Pega el código o el enlace del QR de la web.')
      return
    }
    setBusy(true)
    setError('')
    const data = await api('/api/auth/qr-login/redeem', { method: 'POST', body: { code } })
    setBusy(false)
    if (!data.ok || !data.token) {
      setError(data.error || 'El código no es válido.')
      return
    }
    onAuthed(data)
  }

  return (
    <ScrollView contentContainerStyle={styles.auth} keyboardShouldPersistTaps="handled">
      <Text style={styles.kicker}>Querétaro</Text>
      <Text style={styles.title}>Evently</Text>
      <Text style={styles.lead}>Eventos en un solo lugar. Esta app habla con la instancia, no con tu computadora.</Text>

      <View style={styles.switch}>
        <Tab label="Entrar" active={mode === 'login'} onPress={() => setMode('login')} />
        <Tab label="Crear cuenta" active={mode === 'register'} onPress={() => setMode('register')} />
        <Tab label="QR" active={mode === 'qr'} onPress={() => setMode('qr')} />
      </View>

      {mode === 'register' && (
        <Field label="Nombre" value={form.name} onChangeText={(v) => set('name', v)} />
      )}
      {mode !== 'qr' && (
        <>
          <Field label="Correo" value={form.email} onChangeText={(v) => set('email', v)} keyboardType="email-address" />
          <Field label="Contraseña" value={form.password} onChangeText={(v) => set('password', v)} secure />
        </>
      )}
      {mode === 'register' && (
        <>
          <Field label="Confirmar contraseña" value={form.confirmPassword} onChangeText={(v) => set('confirmPassword', v)} secure />
          <Field label="Teléfono" value={form.telefono} onChangeText={(v) => set('telefono', v)} keyboardType="phone-pad" />
          <Field label="PIN del reloj (4 a 6)" value={form.pin} onChangeText={(v) => set('pin', v)} keyboardType="number-pad" secure />
        </>
      )}
      {mode === 'qr' && (
        <Field
          label="Código o enlace del QR"
          value={form.qr}
          onChangeText={(v) => set('qr', v)}
          multiline
        />
      )}
      {!!error && <Text style={styles.error}>{error}</Text>}
      <Pressable style={styles.button} onPress={mode === 'qr' ? redeem : submit} disabled={busy}>
        <Text style={styles.buttonText}>{busy ? 'Espera…' : mode === 'qr' ? 'Canjear' : mode === 'register' ? 'Crear cuenta' : 'Entrar'}</Text>
      </Pressable>
    </ScrollView>
  )
}

function EventList() {
  const [events, setEvents] = useState([])
  const [selected, setSelected] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const data = await api('/api/events')
    setLoading(false)
    if (!data.ok) {
      setError(data.error || 'No se pudieron cargar los eventos.')
      return
    }
    setEvents(data.events || [])
  }, [])

  useEffect(() => {
    load()
  }, [load])

  if (selected) {
    return <EventDetail event={selected} onBack={() => setSelected(null)} />
  }

  return (
    <FlatList
      data={events}
      keyExtractor={(item) => String(item.id)}
      refreshing={loading}
      onRefresh={load}
      contentContainerStyle={styles.list}
      ListHeaderComponent={<Text style={styles.section}>Agenda</Text>}
      ListEmptyComponent={<Text style={styles.muted}>{loading ? 'Cargando…' : error || 'No hay eventos.'}</Text>}
      renderItem={({ item }) => (
        <Pressable style={styles.card} onPress={() => setSelected(item)}>
          <Text style={styles.meta}>{item.category} · {item.date}</Text>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.muted}>{item.location}</Text>
        </Pressable>
      )}
    />
  )
}

function EventDetail({ event, onBack }) {
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  async function reserve() {
    setBusy(true)
    const data = await api(`/api/events/${event.id}/reservation`, { method: 'POST', auth: true })
    setBusy(false)
    setMessage(data.ok ? data.message || 'Asistencia confirmada.' : data.error || 'No se pudo reservar.')
  }

  return (
    <ScrollView contentContainerStyle={styles.list}>
      <Pressable onPress={onBack}><Text style={styles.link}>Volver</Text></Pressable>
      <Text style={styles.meta}>{event.category} · {event.time}</Text>
      <Text style={styles.detailTitle}>{event.title}</Text>
      <Text style={styles.lead}>{event.date} · {event.location}</Text>
      {!!event.description && <Text style={styles.bodyText}>{event.description}</Text>}
      {!!message && <Text style={styles.note}>{message}</Text>}
      <Pressable style={styles.button} onPress={reserve} disabled={busy}>
        <Text style={styles.buttonText}>{busy ? 'Reservando…' : 'Confirmar asistencia'}</Text>
      </Pressable>
    </ScrollView>
  )
}

function MyEvents() {
  const [events, setEvents] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    api('/api/auth/mis-eventos', { auth: true }).then((data) => {
      if (!data.ok) setError(data.error || 'No se pudieron cargar.')
      else setEvents(data.events || [])
    })
  }, [])

  return (
    <FlatList
      data={events}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={styles.list}
      ListHeaderComponent={<Text style={styles.section}>Confirmados</Text>}
      ListEmptyComponent={<Text style={styles.muted}>{error || 'Todavía no confirmas eventos.'}</Text>}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.meta}>{item.date} · {item.time}</Text>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.muted}>{item.location}</Text>
        </View>
      )}
    />
  )
}

function Account({ user, onUser, onLogout }) {
  const [telefono, setTelefono] = useState(user.telefono || '')
  const [pin, setPin] = useState('')
  const [password, setPassword] = useState('')
  const [note, setNote] = useState('')

  async function savePin() {
    const profile = await api('/api/auth/profile', {
      method: 'PATCH',
      auth: true,
      body: { name: user.name, ciudad: user.ciudad || 'Querétaro', telefono },
    })
    if (!profile.ok) {
      setNote(profile.error || 'No se pudo guardar el teléfono.')
      return
    }
    if (profile.user) onUser(profile.user)
    const data = await api('/api/auth/set-pin', {
      method: 'POST',
      auth: true,
      body: { pin, password },
    })
    setNote(data.ok ? 'PIN listo para el reloj.' : data.error || 'No se pudo guardar el PIN.')
    if (data.ok && data.user) onUser(data.user)
  }

  return (
    <ScrollView contentContainerStyle={styles.list}>
      <Text style={styles.section}>Cuenta</Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{user.name}</Text>
        <Text style={styles.muted}>{user.email}</Text>
      </View>
      <Text style={styles.fieldLabel}>Teléfono del reloj</Text>
      <TextInput style={styles.input} value={telefono} onChangeText={setTelefono} keyboardType="phone-pad" />
      <Text style={styles.fieldLabel}>PIN de 4 a 6 dígitos</Text>
      <TextInput style={styles.input} value={pin} onChangeText={setPin} keyboardType="number-pad" secureTextEntry />
      <Text style={styles.fieldLabel}>Contraseña actual</Text>
      <TextInput style={styles.input} value={password} onChangeText={setPassword} secureTextEntry />
      {!!note && <Text style={styles.note}>{note}</Text>}
      <Pressable style={styles.button} onPress={savePin}>
        <Text style={styles.buttonText}>Guardar PIN</Text>
      </Pressable>
      <Pressable style={styles.ghost} onPress={onLogout}>
        <Text style={styles.ghostText}>Cerrar sesión</Text>
      </Pressable>
    </ScrollView>
  )
}

function Field({ label, ...props }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.input, props.multiline && styles.inputMulti]}
        placeholderTextColor="#A3A39C"
        autoCapitalize="none"
        {...props}
      />
    </View>
  )
}

function Tab({ label, active, onPress }) {
  return (
    <Pressable style={[styles.tab, active && styles.tabOn]} onPress={onPress}>
      <Text style={[styles.tabText, active && styles.tabTextOn]}>{label}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: PAPER },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: PAPER },
  body: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: LINE,
    backgroundColor: CARD,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  brand: { fontSize: 22, fontWeight: '700', color: INK, letterSpacing: -0.6 },
  headerMeta: { color: MUTED, fontSize: 14 },
  auth: { padding: 24, paddingBottom: 48 },
  kicker: { color: MUTED, letterSpacing: 1.4, fontSize: 12, textTransform: 'uppercase' },
  title: { fontSize: 40, fontWeight: '700', color: INK, letterSpacing: -1.2, marginTop: 8 },
  lead: { color: MUTED, fontSize: 15, lineHeight: 22, marginTop: 8, marginBottom: 20 },
  switch: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  field: { marginBottom: 12 },
  fieldLabel: { color: MUTED, fontSize: 12, marginBottom: 6 },
  input: {
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: INK,
    fontSize: 16,
  },
  inputMulti: { minHeight: 88, textAlignVertical: 'top' },
  button: { backgroundColor: INK, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  ghost: { paddingVertical: 14, alignItems: 'center' },
  ghostText: { color: MUTED, fontSize: 15 },
  error: { color: '#9B3A3A', marginBottom: 8 },
  note: { color: '#2F4A3C', marginTop: 8 },
  list: { padding: 20, gap: 12, paddingBottom: 32 },
  section: { fontSize: 28, fontWeight: '700', color: INK, letterSpacing: -0.8, marginBottom: 4 },
  card: { backgroundColor: CARD, borderWidth: 1, borderColor: LINE, borderRadius: 16, padding: 16, marginBottom: 10 },
  meta: { color: MUTED, fontSize: 12, marginBottom: 6 },
  cardTitle: { color: INK, fontSize: 17, fontWeight: '600', marginBottom: 4 },
  muted: { color: MUTED, fontSize: 14, lineHeight: 20 },
  detailTitle: { fontSize: 30, fontWeight: '700', color: INK, letterSpacing: -0.8, marginVertical: 8 },
  bodyText: { color: INK, fontSize: 15, lineHeight: 22, marginVertical: 12 },
  link: { color: INK, fontSize: 14, marginBottom: 12 },
  tabs: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: LINE, backgroundColor: CARD, padding: 8, gap: 8 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  tabOn: { backgroundColor: INK },
  tabText: { color: MUTED, fontSize: 13, fontWeight: '600' },
  tabTextOn: { color: '#fff' },
})
