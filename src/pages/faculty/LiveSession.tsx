import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Copy, CheckCheck, StopCircle, ArrowLeft } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { ConfirmModal } from '../../components/ui/Modal'
import { getSession, getLiveSession, closeSession, openLiveStream, ApiError } from '../../lib/api'
import type { CourseWithSession } from '../../lib/api'
import type { Session } from '../../types'
import { usePageTitle } from '../../hooks/usePageTitle'
import toast from 'react-hot-toast'

export default function LiveSession() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()

  const locState = location.state as { session?: Session; course?: CourseWithSession } | null

  const [session, setSession] = useState<Session | null>(locState?.session ?? null)
  const [course] = useState(locState?.course ?? null)
  const [count, setCount] = useState(locState?.session?.submissionsCount ?? 0)
  const [timeLeft, setTimeLeft] = useState(0)
  const [liveStatus, setLiveStatus] = useState<Session['status']>(locState?.session?.status ?? 'upcoming')
  const [copied, setCopied] = useState(false)
  const [confirmClose, setConfirmClose] = useState(false)
  const [closing, setClosing] = useState(false)

  usePageTitle(`Live Session · ${course?.code ?? session?.courseId ?? ''}`)

  // Load session if not in navigation state
  useEffect(() => {
    if (session || !sessionId) return
    getSession(sessionId)
      .then(setSession)
      .catch((err) => {
        if (!(err instanceof ApiError && err.status === 401)) {
          toast.error('Session not found')
          navigate(-1)
        }
      })
  }, [sessionId])

  // Open SSE stream when session is available
  const streamRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    if (!sessionId || !session) return

    const close = openLiveStream(
      sessionId,
      (tick) => {
        setCount(tick.submissionsCount)
        setTimeLeft(Math.max(0, tick.secondsRemaining))
        setLiveStatus(tick.status)
      },
      () => {
        toast('Window closed — reviewing attendance…')
        navigate(`/faculty/sessions/${sessionId}/review`, {
          state: { session, course },
        })
      },
    )
    streamRef.current = close
    return () => close()
  }, [sessionId, !!session])

  // Poll fallback to avoid stale UI if SSE drops.
  useEffect(() => {
    if (!sessionId || !session) return
    const poll = setInterval(async () => {
      try {
        const live = await getLiveSession(sessionId)
        setCount(live.submissionsCount)
        setTimeLeft(Math.max(0, live.secondsRemaining))
        setLiveStatus(live.status)
      } catch {
        // SSE is primary; ignore transient poll failures
      }
    }, 3000)
    return () => clearInterval(poll)
  }, [sessionId, !!session])

  // Local countdown (SSE ticks every 2s; this fills the gap)
  useEffect(() => {
    if (timeLeft <= 0) return
    const t = setInterval(() => setTimeLeft(p => Math.max(0, p - 1)), 1000)
    return () => clearInterval(t)
  }, [timeLeft > 0])

  const handleCopyPin = () => {
    if (!session) return
    navigator.clipboard.writeText(session.pin).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success('PIN copied')
  }

  const handleClose = async () => {
    if (!sessionId) return
    setConfirmClose(false)
    setClosing(true)
    try {
      await closeSession(sessionId)
      toast.success('Session closed — processing attendance…')
      navigate(`/faculty/sessions/${sessionId}/review`, {
        state: { session, course },
      })
    } catch (err) {
      if (err instanceof ApiError && (err.body?.error as string) === 'already_closed') {
        navigate(`/faculty/sessions/${sessionId}/review`, { state: { session, course } })
      } else {
        toast.error('Failed to close session')
        setClosing(false)
      }
    }
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 rounded-full border-2 border-accent/30 border-t-accent animate-spin" />
      </div>
    )
  }

  const totalStudents = session.totalStudents || 1
  const pct = Math.round((count / totalStudents) * 100)
  const mins = Math.floor(timeLeft / 60)
  const secs = timeLeft % 60

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-bg-border flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/faculty/courses/${session.courseId}`)}
            className="p-1.5 rounded-lg text-ink-muted hover:text-ink-secondary hover:bg-bg-elevated transition-colors"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <p className="text-base font-semibold text-ink-primary">Live Session</p>
            <p className="text-xs text-ink-muted">{course?.code ?? ''} · {course?.name ?? ''}</p>
          </div>
        </div>
        <Button variant="danger" size="sm" onClick={() => setConfirmClose(true)} loading={closing}>
          <StopCircle size={14} />
          Close Window
        </Button>
      </div>

      {/* Body — centered */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 gap-8">

        {/* PIN */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <p className="text-xs font-semibold text-ink-muted uppercase tracking-widest mb-3">Session PIN</p>
          <p className="text-6xl font-black text-accent tracking-[0.35em] font-mono leading-none select-all cursor-text">
            {session.pin}
          </p>
          <button
            onClick={handleCopyPin}
            className="mt-3 flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink-secondary transition-colors mx-auto"
          >
            {copied ? <CheckCheck size={13} className="text-success" /> : <Copy size={13} />}
            {copied ? 'Copied' : 'Copy PIN'}
          </button>
        </motion.div>

        {/* Count + timer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex items-center gap-10"
        >
          <div className="text-center">
            <p className="text-4xl font-bold text-ink-primary">
              {count}<span className="text-ink-muted text-2xl font-normal">/{session.totalStudents}</span>
            </p>
            <p className="text-xs text-ink-muted mt-1">submitted</p>
          </div>

          <div className="w-px h-10 bg-bg-border" />

          <div className="text-center">
            <p className={`text-4xl font-bold font-mono ${timeLeft <= 60 ? 'text-danger' : 'text-ink-primary'}`}>
              {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
            </p>
            <p className="text-xs text-ink-muted mt-1">{liveStatus === 'upcoming' ? 'until open' : 'remaining'}</p>
          </div>
        </motion.div>

        {/* Progress bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="w-full max-w-xs"
        >
          <div className="h-1.5 bg-bg-elevated rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-success rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
        </motion.div>

      </div>

      <ConfirmModal
        open={confirmClose}
        onClose={() => setConfirmClose(false)}
        onConfirm={handleClose}
        title="Close attendance window?"
        message={
          <p>
            <strong>{count}</strong> of <strong>{session.totalStudents}</strong> students have submitted so far.
            Once closed, no more submissions will be accepted for this session.
          </p>
        }
        confirmLabel="Yes, close window"
        cancelLabel="Keep it open"
        danger
      />
    </div>
  )
}
