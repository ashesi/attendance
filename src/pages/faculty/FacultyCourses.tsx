import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BookOpen, Users, ChevronRight, Calendar } from 'lucide-react'
import { SessionStatusBadge } from '../../components/ui/Badge'
import { CourseCardSkeleton } from '../../components/ui/Skeleton'
import { mockCourses, mockSessions } from '../../data/mock'
import { useAppStore } from '../../store'
import { usePageTitle } from '../../hooks/usePageTitle'
import { formatDate, cn } from '../../lib/utils'

export default function FacultyCourses() {
  usePageTitle('My Courses')
  const { userId } = useAppStore()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 400)
    return () => clearTimeout(t)
  }, [])

  const myCourses = mockCourses.filter(c => c.facultyId === userId)

  return (
    <div className="flex flex-col h-full overflow-auto">
      <div className="px-5 py-4 border-b border-bg-border">
        <p className="text-base font-semibold text-ink-primary">My Courses</p>
        <p className="text-xs text-ink-muted mt-0.5">Select a course to manage sessions</p>
      </div>

      <div className="flex-1 p-6">
        <div className="flex flex-col gap-2 max-w-xl">
          {loading && [0, 1, 2].map(i => <CourseCardSkeleton key={i} />)}
          {!loading && myCourses.map((course, i) => {
            const sessions = mockSessions.filter(s => s.courseId === course.id)
            const liveSession = sessions.find(s => s.status === 'open')
            const nextUpcoming = sessions
              .filter(s => s.status === 'upcoming')
              .sort((a, b) => a.date.localeCompare(b.date))[0]

            const closedSessions = sessions.filter(s => s.status === 'closed')
            const attendanceRate = closedSessions.length > 0
              ? Math.round(
                  closedSessions.reduce((sum, s) => sum + (s.submissionsCount / s.totalStudents) * 100, 0)
                  / closedSessions.length
                )
              : null

            const rateColor = attendanceRate === null
              ? 'bg-bg-border'
              : attendanceRate >= 80 ? 'bg-success'
              : attendanceRate >= 60 ? 'bg-warning'
              : 'bg-danger'

            const rateTextColor = attendanceRate === null
              ? 'text-ink-muted'
              : attendanceRate >= 80 ? 'text-success'
              : attendanceRate >= 60 ? 'text-warning'
              : 'text-danger'

            return (
              <motion.button
                key={course.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                onClick={() => navigate(`/faculty/courses/${course.id}`)}
                className="w-full text-left flex items-center gap-3 p-4 rounded-2xl bg-bg-card border border-bg-border shadow-sm hover:border-accent/30 hover:bg-bg-elevated hover:shadow-md transition-all duration-200 group"
              >
                {/* Attendance rate bar */}
                <div className="relative w-1 self-stretch rounded-full bg-bg-elevated flex-shrink-0 overflow-hidden">
                  {attendanceRate !== null && (
                    <div
                      className={cn('absolute bottom-0 left-0 w-full rounded-full', rateColor)}
                      style={{ height: `${attendanceRate}%` }}
                    />
                  )}
                </div>

                <div className="w-9 h-9 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center flex-shrink-0">
                  <BookOpen size={16} className="text-accent" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-mono text-ink-muted">{course.code}</p>
                    {liveSession && <SessionStatusBadge status="open" />}
                    {nextUpcoming && !liveSession && <SessionStatusBadge status="upcoming" />}
                  </div>
                  <p className="text-sm font-semibold text-ink-primary mt-0.5 truncate">{course.name}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1 text-xs text-ink-muted">
                      <Users size={10} />
                      {course.enrolledCount} students
                    </span>
                    {nextUpcoming && !liveSession && (
                      <span className="flex items-center gap-1 text-xs text-ink-muted">
                        <Calendar size={10} />
                        Next: {formatDate(nextUpcoming.date)}
                      </span>
                    )}
                    {liveSession && (
                      <span className="flex items-center gap-1 text-xs text-success font-medium">
                        Live · closes {liveSession.windowCloseTime}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {attendanceRate !== null && (
                    <p className={cn('text-sm font-bold', rateTextColor)}>{attendanceRate}%</p>
                  )}
                  <ChevronRight size={15} className="text-ink-muted group-hover:text-accent transition-colors" />
                </div>
              </motion.button>
            )
          })}
          </div>
      </div>
    </div>
  )
}
