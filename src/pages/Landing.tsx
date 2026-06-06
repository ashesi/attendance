import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MapPin, CheckCircle2, AlertCircle, GraduationCap,
  History, Settings, Clock, WifiOff,
} from 'lucide-react'
import { Button } from '../components/ui/Button'
import { LaptopScreenshotNotice, getStudentFirstName } from '../components/student/LaptopScreenshotNotice'
import { submitAttendance, ApiError, getApiErrorMessage } from '../lib/api'
import { usePageTitle } from '../hooks/usePageTitle'
import toast from 'react-hot-toast'

/**
 * Returns a stable device fingerprint (SHA-256 hex, truncated to 32 chars).
 *
 * Mixes a persistent random ID stored in localStorage (survives page reloads
 * but not incognito/cleared storage) with immutable browser properties
 * (screen size, language, timezone, hardware concurrency). Together these
 * make it meaningfully harder to submit on behalf of a classmate within the
 * same session without changing devices or browsers.
 */
async function getDeviceFingerprint(): Promise<string> {
  let persistentId = localStorage.getItem('attn_device_id')
  if (!persistentId) {
    persistentId = crypto.randomUUID()
    localStorage.setItem('attn_device_id', persistentId)
  }
  const components = [
    persistentId,
    navigator.userAgent,
    navigator.language,
    `${screen.width}x${screen.height}`,
    String(screen.colorDepth),
    String(new Date().getTimezoneOffset()),
    String(navigator.hardwareConcurrency ?? ''),
  ].join('||')
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(components))
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 32)
}

function getGreeting() {
  const h = new Date().getHours()
  if (h >= 5 && h < 12) return 'Good morning'
  if (h >= 12 && h < 17) return 'Good afternoon'
  if (h >= 17 && h < 21) return 'Good evening'
  return 'Hey there'
}

type Stage = 'form' | 'locating' | 'location_blocked' | 'success' | 'error'
type ErrorCode = 'window_closed' | 'window_not_open' | 'duplicate_device' | 'invalid_pin'

const ERROR_MESSAGES: Record<ErrorCode, { title: string; body: string; soft?: boolean }> = {
  invalid_pin: {
    title: "Code not recognised",
    body: "We couldn't find an open session with that course code. Double-check the code with your lecturer and try again.",
  },
  window_not_open: {
    title: "Too early!",
    body: "Your lecturer hasn't opened the attendance window yet. Hold tight — they'll let you know when to submit.",
  },
  window_closed: {
    title: "Window has closed",
    body: "Attendance for this session has already closed. If you were in class, speak to your lecturer.",
  },
  duplicate_device: {
    title: "Device already used",
    body: "Attendance has already been submitted from this device for this session. Each device can only be used once per session.",
  },
}

export default function Landing() {
  usePageTitle()
  const navigate = useNavigate()
  const [pin, setPin] = useState('')
  const [studentId, setStudentId] = useState('')
  const [stage, setStage] = useState<Stage>('form')
  const [locationBlockedReason, setLocationBlockedReason] = useState<'denied' | 'unavailable' | null>(null)
  const [error, setError] = useState<ErrorCode | null>(null)
  const [sessionInfo, setSessionInfo] = useState<{ courseName: string; courseCode: string } | null>(null)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [isLaptop, setIsLaptop] = useState(false)
  const [recordedAt, setRecordedAt] = useState<Date | null>(null)
  const studentIdRef = useRef<HTMLInputElement>(null)

  const normaliseCourseCode = (raw: string) => raw.toUpperCase().replace(/\s/g, '')
  const isReady = normaliseCourseCode(pin).length >= 4 && studentId.trim().length >= 3

  const fieldLabelClass = 'text-xs font-semibold text-ink-secondary uppercase tracking-wider'
  const fieldInputClass =
    'w-full h-11 px-4 bg-bg-surface border border-bg-border rounded-xl text-sm font-mono text-ink-primary uppercase tracking-wide placeholder:font-sans placeholder:normal-case placeholder:tracking-normal placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/50'

  // Online / offline detection
  useEffect(() => {
    const on = () => setIsOnline(true)
    const off = () => setIsOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])

  const handleRecord = async () => {
    if (!isOnline) {
      toast.error("You're offline — please check your connection and try again.")
      return
    }
    console.log('getting current position')
    setStage('locating')
    setIsLaptop(!/Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent))

    // GPS is required — attendance cannot be submitted without coordinates.
    // If the student denies permission or the device has no geolocation, show a
    // blocking screen with instructions and do not submit.
    console.log('navigator.geolocation', navigator.geolocation)
    if (!navigator.geolocation) {
      setLocationBlockedReason('unavailable')
      setStage('location_blocked')
      return
    }

    let lat: number
    let lng: number
    try {
      // enableHighAccuracy: false → uses WiFi/cell location, which responds in
      // < 2 s on iOS and Android (enableHighAccuracy forces the GPS radio which
      // can take 15–30 s to lock indoors, causing spurious TIMEOUT errors even
      // after the user has tapped "Allow").
      console.log('getting position')
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 15000,
          enableHighAccuracy: true,
        }),
      )
      lat = pos.coords.latitude
      lng = pos.coords.longitude
      console.log('position', lat, lng)
    } catch (geoErr) {
      const code = (geoErr as GeolocationPositionError).code
      if (code === 1 /* PERMISSION_DENIED */) {
        console.log('permission denied')
        // User explicitly blocked location — show instructions.
        setLocationBlockedReason('denied')
        setStage('location_blocked')
        return
      }
      // code 2 (POSITION_UNAVAILABLE) or code 3 (TIMEOUT) — device supports
      // location and permission was (likely) granted, but a fix couldn't be
      // obtained in time.  Show a different message so students know it's a
      // signal issue, not a settings issue.
      console.log('position unavailable')
      setLocationBlockedReason('unavailable')
      setStage('location_blocked')
      return
    }

    const deviceFingerprint = await getDeviceFingerprint().catch(() => undefined)

    try {
      const result = await submitAttendance({
        cohortCode: normaliseCourseCode(pin),
        studentId: studentId.trim().toUpperCase(),
        lat,
        lng,
        deviceFingerprint,
      })
      setSessionInfo({ courseName: result.courseName, courseCode: result.courseCode })
      setRecordedAt(new Date())
      setStage('success')
      toast.success('Attendance recorded')
    } catch (err) {
      if (err instanceof ApiError) {
        const errCode = (err.body?.error as string) ?? ''
        if (errCode === 'no_open_session') {
          setError('invalid_pin')
        } else if (errCode === 'window_not_open') {
          setError('window_not_open')
        } else if (errCode === 'window_closed') {
          setError('window_closed')
        } else if (errCode === 'duplicate_device') {
          setError('duplicate_device')
        } else if (errCode === 'duplicate_submission') {
          const body = err.body as { courseName?: string; courseCode?: string }
          setSessionInfo({
            courseName: body.courseName ?? '',
            courseCode: body.courseCode ?? '',
          })
          setError('duplicate_device')
        } else if (errCode === 'student_not_found') {
          toast.error('Student ID not found. Check your ID and try again.')
          setStage('form')
          return
        } else {
          toast.error(getApiErrorMessage(err))
          setStage('form')
          return
        }
      } else {
        toast.error('Something went wrong. Please try again.')
        setStage('form')
        return
      }
      setStage('error')
    }
  }

  const reset = () => {
    setPin('')
    setStudentId('')
    setStage('form')
    setLocationBlockedReason(null)
    setError(null)
    setSessionInfo(null)
    setRecordedAt(null)
  }

  const errorConfig = error ? ERROR_MESSAGES[error] : null

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-5 relative overflow-hidden dot-grid">
      {/* Ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-accent/[0.06] rounded-full blur-3xl pointer-events-none" />

      {/* Staff login — top right corner */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        onClick={() => navigate('/staff')}
        title="Staff login"
        className="absolute top-4 right-4 p-2 rounded-xl text-ink-faint hover:text-ink-muted hover:bg-bg-elevated transition-all"
      >
        <Settings size={17} />
      </motion.button>

      <div className="relative w-full max-w-sm flex flex-col gap-6">

        {/* Offline banner */}
        <AnimatePresence>
          {!isOnline && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-warning/10 border border-warning/30 text-warning text-xs font-medium"
            >
              <WifiOff size={13} className="flex-shrink-0" />
              You're offline — connect to submit attendance
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center flex-shrink-0">
            <GraduationCap size={20} className="text-white" />
          </div>
          <div>
            <p className="text-base font-bold text-ink-primary leading-none">Ashesi Attendance</p>
            <p className="text-xs text-ink-muted mt-0.5">{getGreeting()} · tap in below</p>
          </div>
        </motion.div>

        {/* Main card */}
        <AnimatePresence mode="wait">
          {stage === 'form' && (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.25 }}
              className="glass rounded-2xl p-5 flex flex-col gap-5"
            >
              <div className="flex flex-col gap-2">
                <label htmlFor="course-code" className={fieldLabelClass}>
                  Course code
                </label>
                <input
                  id="course-code"
                  type="text"
                  placeholder="e.g. CS222A"
                  maxLength={12}
                  value={pin}
                  onChange={e => setPin(e.target.value.toUpperCase().replace(/\s/g, ''))}
                  onKeyDown={e => e.key === 'Enter' && studentIdRef.current?.focus()}
                  autoFocus
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="characters"
                  spellCheck={false}
                  className={fieldInputClass}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="student-id" className={fieldLabelClass}>
                  Student ID
                </label>
                <input
                  id="student-id"
                  ref={studentIdRef}
                  type="text"
                  placeholder="e.g. XXXX2028"
                  maxLength={16}
                  value={studentId}
                  onChange={e => setStudentId(e.target.value.toUpperCase().replace(/\s/g, ''))}
                  onKeyDown={e => e.key === 'Enter' && isReady && handleRecord()}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="characters"
                  spellCheck={false}
                  className={fieldInputClass}
                />
              </div>

              {/* CTA */}
              <Button
                fullWidth
                size="lg"
                variant="success"
                disabled={!isReady}
                onClick={handleRecord}
                className="mt-1 font-semibold"
              >
                <MapPin size={16} />
                Record Attendance
              </Button>
            </motion.div>
          )}

          {stage === 'locating' && (
            <motion.div
              key="locating"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="glass rounded-2xl p-10 flex flex-col items-center gap-5"
            >
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-full border-2 border-accent/20 animate-ping" />
                <div className="absolute inset-2 rounded-full border border-accent/30 animate-ping [animation-delay:0.4s]" />
                <div className="w-16 h-16 rounded-full bg-accent/10 border border-accent/30 flex items-center justify-center">
                  <MapPin size={22} className="text-accent animate-pulse" />
                </div>
              </div>
              <div className="text-center">
                <p className="font-semibold text-ink-primary">Requesting location</p>
                <p className="text-sm text-ink-secondary mt-1">
                  Tap <strong>"Allow"</strong> when your browser asks for location access
                </p>
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
              <p className="text-xs text-ink-muted text-center max-w-[220px] leading-relaxed">
                Location is required to verify you're in the classroom.
              </p>
            </motion.div>
          )}

          {stage === 'location_blocked' && (
            <motion.div
              key="location_blocked"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
              className="glass rounded-2xl p-8 flex flex-col items-center gap-4 text-center"
            >
              <div className="w-14 h-14 rounded-full bg-warning/10 border-2 border-warning/20 flex items-center justify-center">
                <MapPin size={26} className="text-warning" />
              </div>
              <div>
                <p className="font-bold text-lg text-warning">Location required</p>
                <p className="text-sm text-ink-secondary mt-1.5 leading-relaxed">
                  {locationBlockedReason === 'denied'
                    ? "You denied location access. Attendance can't be submitted without it — location verifies you're in the classroom."
                    : "Couldn't get your location. This usually means weak GPS signal indoors."}
                </p>
              </div>
              {locationBlockedReason === 'denied' ? (
                <div className="w-full px-3 py-3 rounded-xl bg-bg-surface border border-bg-border text-left space-y-1.5">
                  <p className="text-xs font-semibold text-ink-secondary">How to enable location:</p>
                  <p className="text-xs text-ink-muted leading-relaxed">
                    <strong>Chrome / Android:</strong> tap the lock icon in the address bar → Site settings → Location → Allow
                  </p>
                  <p className="text-xs text-ink-muted leading-relaxed">
                    <strong>Safari / iPhone:</strong> tap the <em>AA</em> icon in the address bar → Website Settings → Location → Allow
                  </p>
                </div>
              ) : (
                <div className="w-full px-3 py-3 rounded-xl bg-bg-surface border border-bg-border text-left">
                  <p className="text-xs text-ink-muted leading-relaxed">
                    Try moving closer to a window or stepping outside briefly, then tap <strong>Try again</strong>. If the problem persists, speak to your lecturer.
                  </p>
                </div>
              )}
              <Button fullWidth variant="secondary" onClick={reset}>
                Try again
              </Button>
            </motion.div>
          )}

          {stage === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 280, damping: 22 }}
              className="glass rounded-2xl p-8 flex flex-col items-center gap-5 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 300, damping: 20 }}
                className="w-16 h-16 rounded-full bg-success/10 border-2 border-success/30 flex items-center justify-center"
              >
                <CheckCircle2 size={30} className="text-success" />
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
                <p className="text-3xl font-black text-success">Recorded</p>
                {sessionInfo && (
                  <div className="mt-3 px-4 py-2.5 rounded-xl bg-bg-surface border border-bg-border">
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
                transition={{ delay: 0.3 }}
                className="flex flex-col gap-2 w-full"
              >
                <Button
                  fullWidth
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate(`/history?id=${studentId}`)}
                >
                  <History size={14} />
                  View my absence history
                </Button>
              </motion.div>
            </motion.div>
          )}

          {stage === 'error' && errorConfig && (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
              className="glass rounded-2xl p-8 flex flex-col items-center gap-4 text-center"
            >
              <div className={`w-14 h-14 rounded-full flex items-center justify-center ${
                errorConfig.soft
                  ? 'bg-success/10 border-2 border-success/20'
                  : 'bg-danger/10 border-2 border-danger/20'
              }`}>
                {errorConfig.soft
                  ? <CheckCircle2 size={26} className="text-success" />
                  : error === 'window_not_open'
                    ? <Clock size={26} className="text-warning" />
                    : <AlertCircle size={26} className="text-danger" />
                }
              </div>
              <div>
                <p className={`font-bold text-lg ${
                  errorConfig.soft ? 'text-success' : error === 'window_not_open' ? 'text-warning' : 'text-danger'
                }`}>
                  {errorConfig.title}
                </p>
                <p className="text-sm text-ink-secondary mt-1.5 leading-relaxed">{errorConfig.body}</p>
              </div>
              {!errorConfig.soft && (
                <Button fullWidth variant="secondary" onClick={reset}>
                  Try again
                </Button>
              )}
              {errorConfig.soft && (
                <Button fullWidth variant="ghost" size="sm" onClick={() => navigate(`/history?id=${studentId}`)}>
                  <History size={14} />
                  View my absence history
                </Button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* History shortcut */}
        {stage === 'form' && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            onClick={() => navigate('/history')}
            className="flex items-center justify-center gap-2 text-xs text-ink-muted hover:text-ink-secondary transition-colors py-1"
          >
            <History size={13} />
            View my absence history
          </motion.button>
        )}

      </div>
    </div>
  )
}
