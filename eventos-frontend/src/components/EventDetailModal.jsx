import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Heart,
  CheckCircle2,
  Sparkles,
  BadgeCheck,
  Ticket,
  Users,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { useEventData } from '../context/EventDataContext.jsx'
import {
  apiAddFavorite,
  apiCancelReservation,
  apiRemoveFavorite,
  apiReserveEvent,
} from '../lib/api.js'

const EASE = [0.16, 1, 0.3, 1]

export default function EventDetailModal({
  event,
  open,
  onClose,
  onOpenAuth,
  showToast,
}) {
  const { isAuthenticated } = useAuth()
  const { refresh } = useEventData()
  const [liked, setLiked] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [favoriteBusy, setFavoriteBusy] = useState(false)
  const [reservationBusy, setReservationBusy] = useState(false)

  useEffect(() => {
    if (!open) return
    setLiked(Boolean(event?.liked))
    setConfirmed(Boolean(event?.confirmed))
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open, event?.id, event?.liked, event?.confirmed])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!event) return null

  const notify = (message, type = 'info') => {
    if (typeof showToast === 'function') showToast(message, type)
  }

  const toggleLike = async () => {
    if (!isAuthenticated) {
      notify('Inicia sesión para guardar favoritos.', 'info')
      onOpenAuth?.('login')
      return
    }
    setFavoriteBusy(true)
    const result = liked
      ? await apiRemoveFavorite(event.id)
      : await apiAddFavorite(event.id)
    setFavoriteBusy(false)
    if (!result.ok) {
      notify(result.error || 'No se pudo actualizar el favorito.', 'info')
      return
    }
    const next = Boolean(result.favorite)
    setLiked(next)
    notify(
      next ? `¡${event.title} guardado en favoritos!` : 'Eliminado de favoritos',
      next ? 'favorite' : 'info'
    )
  }

  const toggleConfirm = async () => {
    if (!isAuthenticated) {
      notify('Inicia sesión para confirmar tu asistencia.', 'info')
      onOpenAuth?.('login')
      return
    }
    setReservationBusy(true)
    const result = confirmed
      ? await apiCancelReservation(event.id)
      : await apiReserveEvent(event.id)
    setReservationBusy(false)
    if (!result.ok) {
      notify(result.error || 'No se pudo actualizar la reserva.', 'info')
      return
    }
    const next = Boolean(result.confirmed)
    setConfirmed(next)
    notify(
      next ? `Asistencia confirmada · ${event.title}` : 'Asistencia cancelada',
      next ? 'success' : 'info'
    )
    await refresh()
    window.dispatchEvent(new Event('evently:reservations-changed'))
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
        >
          <motion.div
            onClick={onClose}
            className="absolute inset-0 bg-evently-text/20 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, y: 28, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.4, ease: EASE }}
            role="dialog"
            aria-modal="true"
            aria-label={event.title}
            className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-[1.5rem] sm:rounded-[1.75rem] bg-white border border-evently-border/60 shadow-elevated flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative h-52 sm:h-64 flex-shrink-0 overflow-hidden">
              <img
                src={event.image}
                alt={event.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-evently-text/70 via-evently-text/15 to-transparent" />

              <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar"
                className="absolute top-4 right-4 w-10 h-10 rounded-full glass flex items-center justify-center text-evently-text hover:scale-105 transition-transform"
              >
                <X className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={toggleLike}
                disabled={favoriteBusy}
                aria-label="Favorito"
                className="absolute top-4 left-4 w-10 h-10 rounded-full glass flex items-center justify-center hover:scale-105 transition-transform disabled:opacity-60"
              >
                <Heart
                  className="w-4 h-4"
                  style={{
                    fill: liked ? '#F43F5E' : 'transparent',
                    color: liked ? '#F43F5E' : '#374151',
                  }}
                />
              </button>

              <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-end justify-between gap-3">
                <span className="px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase text-white bg-gradient-brand">
                  {event.category}
                </span>
                {event.free !== false && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold text-[#10B981] bg-white/95">
                    <BadgeCheck className="w-3.5 h-3.5" />
                    100% gratis
                  </span>
                )}
              </div>
            </div>

            <div className="overflow-y-auto flex-1 px-5 sm:px-7 py-6">
              <h2 className="font-display font-black text-2xl sm:text-3xl tracking-tight text-evently-text leading-tight mb-4">
                {event.title}
              </h2>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2.5 text-sm text-evently-textSecondary">
                  <Calendar className="w-4 h-4 text-[#10B981] flex-shrink-0" />
                  <span>{event.date}</span>
                  <Clock className="w-4 h-4 text-[#10B981] ml-1 flex-shrink-0" />
                  <span>{event.time}</span>
                </div>
                <div className="flex items-start gap-2.5 text-sm text-evently-textSecondary">
                  <MapPin className="w-4 h-4 text-[#10B981] flex-shrink-0 mt-0.5" />
                  <span>{event.location}</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm text-evently-textSecondary">
                  <Users className="w-4 h-4 text-[#10B981] flex-shrink-0" />
                  <span>
                    {event.spots} cupos disponibles
                    {event.totalSpots ? ` de ${event.totalSpots}` : ''}
                  </span>
                </div>
              </div>

              {event.description && (
                <div className="mb-6">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-[#10B981] mb-2">
                    Sobre el evento
                  </h3>
                  <p className="text-evently-textSecondary text-sm sm:text-base leading-relaxed">
                    {event.description}
                  </p>
                </div>
              )}

              <div className="rounded-2xl bg-evently-bg/80 border border-evently-border/60 p-4 flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#10B981]/10 flex items-center justify-center flex-shrink-0">
                  <Ticket className="w-5 h-5 text-[#10B981]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-evently-text">
                    Pase digital Evently
                  </p>
                  <p className="text-xs text-evently-muted mt-1 leading-relaxed">
                    Confirma tu asistencia y recibe el recordatorio en tu smartwatch.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex-shrink-0 px-5 sm:px-7 py-4 border-t border-evently-border/70 bg-white flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={onClose}
                className="sm:w-auto px-5 py-3.5 rounded-2xl text-sm font-semibold border border-evently-border text-evently-textSecondary hover:bg-evently-surface transition-colors"
              >
                Cerrar
              </button>
              <motion.button
                type="button"
                onClick={toggleConfirm}
                disabled={reservationBusy}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className={`flex-1 py-3.5 rounded-2xl font-semibold text-sm transition-all duration-500 disabled:opacity-60 ${
                  confirmed ? 'bg-gradient-brand text-white shadow-glow' : 'btn-cta'
                }`}
              >
                <span className="flex items-center justify-center gap-2">
                  {reservationBusy ? (
                    'Actualizando…'
                  ) : confirmed ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Asistencia confirmada
                    </>
                  ) : (
                    <>
                      Confirmar asistencia
                      <Sparkles className="w-4 h-4" />
                    </>
                  )}
                </span>
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
