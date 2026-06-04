import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ChevronRight, GraduationCap, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { getStudent, getStudentAbsences, ApiError } from '../../lib/api'
import type { CourseAbsences, StudentInfo } from '../../lib/api'
import { cn } from '../../lib/utils'
import { usePageTitle } from '../../hooks/usePageTitle'

export default function AttendanceHistory() {
  usePageTitle('Absence History')
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [searchId, setSearchId] = useState(searchParams.get('id') || '')
  const [queriedId, setQueriedId] = useState(searchParams.get('id') || '')

  const [student, setStudent] = useState<StudentInfo | null>(null)
  const [history, setHistory] = useState<CourseAbsences[]>([])
  const [notFound, setNotFound] = useState(false)
  const [fetching, setFetching] = useState(false)

  useEffect(() => {
    const id = searchParams.get('id')
    if (id) { setQueriedId(id); setSearchId(id) }
  }, [])

  useEffect(() => {
    if (!queriedId) {
      setStudent(null)
      setHistory([])
      setNotFound(false)
      return
    }
    let cancelled = false
    setFetching(true)
    setNotFound(false)

    Promise.all([
      getStudent(queriedId),
      getStudentAbsences(queriedId),
    ])
      .then(([s, h]) => {
        if (cancelled) return
        setStudent(s)
        setHistory(h)
      })
      .catch((err) => {
        if (cancelled) return
        if (err instanceof ApiError && err.status === 404) {
          setStudent(null)
          setHistory([])
          setNotFound(true)
        }
      })
      .finally(() => { if (!cancelled) setFetching(false) })

    return () => { cancelled = true }
  }, [queriedId])

  const handleSearch = () => setQueriedId(searchId.trim().toUpperCase())

  return (
    <div className="min-h-screen p-5 dot-grid">
      <div className="max-w-md mx-auto flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={() => navigate('/')}
            className="p-2 rounded-xl text-ink-muted hover:text-ink-secondary hover:bg-bg-elevated transition-colors"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
              <GraduationCap size={16} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-ink-primary leading-none">Absence History</p>
              <p className="text-xs text-ink-muted mt-0.5">Ashesi University</p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Enter your Student ID"
            value={searchId}
            onChange={e => setSearchId(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            className="flex-1 px-4 py-2.5 h-11 bg-bg-surface border border-bg-border rounded-xl text-sm text-ink-primary placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/50 uppercase"
            autoFocus={!searchParams.get('id')}
          />
          <button
            onClick={handleSearch}
            className="px-4 h-11 rounded-xl bg-accent text-white text-sm font-medium hover:bg-accent-light transition-colors"
          >
            Search
          </button>
        </div>

        {queriedId && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col gap-3"
          >
            {fetching && (
              <div className="p-4 rounded-2xl bg-bg-card border border-bg-border animate-pulse h-16" />
            )}

            {!fetching && notFound && (
              <div className="p-4 rounded-2xl bg-danger/5 border border-danger/20 text-danger text-sm">
                No student found with ID <code className="font-mono">{queriedId}</code>
              </div>
            )}

            {!fetching && student && (
              <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-bg-card border border-bg-border shadow-sm">
                <div className="w-9 h-9 rounded-xl bg-accent/15 text-accent flex items-center justify-center font-bold text-sm">
                  {student.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <p className="font-semibold text-ink-primary text-sm truncate">{student.name}</p>
                  <p className="text-xs text-ink-muted">{queriedId} · {student.program} · Year {student.year}</p>
                </div>
              </div>
            )}

            {!fetching && student && history.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center gap-3 py-12 text-center"
              >
                <div className="w-14 h-14 rounded-2xl bg-success/10 border border-success/20 flex items-center justify-center">
                  <CheckCircle2 size={22} className="text-success" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink-primary">No absences on record</p>
                  <p className="text-xs text-ink-muted mt-1">
                    Great work — all finalized sessions show you as present.
                  </p>
                </div>
              </motion.div>
            )}

            <div className="flex flex-col gap-2">
              {history.map((course, i) => {
                const unexcused = course.absences.filter(a => a.status === 'absent_unexcused').length
                const excused = course.absences.filter(a => a.status === 'absent_excused').length

                return (
                  <motion.button
                    key={course.courseId}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.07 }}
                    onClick={() => navigate(
                      `/history/course?id=${queriedId}&course=${course.courseId}`,
                      { state: { courseCode: course.courseCode, courseName: course.courseName } },
                    )}
                    className="w-full text-left flex items-center gap-3 p-4 rounded-2xl bg-bg-card border border-bg-border shadow-sm hover:border-danger/30 hover:bg-bg-elevated hover:shadow-md transition-all duration-200"
                  >
                    <div className={cn(
                      'w-1 self-stretch rounded-full flex-shrink-0',
                      unexcused > 0 ? 'bg-danger' : 'bg-warning'
                    )} />

                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-mono text-ink-muted">{course.courseCode}</p>
                      <p className="text-sm font-semibold text-ink-primary mt-0.5">{course.courseName}</p>
                      <div className="flex items-center gap-3 mt-1.5">
                        {unexcused > 0 && (
                          <span className="text-xs text-danger font-medium">
                            {unexcused} unexcused
                          </span>
                        )}
                        {excused > 0 && (
                          <span className="text-xs text-warning font-medium">
                            {excused} excused
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0 flex items-center gap-3">
                      <div>
                        <p className={cn(
                          'text-xl font-bold',
                          unexcused > 0 ? 'text-danger' : 'text-warning'
                        )}>
                          {course.absences.length}
                        </p>
                        <p className="text-xs text-ink-muted">absence{course.absences.length !== 1 ? 's' : ''}</p>
                      </div>
                      <ChevronRight size={15} className="text-ink-muted" />
                    </div>
                  </motion.button>
                )
              })}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
