import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BookOpen, Users, ChevronRight, Calendar } from 'lucide-react'
import { SessionStatusBadge } from '../../components/ui/Badge'
import { CourseCardSkeleton } from '../../components/ui/Skeleton'
import { getMyCourses, ApiError } from '../../lib/api'
import type { CourseWithSession } from '../../lib/api'
import { usePageTitle } from '../../hooks/usePageTitle'
import { formatDate } from '../../lib/utils'
import toast from 'react-hot-toast'

export default function FacultyCourses() {
  usePageTitle('My Courses')
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [courses, setCourses] = useState<CourseWithSession[]>([])

  useEffect(() => {
    let cancelled = false

    const load = async (initial: boolean) => {
      try {
        const data = await getMyCourses()
        if (!cancelled) setCourses(data)
      } catch (err) {
        if (!cancelled && !(err instanceof ApiError && err.status === 401)) {
          toast.error('Failed to load courses')
        }
      } finally {
        if (initial && !cancelled) setLoading(false)
      }
    }

    void load(true)
    const interval = setInterval(() => void load(false), 5000)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  return (
    <div className="flex flex-col h-full overflow-auto">
      <div className="px-5 py-4 border-b border-bg-border">
        <p className="text-base font-semibold text-ink-primary">My Courses</p>
        <p className="text-xs text-ink-muted mt-0.5">Select a course to manage sessions</p>
      </div>

      <div className="flex-1 p-6">
        <div className="flex flex-col gap-2 max-w-xl">
          {loading && [0, 1, 2].map(i => <CourseCardSkeleton key={i} />)}
          {!loading && courses.map((course, i) => {
            const ls = course.latestSession
            const isLive = ls?.status === 'open'
            const isUpcoming = ls?.status === 'upcoming'

            return (
              <motion.button
                key={course.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                onClick={() => navigate(`/faculty/courses/${course.id}`)}
                className="w-full text-left flex items-center gap-3 p-4 rounded-2xl bg-bg-card border border-bg-border shadow-sm hover:border-accent/30 hover:bg-bg-elevated hover:shadow-md transition-all duration-200 group"
              >
                <div className="w-9 h-9 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center flex-shrink-0">
                  <BookOpen size={16} className="text-accent" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-mono text-ink-muted">{course.code}</p>
                    {isLive && <SessionStatusBadge status="open" />}
                    {isUpcoming && !isLive && <SessionStatusBadge status="upcoming" />}
                  </div>
                  <p className="text-sm font-semibold text-ink-primary mt-0.5 truncate">{course.name}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1 text-xs text-ink-muted">
                      <Users size={10} />
                      {course.enrolledCount} students
                    </span>
                    {isUpcoming && !isLive && ls && (
                      <span className="flex items-center gap-1 text-xs text-ink-muted">
                        <Calendar size={10} />
                        Next: {formatDate(ls.date)}
                      </span>
                    )}
                    {isLive && ls && (
                      <span className="flex items-center gap-1 text-xs text-success font-medium">
                        Live · closes {ls.windowCloseTime}
                      </span>
                    )}
                  </div>
                </div>

                <ChevronRight size={15} className="text-ink-muted group-hover:text-accent transition-colors flex-shrink-0" />
              </motion.button>
            )
          })}

          {!loading && courses.length === 0 && (
            <p className="text-sm text-ink-muted text-center py-16">No courses assigned to your account.</p>
          )}
        </div>
      </div>
    </div>
  )
}
