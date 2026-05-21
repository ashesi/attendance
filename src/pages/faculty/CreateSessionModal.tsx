import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Info, Clock, AlertTriangle, ChevronDown } from 'lucide-react'
import { Modal } from '../../components/ui/Modal'
import { Input, Select } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { mockCourses } from '../../data/mock'
import { useAppStore } from '../../store'
import { generatePIN } from '../../lib/utils'
import toast from 'react-hot-toast'

interface Props {
  open: boolean
  onClose: () => void
  defaultCourseId?: string
}

const MIN_SAMPLES_DISCLAIMER = `min_samples controls how many GPS points DBSCAN requires to form a "cluster" (group of students physically present together).

Setting it too LOW: Even a small cluster of students colluding off-campus could be marked as present.

Setting it too HIGH: Legitimate students who are physically present may not form a large enough cluster, and be marked absent.

The recommended value is 10. Only change this if you have a specific reason — for example, a very small class. Consult your department if unsure.`

function addMinutes(time: string, mins: number): string {
  const [h, m] = time.split(':').map(Number)
  const total = h * 60 + m + mins
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

function todayISO(): string {
  return new Date().toISOString().split('T')[0]
}

// Extract default start time from course schedule string e.g. "Mon / Wed / Fri · 08:00–09:00"
function defaultStartTime(schedule: string): string {
  const match = schedule.match(/(\d{2}:\d{2})/)
  return match ? match[1] : '08:00'
}

export default function CreateSessionModal({ open, onClose, defaultCourseId }: Props) {
  const { userId } = useAppStore()
  const navigate = useNavigate()
  const myCourses = mockCourses.filter(c => c.facultyId === userId)

  const [courseId, setCourseId] = useState(defaultCourseId || myCourses[0]?.id || '')
  const [sessionDate, setSessionDate] = useState(todayISO())
  const [classStartTime, setClassStartTime] = useState(() => {
    const course = myCourses.find(c => c.id === (defaultCourseId || myCourses[0]?.id || ''))
    return course ? defaultStartTime(course.schedule) : '08:00'
  })
  const [windowDuration, setWindowDuration] = useState('5')
  const [minSamples, setMinSamples] = useState('10')
  const [showDisclaimer, setShowDisclaimer] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [loading, setLoading] = useState(false)

  const selectedCourse = myCourses.find(c => c.id === courseId)

  // When course changes, update the default start time from schedule
  const handleCourseChange = (id: string) => {
    setCourseId(id)
    const course = myCourses.find(c => c.id === id)
    if (course) setClassStartTime(defaultStartTime(course.schedule))
  }

  const windowClose = addMinutes(classStartTime, parseInt(windowDuration) || 5)

  const handleMinSamplesChange = (val: string) => {
    const n = parseInt(val)
    if (!isNaN(n) && n !== 10) setShowDisclaimer(true)
    setMinSamples(val)
  }

  const handleCreate = async () => {
    if (!courseId) return
    setLoading(true)
    await new Promise(r => setTimeout(r, 800))
    const pin = generatePIN()
    toast.success(`Session created · PIN: ${pin}`)
    setLoading(false)
    onClose()
    if (defaultCourseId) navigate(`/faculty/courses/${defaultCourseId}`)
  }

  return (
    <>
      <Modal
        open={open && !showDisclaimer}
        onClose={onClose}
        title="Create Session"
        description="A unique PIN will be generated for students to submit attendance"
        size="md"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
            <Button size="sm" onClick={handleCreate} loading={loading} disabled={!courseId}>
              Create Session
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4 py-2">
          {/* Course selector — only show if no default */}
          {!defaultCourseId && (
            <Select
              label="Course"
              value={courseId}
              onChange={e => handleCourseChange(e.target.value)}
              options={myCourses.map(c => ({ value: c.id, label: `${c.code} · ${c.name}` }))}
            />
          )}

          {selectedCourse && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-bg-surface border border-bg-border">
              <Info size={13} className="text-ink-muted flex-shrink-0" />
              <p className="text-xs text-ink-muted">
                {selectedCourse.cohort} · {selectedCourse.enrolledCount} students enrolled
              </p>
            </div>
          )}

          {/* Date + time */}
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Date"
              type="date"
              value={sessionDate}
              onChange={e => setSessionDate(e.target.value)}
            />
            <Input
              label="Class starts"
              type="time"
              value={classStartTime}
              onChange={e => setClassStartTime(e.target.value)}
              hint={selectedCourse ? `Schedule: ${selectedCourse.schedule.split('·')[1]?.trim() || ''}` : undefined}
            />
          </div>

          <Input
            label="Window duration (minutes)"
            type="number"
            min="1"
            max="30"
            value={windowDuration}
            onChange={e => setWindowDuration(e.target.value)}
            hint="How long students have to submit once class starts"
          />

          {/* Summary */}
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-accent/5 border border-accent/15">
            <Clock size={14} className="text-accent flex-shrink-0" />
            <p className="text-xs text-accent">
              Window opens at <strong>{classStartTime}</strong> and closes at <strong>{windowClose}</strong>
            </p>
          </div>

          {/* Advanced */}
          <div className="border-t border-bg-border pt-3">
            <button
              type="button"
              onClick={() => setShowAdvanced(p => !p)}
              className="flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink-secondary transition-colors"
            >
              <ChevronDown size={13} className={`transition-transform duration-200 ${showAdvanced ? 'rotate-180' : ''}`} />
              Advanced settings
              {parseInt(minSamples) !== 10 && (
                <span className="ml-1 px-1.5 py-0.5 rounded bg-warning/15 text-warning text-[10px] font-medium">modified</span>
              )}
            </button>

            {showAdvanced && (
              <div className="mt-3">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium text-ink-secondary">DBSCAN min_samples</label>
                  <button onClick={() => setShowDisclaimer(true)} className="text-xs text-accent hover:underline">
                    What is this?
                  </button>
                </div>
                <Input
                  type="number"
                  min="2"
                  max="50"
                  value={minSamples}
                  onChange={e => handleMinSamplesChange(e.target.value)}
                  hint={parseInt(minSamples) !== 10 ? 'Changed from recommended default (10)' : 'Recommended: 10'}
                />
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* min_samples disclaimer */}
      <Modal
        open={showDisclaimer}
        onClose={() => setShowDisclaimer(false)}
        title="About min_samples"
        size="md"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => { setMinSamples('10'); setShowDisclaimer(false) }}>
              Reset to 10 (recommended)
            </Button>
            <Button size="sm" onClick={() => setShowDisclaimer(false)}>
              I understand, keep my value
            </Button>
          </>
        }
      >
        <div className="py-2 flex flex-col gap-3">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-warning/5 border border-warning/20">
            <AlertTriangle size={15} className="text-warning flex-shrink-0 mt-0.5" />
            <p className="text-xs text-warning leading-relaxed">
              Changing this value affects how DBSCAN determines who is physically present. Read carefully before proceeding.
            </p>
          </div>
          <Card className="bg-bg-surface">
            <p className="text-xs text-ink-secondary leading-relaxed whitespace-pre-line">{MIN_SAMPLES_DISCLAIMER}</p>
          </Card>
          <p className="text-xs text-ink-muted">Current value: <code className="font-mono text-accent">{minSamples}</code> (default is 10)</p>
        </div>
      </Modal>
    </>
  )
}
