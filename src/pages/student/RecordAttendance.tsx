import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, Smartphone, CheckCircle2, AlertCircle, User } from 'lucide-react'
import { LaptopScreenshotNotice, getStudentFirstName } from '../../components/student/LaptopScreenshotNotice'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { TopBar } from '../../components/layout/TopBar'
import toast from 'react-hot-toast'
import { mockSessions, mockCourses } from '../../data/mock'
import { cn } from '../../lib/utils'

type Stage = 'form' | 'locating' | 'success' | 'error'

interface ErrorType {
  code: 'window_closed' | 'window_not_open' | 'duplicate_device' | 'invalid_pin' | 'invalid_student'
  message: string
}

const ERROR_MESSAGES: Record<ErrorType['code'], { title: string; body: string }> = {
  window_closed: {
    title: 'Attendance window has closed',
    body: 'The submission window for this session has ended. Contact your instructor if you have a valid reason.',
  },
  window_not_open: {
    title: 'Window not yet open',
    body: "Attendance recording has not started yet. Your instructor will announce when it opens.",
  },
  duplicate_device: {
    title: 'Already recorded from this device',
    body: 'This device was used to submit attendance for this session. One submission per device is allowed.',
  },
  invalid_pin: {
    title: 'Invalid session PIN',
    body: "The PIN you entered doesn't match any active session. Double-check and try again.",
  },
  invalid_student: {
    title: 'Student ID not found',
    body: "No student with that ID exists in this course. Make sure you're entering your correct ID.",
  },
}

export default function RecordAttendance() {
  const [pin, setPin] = useState('')
  const [studentId, setStudentId] = useState('')
  const [stage, setStage] = useState<Stage>('form')
  const [error, setError] = useState<ErrorType | null>(null)
  const [sessionInfo, setSessionInfo] = useState<{ courseName: string; courseCode: string } | null>(null)
  const [isLaptop, setIsLaptop] = useState(false)
  const [recordedAt, setRecordedAt] = useState<Date | null>(null)

  const isReady = pin.length === 6 && studentId.trim().length >= 3

  const handleSubmit = async () => {
    setStage('locating')
    setIsLaptop(!/Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent))

    await new Promise(r => setTimeout(r, 600))

    const session = mockSessions.find(s => s.pin === pin)
    if (!session) {
      setError({ code: 'invalid_pin', message: '' })
      setStage('error')
      return
    }

    if (session.status === 'upcoming') {
      setError({ code: 'window_not_open', message: '' })
      setStage('error')
      return
    }

    if (session.status === 'closed' || session.status === 'processing') {
      setError({ code: 'window_closed', message: '' })
      setStage('error')
      return
    }

    await new Promise(r => setTimeout(r, 1200))

    const course = mockCourses.find(c => c.id === session.courseId)
    setSessionInfo({ courseName: course?.name || 'Unknown Course', courseCode: course?.code || '' })
    setRecordedAt(new Date())
    setStage('success')
    toast.success('Attendance recorded successfully')
  }

  const handleRetry = () => {
    setPin('')
    setStudentId('')
    setStage('form')
    setError(null)
    setSessionInfo(null)
    setRecordedAt(null)
  }

  return (
    <div className="flex flex-col h-full overflow-auto">
      <TopBar title="Record Attendance" subtitle="Enter your session PIN to mark your presence" />

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <AnimatePresence mode="wait">
            {stage === 'form' && (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="flex flex-col gap-5"
              >
                <div className="text-center mb-2">
                  <div className="w-14 h-14 rounded-2xl bg-success/10 border border-success/20 flex items-center justify-center mx-auto mb-4">
                    <MapPin size={24} className="text-success" />
                  </div>
                  <h2 className="text-xl font-bold text-ink-primary">Mark Your Presence</h2>
                  <p className="text-sm text-ink-secondary mt-1.5">
                    Enter the 6-digit PIN shown by your instructor
                  </p>
                </div>

                <Card className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-ink-secondary">Session PIN</label>
                    <div className="flex gap-2 justify-center">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div
                          key={i}
                          className={cn(
                            'w-10 h-12 rounded-xl border flex items-center justify-center text-lg font-bold transition-all',
                            pin[i]
                              ? 'bg-accent/10 border-accent/40 text-accent'
                              : 'bg-bg-surface border-bg-border text-transparent'
                          )}
                        >
                          {pin[i] || '·'}
                        </div>
                      ))}
                    </div>
                    <input
                      type="number"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      value={pin}
                      onChange={e => setPin(e.target.value.slice(0, 6))}
                      className="sr-only"
                      autoFocus
                    />
                    <input
                      type="tel"
                      inputMode="numeric"
                      placeholder="Tap to enter PIN"
                      maxLength={6}
                      value={pin}
                      onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="w-full text-center bg-bg-surface border border-bg-border rounded-xl px-4 py-2.5 text-sm text-ink-primary placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/50 tracking-[0.25em] font-mono"
                    />
                  </div>

                  <Input
                    label="Student ID"
                    placeholder="e.g. STU001"
                    value={studentId}
                    onChange={e => setStudentId(e.target.value)}
                    icon={<User size={15} />}
                    onKeyDown={e => e.key === 'Enter' && isReady && handleSubmit()}
                  />
                </Card>

                <Button
                  fullWidth
                  size="lg"
                  variant="success"
                  disabled={!isReady}
                  onClick={handleSubmit}
                >
                  <MapPin size={16} />
                  Record Attendance
                </Button>

                <div className="flex items-center gap-2 justify-center">
                  <Smartphone size={13} className="text-ink-muted" />
                  <p className="text-xs text-ink-muted">Your GPS location will be verified</p>
                </div>
              </motion.div>
            )}

            {stage === 'locating' && (
              <motion.div
                key="locating"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="text-center flex flex-col items-center gap-6 py-8"
              >
                <div className="relative w-20 h-20">
                  <div className="absolute inset-0 rounded-full border-2 border-accent/20 animate-ping" />
                  <div className="absolute inset-2 rounded-full border-2 border-accent/40 animate-ping [animation-delay:0.3s]" />
                  <div className="w-20 h-20 rounded-full bg-accent/10 border border-accent/30 flex items-center justify-center">
                    <MapPin size={28} className="text-accent animate-pulse" />
                  </div>
                </div>
                <div>
                  <p className="font-semibold text-ink-primary">Verifying your location</p>
                  <p className="text-sm text-ink-secondary mt-1">Capturing GPS coordinates...</p>
                </div>
                <div className="flex gap-1.5">
                  {[0, 1, 2].map(i => (
                    <motion.div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-accent"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.2, delay: i * 0.2, repeat: Infinity }}
                    />
                  ))}
                </div>
              </motion.div>
            )}

            {stage === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                className="text-center flex flex-col items-center gap-5"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: 'spring', stiffness: 300, damping: 20 }}
                  className="w-20 h-20 rounded-full bg-success/10 border-2 border-success/30 flex items-center justify-center"
                >
                  <CheckCircle2 size={36} className="text-success" />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <p className="text-2xl font-bold text-success">Recorded</p>
                  <p className="text-sm text-ink-secondary mt-2">
                    Your attendance has been captured for
                  </p>
                  {sessionInfo && (
                    <div className="mt-3 p-3 rounded-xl bg-bg-surface border border-bg-border">
                      <p className="text-xs text-ink-muted">{sessionInfo.courseCode}</p>
                      <p className="text-sm font-semibold text-ink-primary mt-0.5">{sessionInfo.courseName}</p>
                    </div>
                  )}

                  {isLaptop && recordedAt && (
                    <LaptopScreenshotNotice
                      studentFirstName={getStudentFirstName(studentId)}
                      recordedAt={recordedAt}
                    />
                  )}
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.35 }}
                  className="w-full flex flex-col gap-2"
                >
                  <Button fullWidth variant="secondary" onClick={handleRetry}>
                    Record another
                  </Button>
                </motion.div>
              </motion.div>
            )}

            {stage === 'error' && error && (
              <motion.div
                key="error"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
                className="text-center flex flex-col items-center gap-5"
              >
                <div className="w-20 h-20 rounded-full bg-danger/10 border-2 border-danger/20 flex items-center justify-center">
                  <AlertCircle size={36} className="text-danger" />
                </div>

                <div>
                  <p className="text-lg font-bold text-danger">{ERROR_MESSAGES[error.code].title}</p>
                  <p className="text-sm text-ink-secondary mt-2 leading-relaxed">
                    {ERROR_MESSAGES[error.code].body}
                  </p>
                </div>

                <Button fullWidth variant="secondary" onClick={handleRetry}>
                  Try again
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
