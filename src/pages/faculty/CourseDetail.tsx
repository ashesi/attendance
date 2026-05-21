import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, ChevronRight, XCircle, Clock, ArrowLeft } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { SessionStatusBadge } from '../../components/ui/Badge'
import { ConfirmModal } from '../../components/ui/Modal'
import { SessionRowSkeleton } from '../../components/ui/Skeleton'
import { mockCourses, mockSessions } from '../../data/mock'
import type { Session } from '../../types'
import { formatDate, cn } from '../../lib/utils'
import { usePageTitle } from '../../hooks/usePageTitle'
import CreateSessionModal from './CreateSessionModal'
import toast from 'react-hot-toast'

export default function CourseDetail() {
  const { courseId } = useParams()
  const navigate = useNavigate()

  const course = mockCourses.find(c => c.id === courseId)
  usePageTitle(course?.name ?? 'Course')
  const [loading, setLoading] = useState(true)
  const [sessions, setSessions] = useState<Session[]>(
    mockSessions.filter(s => s.courseId === courseId)
      .sort((a, b) => b.date.localeCompare(a.date))
  )

  const [showCreate, setShowCreate] = useState(false)
  const [cancelTarget, setCancelTarget] = useState<Session | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 300)
    return () => clearTimeout(t)
  }, [])

  const handleCancel = () => {
    if (!cancelTarget) return
    setSessions(prev => prev.filter(s => s.id !== cancelTarget.id))
    toast.success('Session cancelled')
    setCancelTarget(null)
  }

  const grouped = {
    open: sessions.filter(s => s.status === 'open'),
    upcoming: sessions.filter(s => s.status === 'upcoming'),
    closed: sessions.filter(s => s.status === 'closed'),
  }

  if (!course) return null

  return (
    <div className="flex flex-col h-full overflow-auto">
      <div className="flex items-center justify-between px-5 py-4 border-b border-bg-border">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/faculty/courses')}
            className="p-1.5 rounded-lg text-ink-muted hover:text-ink-secondary hover:bg-bg-elevated transition-colors"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <p className="text-base font-semibold text-ink-primary">{course.name}</p>
            <p className="text-xs text-ink-muted">{course.code} · {course.cohort} · {course.enrolledCount} students</p>
          </div>
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus size={14} />
          New Session
        </Button>
      </div>

      <div className="flex-1 p-6 max-w-xl space-y-6">

        {loading && <div className="flex flex-col gap-2">{[0, 1, 2].map(i => <SessionRowSkeleton key={i} />)}</div>}

        {!loading && <>{/* Live session — prominently at top */}
        {grouped.open.map(session => (
          <motion.div
            key={session.id}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-2xl border border-success/30 bg-success/5"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative w-2.5 h-2.5 flex-shrink-0">
                  <div className="absolute inset-0 rounded-full bg-success animate-ping opacity-60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-success" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink-primary">Live now · PIN <code className="font-mono text-success">{session.pin}</code></p>
                  <p className="text-xs text-ink-muted mt-0.5">
                    {session.submissionsCount} of {session.totalStudents} submitted · closes {session.windowCloseTime}
                  </p>
                </div>
              </div>
              <Button size="sm" variant="success" onClick={() => navigate(`/faculty/sessions/${session.id}/live`)}>
                Monitor
                <ChevronRight size={14} />
              </Button>
            </div>
          </motion.div>
        ))}

        {/* Upcoming sessions */}
        {grouped.upcoming.length > 0 && (
          <Section title={grouped.closed.length > 0 ? 'Upcoming' : undefined}>
            {grouped.upcoming.map((session, i) => (
              <SessionRow
                key={session.id}
                session={session}
                index={i}
                onCancel={() => setCancelTarget(session)}
              />
            ))}
          </Section>
        )}

        {/* Past sessions */}
        {grouped.closed.length > 0 && (
          <Section title={grouped.upcoming.length > 0 || grouped.open.length > 0 ? 'Past Sessions' : undefined}>
            {grouped.closed.map((session, i) => (
              <SessionRow
                key={session.id}
                session={session}
                index={i}
                onClick={() => navigate(`/faculty/sessions/${session.id}/review`)}
              />
            ))}
          </Section>
        )}

        {sessions.length === 0 && (
          <div className="flex flex-col items-center py-16 gap-3 text-center">
            <div className="w-12 h-12 rounded-2xl bg-bg-elevated flex items-center justify-center">
              <Clock size={20} className="text-ink-muted" />
            </div>
            <p className="text-sm font-semibold text-ink-primary">No sessions yet</p>
            <p className="text-xs text-ink-muted">Create your first session to get started</p>
            <Button size="sm" onClick={() => setShowCreate(true)} className="mt-1">
              <Plus size={14} /> New Session
            </Button>
          </div>
        )}
        </>}
      </div>

      <CreateSessionModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        defaultCourseId={courseId}
      />

      <ConfirmModal
        open={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        onConfirm={handleCancel}
        title="Cancel this session?"
        message={
          <p>
            The session for <strong>{formatDate(cancelTarget?.date || '')}</strong> (PIN <code className="font-mono text-ink-secondary bg-bg-elevated px-1 py-0.5 rounded">{cancelTarget?.pin}</code>) will be cancelled and removed.
            Students will not be able to submit attendance.
          </p>
        }
        confirmLabel="Yes, cancel session"
        cancelLabel="Keep it"
        danger
      />
    </div>
  )
}

function Section({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div>
      {title && <p className="text-xs font-semibold text-ink-muted uppercase tracking-wider mb-2">{title}</p>}
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  )
}

function SessionRow({
  session,
  index,
  onClick,
  onCancel,
}: {
  session: Session
  index: number
  onClick?: () => void
  onCancel?: () => void
}) {
  const rate = session.totalStudents > 0
    ? Math.round((session.submissionsCount / session.totalStudents) * 100)
    : 0

  const isClickable = !!onClick

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        'flex items-center gap-3 p-4 rounded-2xl bg-bg-card border border-bg-border shadow-sm transition-all duration-200',
        isClickable && 'cursor-pointer hover:border-accent/30 hover:bg-bg-elevated hover:shadow-md group'
      )}
      onClick={onClick}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-ink-primary">{formatDate(session.date)}</p>
          <SessionStatusBadge status={session.status} />
        </div>
        <p className="text-xs text-ink-muted mt-0.5">
          Window {session.windowOpenTime}–{session.windowCloseTime}
          {session.status !== 'upcoming' && (
            <> · PIN <code className="font-mono text-ink-secondary">{session.pin}</code></>
          )}
        </p>
      </div>

      {session.status === 'closed' && (
        <div className="text-right flex-shrink-0">
          <p className={cn('text-base font-bold',
            rate >= 80 ? 'text-success' : rate >= 60 ? 'text-warning' : 'text-danger'
          )}>
            {rate}%
          </p>
          <p className="text-xs text-ink-muted">{session.submissionsCount}/{session.totalStudents}</p>
        </div>
      )}

      {session.status === 'upcoming' && onCancel && (
        <button
          onClick={e => { e.stopPropagation(); onCancel() }}
          className="flex items-center gap-1.5 text-xs text-ink-muted hover:text-danger transition-colors px-2 py-1 rounded-lg hover:bg-danger/10"
        >
          <XCircle size={14} />
          Cancel
        </button>
      )}

      {isClickable && (
        <ChevronRight size={15} className="text-ink-muted flex-shrink-0 group-hover:text-accent transition-colors" />
      )}
    </motion.div>
  )
}
