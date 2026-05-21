import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, ChevronRight, Activity } from 'lucide-react'
import { TopBar } from '../../components/layout/TopBar'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { SessionStatusBadge } from '../../components/ui/Badge'
import { mockSessions, mockCourses } from '../../data/mock'
import { useAppStore } from '../../store'
import { formatDate } from '../../lib/utils'
import { cn } from '../../lib/utils'
import CreateSessionModal from './CreateSessionModal'

export default function FacultySessions() {
  const { userId } = useAppStore()
  const navigate = useNavigate()
  const [showCreate, setShowCreate] = useState(false)
  const [filter, setFilter] = useState<'all' | 'open' | 'upcoming' | 'closed'>('all')

  const myCourses = mockCourses.filter(c => c.facultyId === userId)
  const mySessions = mockSessions.filter(s => myCourses.some(c => c.id === s.courseId))
  const filtered = filter === 'all' ? mySessions : mySessions.filter(s => s.status === filter)

  return (
    <div className="flex flex-col h-full overflow-auto">
      <TopBar
        title="Sessions"
        subtitle={`${mySessions.length} total sessions`}
        actions={
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus size={14} /> New Session
          </Button>
        }
      />

      <div className="flex-1 p-6 space-y-4">
        {/* Filter tabs */}
        <div className="flex gap-1">
          {(['all', 'open', 'upcoming', 'closed'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'text-xs px-3 py-1.5 rounded-lg font-medium capitalize transition-all',
                filter === f
                  ? 'bg-accent text-white'
                  : 'text-ink-secondary hover:text-ink-primary bg-bg-surface border border-bg-border'
              )}
            >
              {f}
            </button>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="flex flex-col items-center py-16 gap-3">
            <Activity size={28} className="text-ink-muted" />
            <p className="text-sm text-ink-muted">No sessions found</p>
          </div>
        )}

        <div className="flex flex-col gap-3 max-w-2xl">
          {filtered.map((session, i) => {
            const course = myCourses.find(c => c.id === session.courseId)
            const rate = session.totalStudents > 0
              ? Math.round((session.submissionsCount / session.totalStudents) * 100)
              : 0

            return (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card hover padding="sm" onClick={() => {
                  if (session.status === 'open') navigate(`/faculty/sessions/${session.id}/live`)
                  else if (session.status === 'closed') navigate(`/faculty/sessions/${session.id}/review`)
                }}>
                  <div className="flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-mono text-ink-muted">{course?.code}</span>
                        <SessionStatusBadge status={session.status} />
                      </div>
                      <p className="text-sm font-semibold text-ink-primary">{course?.name}</p>
                      <p className="text-xs text-ink-muted mt-0.5">
                        {formatDate(session.date)} · Opens {session.windowOpenTime} → {session.windowCloseTime}
                        {session.status !== 'upcoming' && ` · PIN: `}
                        {session.status !== 'upcoming' && (
                          <code className="font-mono text-accent">{session.pin}</code>
                        )}
                      </p>
                    </div>
                    {session.status !== 'upcoming' && (
                      <div className="text-right flex-shrink-0">
                        <p className={cn('text-lg font-bold',
                          session.status === 'open' ? 'text-success' : rate >= 80 ? 'text-success' : rate >= 60 ? 'text-warning' : 'text-danger'
                        )}>
                          {session.status === 'open' ? `${session.submissionsCount}` : `${rate}%`}
                        </p>
                        <p className="text-xs text-ink-muted">
                          {session.status === 'open' ? `of ${session.totalStudents}` : 'attendance'}
                        </p>
                      </div>
                    )}
                    {(session.status === 'open' || session.status === 'closed') && (
                      <ChevronRight size={16} className="text-ink-muted flex-shrink-0" />
                    )}
                  </div>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </div>

      <CreateSessionModal open={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  )
}
