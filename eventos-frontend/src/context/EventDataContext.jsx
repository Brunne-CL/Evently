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
import { apiCategories, apiEvents } from '../lib/api.js'

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
  const [events, setEvents] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    setLoading(true)
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
