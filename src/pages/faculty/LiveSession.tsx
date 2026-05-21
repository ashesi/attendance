import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Copy, CheckCheck, StopCircle, ArrowLeft } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { ConfirmModal } from '../../components/ui/Modal'
import { mockSessions, mockCourses, mockAttendance } from '../../data/mock'
import { usePageTitle } from '../../hooks/usePageTitle'
import toast from 'react-hot-toast'

export default function LiveSession() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const [copied, setCopied] = useState(false)
  const [timeLeft, setTimeLeft] = useState(180)
  const [count, setCount] = useState(0)
  const [allowResubmit, setAllowResubmit] = useState(false)
  const [confirmClose, setConfirmClose] = useState(false)

  const session = mockSessions.find(s => s.id === sessionId) || mockSessions.find(s => s.status === 'open')!
  const course = mockCourses.find(c => c.id === session?.courseId)
  usePageTitle(`Live Session · ${course?.code ?? ''}`)

  // Simulate count going up
  useEffect(() => {
    const total = mockAttendance.filter(r => r.sessionId === 'SES003' && r.status === 'recorded').length
    let current = 0
    const interval = setInterval(() => {
      if (current < total) {
        current++
        setCount(current)
      }
    }, 1500)
    return () => clearInterval(interval)
  }, [])

  // Countdown — auto-close when it hits zero
  useEffect(() => {
    if (timeLeft <= 0) {
      const t = setTimeout(() => {
        toast('Window closed — reviewing attendance...')
        navigate(`/faculty/sessions/${session.id}/review`)
      }, 1500)
      return () => clearTimeout(t)
    }
    const t = setInterval(() => setTimeLeft(p => p - 1), 1000)
    return () => clearInterval(t)
  }, [timeLeft])

  const handleCopyPin = () => {
    navigator.clipboard.writeText(session.pin).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success('PIN copied')
  }

  const handleClose = () => {
    setConfirmClose(false)
    toast.success('Session closed — processing attendance...')
    navigate(`/faculty/sessions/${session.id}/review`)
  }

  const mins = Math.floor(timeLeft / 60)
  const secs = timeLeft % 60
  const pct = Math.round((count / session.totalStudents) * 100)

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
            <p className="text-xs text-ink-muted">{course?.code} · {course?.name}</p>
          </div>
        </div>
        <Button variant="danger" size="sm" onClick={() => setConfirmClose(true)}>
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
            <p className="text-xs text-ink-muted mt-1">remaining</p>
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

        {/* Re-submissions toggle */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-3"
        >
          <span className="text-xs text-ink-muted">Allow re-submissions</span>
          <button
            onClick={() => {
              setAllowResubmit(p => !p)
              toast.success(!allowResubmit ? 'Re-submissions enabled' : 'Re-submissions disabled')
            }}
            className={`relative w-10 h-5 rounded-full transition-colors duration-200 flex-shrink-0 ${
              allowResubmit ? 'bg-accent' : 'bg-bg-elevated border border-bg-border'
            }`}
          >
            <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-200 ${
              allowResubmit ? 'translate-x-5' : 'translate-x-0.5'
            }`} />
          </button>
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
