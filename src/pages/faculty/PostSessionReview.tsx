import { useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { UserCheck, UserX, MessageSquare, AlertTriangle, Search, Clock, ArrowLeft, X } from 'lucide-react'
import { Card, Divider } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { StatusBadge, Badge } from '../../components/ui/Badge'
import { Avatar } from '../../components/ui/Avatar'
import { Modal } from '../../components/ui/Modal'
import { Input } from '../../components/ui/Input'
import { mockSessions, mockCourses, mockAttendance } from '../../data/mock'
import type { AttendanceRecord, AttendanceStatus } from '../../types'
import { formatDate, cn } from '../../lib/utils'
import { usePageTitle } from '../../hooks/usePageTitle'
import toast from 'react-hot-toast'

export default function PostSessionReview() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  usePageTitle('Session Review')
  const fallbackId = 'SES003'
  const session = mockSessions.find(s => s.id === (sessionId || fallbackId)) || mockSessions.find(s => s.status === 'closed')!
  const course = mockCourses.find(c => c.id === session?.courseId)

  const [records, setRecords] = useState<AttendanceRecord[]>(
    mockAttendance.filter(r => r.sessionId === session.id)
  )
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | AttendanceStatus>('all')
  const [noteModal, setNoteModal] = useState<{ record: AttendanceRecord } | null>(null)
  const [noteText, setNoteText] = useState('')
  const listRef = useRef<HTMLDivElement>(null)

  const setFilterAndScroll = (f: typeof filter) => {
    setFilter(f)
    listRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const statusOrder: Record<AttendanceStatus, number> = {
    absent_unexcused: 0,
    absent_excused: 1,
    recorded: 2,
    pending: 3,
  }

  const filtered = records
    .filter(r => {
      const matchSearch = r.studentName.toLowerCase().includes(search.toLowerCase()) ||
        r.studentId.toLowerCase().includes(search.toLowerCase())
      const matchFilter = filter === 'all' || r.status === filter
      return matchSearch && matchFilter
    })
    .sort((a, b) => statusOrder[a.status] - statusOrder[b.status])

  const stats = {
    recorded: records.filter(r => r.status === 'recorded').length,
    excused: records.filter(r => r.status === 'absent_excused').length,
    unexcused: records.filter(r => r.status === 'absent_unexcused').length,
  }

  const markPresent = (id: string) => {
    setRecords(prev => prev.map(r =>
      r.id === id ? { ...r, status: 'recorded' as AttendanceStatus, overriddenBy: 'Faculty Override' } : r
    ))
    toast.success('Marked as present')
  }

  const markAbsent = (id: string) => {
    setRecords(prev => prev.map(r =>
      r.id === id ? { ...r, status: 'absent_unexcused' as AttendanceStatus, overriddenBy: 'Faculty Override', submittedAt: undefined } : r
    ))
    toast.success('Marked as absent')
  }

  const openNoteModal = (record: AttendanceRecord) => {
    setNoteModal({ record })
    setNoteText(record.note || '')
  }

  const saveNote = () => {
    if (!noteModal) return
    setRecords(prev => prev.map(r =>
      r.id === noteModal.record.id
        ? { ...r, note: noteText, status: noteText ? 'absent_excused' as AttendanceStatus : r.status }
        : r
    ))
    toast.success('Note saved · marked as excused')
    setNoteModal(null)
    setNoteText('')
  }

  return (
    <div ref={listRef} className="flex flex-col h-full overflow-auto">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-bg-border flex-shrink-0">
        <button
          onClick={() => navigate(`/faculty/courses/${session.courseId}`)}
          className="p-1.5 rounded-lg text-ink-muted hover:text-ink-secondary hover:bg-bg-elevated transition-colors"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <p className="text-base font-semibold text-ink-primary">Session Review</p>
          <p className="text-xs text-ink-muted">{course?.code} · {formatDate(session.date)}</p>
        </div>
      </div>

      <div className="flex-1 p-6 space-y-5 max-w-3xl mx-auto w-full">
        {/* DBSCAN result banner */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl bg-accent/5 border border-accent/20 flex items-start gap-3"
        >
          <div className="w-8 h-8 rounded-xl bg-accent/15 flex items-center justify-center flex-shrink-0">
            <span className="text-accent text-xs font-bold">DB</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-ink-primary">DBSCAN completed</p>
            <p className="text-xs text-ink-secondary mt-0.5">
              Largest cluster: <strong className="text-success">{stats.recorded} students</strong> · ε = {session.epsilon}m · min_samples = {session.minSamples}
              {' · '}Outliers excluded as absent
            </p>
          </div>
        </motion.div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Recorded', value: stats.recorded, color: 'text-success', bg: 'bg-success/5 border-success/15' },
            { label: 'Excused Absent', value: stats.excused, color: 'text-warning', bg: 'bg-warning/5 border-warning/15' },
            { label: 'Unexcused Absent', value: stats.unexcused, color: 'text-danger', bg: 'bg-danger/5 border-danger/15' },
          ].map(s => (
            <div key={s.label} className={cn('rounded-2xl border p-4 text-center', s.bg)}>
              <p className={cn('text-2xl font-bold', s.color)}>{s.value}</p>
              <p className="text-xs text-ink-secondary mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Filters + search */}
        <div className="flex items-center gap-2 flex-wrap">
          <Input
            placeholder="Search student..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            icon={<Search size={14} />}
            suffix={search ? (
              <button onClick={() => setSearch('')} className="text-ink-muted hover:text-ink-secondary transition-colors">
                <X size={13} />
              </button>
            ) : undefined}
            className="flex-1 min-w-40"
          />
          <div className="flex gap-1">
            {(['all', 'recorded', 'absent_excused', 'absent_unexcused'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilterAndScroll(f)}
                className={cn(
                  'text-xs px-3 py-1.5 rounded-lg font-medium transition-all',
                  filter === f
                    ? 'bg-accent text-white'
                    : 'text-ink-secondary hover:text-ink-primary bg-bg-surface border border-bg-border'
                )}
              >
                {f === 'all' ? 'All' : f === 'recorded' ? 'Recorded' : f === 'absent_excused' ? 'Excused' : 'Unexcused'}
              </button>
            ))}
          </div>
        </div>

        {/* Records table */}
        <Card padding="none">
          {filtered.map((record, i) => (
            <motion.div
              key={record.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.03 }}
            >
              <div className="flex items-center gap-3 px-4 py-3.5 hover:bg-bg-elevated/40 transition-colors">
                <Avatar name={record.studentName} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ink-primary truncate">{record.studentName}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-xs text-ink-muted">{record.studentId}</p>
                    {record.submittedAt && (
                      <span className="flex items-center gap-1 text-xs text-ink-muted">
                        <Clock size={11} />
                        {new Date(record.submittedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    )}
                  </div>
                  {record.note && (
                    <p className="text-xs text-ink-secondary mt-0.5 italic">"{record.note}"</p>
                  )}
                  {record.overriddenBy && (
                    <Badge variant="warning" size="sm" className="mt-1">Faculty override</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <StatusBadge status={record.status} />
                  {record.status === 'recorded' ? (
                    <button
                      onClick={() => markAbsent(record.id)}
                      className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg text-danger bg-danger/8 hover:bg-danger/15 border border-danger/20 transition-all whitespace-nowrap"
                    >
                      <UserX size={12} />
                      Mark absent
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => markPresent(record.id)}
                        className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg text-success bg-success/8 hover:bg-success/15 border border-success/20 transition-all whitespace-nowrap"
                      >
                        <UserCheck size={12} />
                        Mark present
                      </button>
                      <button
                        onClick={() => openNoteModal(record)}
                        title="Add absence note"
                        className="p-1.5 rounded-lg text-ink-muted hover:text-warning hover:bg-warning/10 transition-all"
                      >
                        <MessageSquare size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
              {i < filtered.length - 1 && <Divider />}
            </motion.div>
          ))}

          {filtered.length === 0 && (
            <div className="py-10 text-center text-sm text-ink-muted">No records match your filter</div>
          )}
        </Card>
      </div>

      {/* Note modal */}
      <Modal
        open={!!noteModal}
        onClose={() => setNoteModal(null)}
        title="Absence Note"
        description={`Add a note for ${noteModal?.record.studentName}. A note marks the absence as excused.`}
        size="sm"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setNoteModal(null)}>Cancel</Button>
            <Button size="sm" onClick={saveNote}>Save note · Mark excused</Button>
          </>
        }
      >
        <div className="py-2">
          <div className="flex items-start gap-2 mb-3 p-3 rounded-xl bg-warning/5 border border-warning/20">
            <AlertTriangle size={13} className="text-warning flex-shrink-0 mt-0.5" />
            <p className="text-xs text-warning">Saving a note marks this absence as <strong>excused</strong>. Leave blank for unexcused.</p>
          </div>
          <textarea
            value={noteText}
            onChange={e => setNoteText(e.target.value)}
            placeholder="e.g. Student notified in advance — medical appointment..."
            rows={3}
            className="w-full rounded-xl bg-bg-surface border border-bg-border text-ink-primary placeholder:text-ink-muted text-sm px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/50 resize-none"
          />
        </div>
      </Modal>
    </div>
  )
}
