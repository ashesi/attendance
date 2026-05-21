import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Calendar, MapPin, AlertCircle, GraduationCap } from 'lucide-react'
import { mockAttendance, mockSessions, mockCourses, mockStudents } from '../../data/mock'
import { StatusBadge } from '../../components/ui/Badge'
import { formatDate, cn, absenceReasonLabel } from '../../lib/utils'
import { usePageTitle } from '../../hooks/usePageTitle'
import type { AttendanceStatus, AbsenceReason } from '../../types'

export default function CourseAttendanceDetail() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const studentId = searchParams.get('id') || ''
  const courseId = searchParams.get('course') || ''

  const student = mockStudents.find(s => s.id === studentId)
  const course = mockCourses.find(c => c.id === courseId)
  usePageTitle(course?.code ?? 'Course Detail')

  const absences = mockAttendance
    .filter(r => r.studentId === studentId)
    .map(r => {
      const session = mockSessions.find(s => s.id === r.sessionId)
      if (!session || session.courseId !== courseId || session.status !== 'closed') return null
      if (r.status !== 'absent_excused' && r.status !== 'absent_unexcused') return null
      return {
        sessionId: r.sessionId,
        date: session.date,
        startTime: session.startTime,
        status: r.status as AttendanceStatus,
        absenceReason: r.absenceReason as AbsenceReason | undefined,
        note: r.note,
        overriddenBy: r.overriddenBy,
      }
    })
    .filter((r): r is NonNullable<typeof r> => r !== null)
    .sort((a, b) => b.date.localeCompare(a.date))

  const unexcused = absences.filter(a => a.status === 'absent_unexcused').length
  const excused = absences.filter(a => a.status === 'absent_excused').length

  return (
    <div className="min-h-screen p-5 dot-grid">
      <div className="max-w-md mx-auto flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl text-ink-muted hover:text-ink-secondary hover:bg-bg-elevated transition-colors"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
              <GraduationCap size={16} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-ink-primary leading-none">{course?.code}</p>
              <p className="text-xs text-ink-muted mt-0.5 truncate max-w-[200px]">{course?.name}</p>
            </div>
          </div>
        </div>

        {/* Student + absence summary */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl bg-bg-card border border-bg-border shadow-sm flex items-center justify-between gap-4"
        >
          <div>
            <p className="text-xs text-ink-muted">{student?.id}</p>
            <p className="text-sm font-semibold text-ink-primary">{student?.name}</p>
            <div className="flex gap-3 mt-2">
              {unexcused > 0 && <span className="text-xs text-danger font-medium">{unexcused} unexcused</span>}
              {excused > 0 && <span className="text-xs text-warning font-medium">{excused} excused</span>}
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className={cn(
              'text-3xl font-black',
              unexcused > 0 ? 'text-danger' : 'text-warning'
            )}>
              {absences.length}
            </p>
            <p className="text-xs text-ink-muted">
              absence{absences.length !== 1 ? 's' : ''}
            </p>
          </div>
        </motion.div>

        {/* Info banner */}
        <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl bg-accent/5 border border-accent/20">
          <AlertCircle size={14} className="text-accent flex-shrink-0 mt-0.5" />
          <p className="text-xs text-ink-secondary leading-relaxed">
            If you believe an absence is incorrect, please contact your FI or TA to have it reviewed.
          </p>
        </div>

        {/* Absence list */}
        <div className="flex flex-col gap-2">
          {absences.map((rec, i) => (
            <motion.div
              key={rec.sessionId}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="p-4 rounded-2xl bg-bg-card border border-bg-border shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Calendar size={12} className="text-ink-muted flex-shrink-0" />
                    <p className="text-sm font-semibold text-ink-primary">{formatDate(rec.date)}</p>
                  </div>

                  {rec.absenceReason && (
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <MapPin size={11} className="text-ink-muted flex-shrink-0" />
                      <p className="text-xs text-ink-secondary">
                        {absenceReasonLabel(rec.absenceReason)}
                      </p>
                    </div>
                  )}

                  {rec.note && (
                    <p className="text-xs text-ink-secondary mt-1.5 leading-relaxed italic">
                      "{rec.note}"
                    </p>
                  )}
                </div>
                <StatusBadge status={rec.status} size="md" />
              </div>
            </motion.div>
          ))}

          {absences.length === 0 && (
            <p className="text-sm text-ink-muted text-center py-10">No absences for this course.</p>
          )}
        </div>
      </div>
    </div>
  )
}
