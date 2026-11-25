import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  PartyPopper,
  Music,
  GraduationCap,
  Briefcase,
  Trophy,
  Palette,
  Coffee,
  HeartHandshake,
} from 'lucide-react'
import { useAuth } from './AuthContext.jsx'
import { apiCategories, apiEvents } from '../lib/api.js'
import { openLive } from '../lib/live.js'

const ICONS = {
  PartyPopper,
  Music,
  GraduationCap,
  Briefcase,
  Trophy,
  Palette,
  Coffee,
  HeartHandshake,
}

const EventDataContext = createContext(null)

export function EventDataProvider({ children }) {
  const { user } = useAuth()
  const [events, setEvents] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const refresh = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true)
    setError('')

    const [eventsResult, categoriesResult] = await Promise.all([
      apiEvents(),
      apiCategories(),
    ])

    if (eventsResult.ok) {
      setEvents(eventsResult.events || [])
    }
    if (categoriesResult.ok) {
      setCategories(
        (categoriesResult.categories || []).map((category) => ({
          ...category,
          icon: ICONS[category.icon] || PartyPopper,
        }))
      )
    }

    if (!eventsResult.ok || !categoriesResult.ok) {
      setError(eventsResult.error || categoriesResult.error || 'No se pudieron cargar los datos.')
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  useEffect(() => {
    let timer
    const onLive = (event) => {
      const scopes = event.detail?.scopes || []
      if (!scopes.includes('catalog')) return
      refresh({ silent: true })
    }
    const stop = openLive((payload) => {
      clearTimeout(timer)
      timer = setTimeout(() => {
        window.dispatchEvent(new CustomEvent('evently:live', { detail: payload }))
      }, 120)
    })
    window.addEventListener('evently:live', onLive)
    return () => {
      clearTimeout(timer)
      stop()
      window.removeEventListener('evently:live', onLive)
    }
  }, [user?.id, refresh])

  const totalEvents = useMemo(
    () => categories.reduce((sum, category) => sum + Number(category.count || 0), 0),
    [categories]
  )

  return (
    <EventDataContext.Provider
      value={{ events, categories, totalEvents, loading, error, refresh }}
    >
      {children}
    </EventDataContext.Provider>
  )
}

export function useEventData() {
  const context = useContext(EventDataContext)
  if (!context) {
    throw new Error('useEventData debe usarse dentro de EventDataProvider')
  }
  return context
}
