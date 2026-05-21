import { Camera, Clock, Info } from 'lucide-react'
import { mockStudents } from '../../data/mock'

export function getStudentFirstName(studentId: string): string {
  const student = mockStudents.find(
    s => s.id.toUpperCase() === studentId.trim().toUpperCase(),
  )
  return student?.name.split(' ')[0] ?? studentId.trim()
}

function formatRecordedAt(date: Date) {
  return date.toLocaleString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

interface LaptopScreenshotNoticeProps {
  studentFirstName: string
  recordedAt: Date
}

export function LaptopScreenshotNotice({ studentFirstName, recordedAt }: LaptopScreenshotNoticeProps) {
  return (
    <div className="mt-3 flex items-start gap-2.5 px-3.5 py-3 rounded-xl bg-accent/5 border border-accent/20 text-left">
      <Info size={13} className="text-accent flex-shrink-0 mt-0.5" />
      <div className="flex flex-col gap-2 text-xs text-ink-secondary leading-relaxed">
        <p>
          <span className="font-semibold text-ink-primary">{studentFirstName}</span>, you're on a
          laptop — location accuracy may be limited. Please take a screenshot of this screen now and
          keep it to show your FI if you're marked absent.
        </p>
        <p className="flex items-center gap-1.5 text-ink-primary font-medium">
          <Clock size={12} className="text-accent flex-shrink-0" />
          Confirmation received at {formatRecordedAt(recordedAt)}
        </p>
        <p className="flex items-center gap-1.5 text-ink-muted">
          <Camera size={12} className="flex-shrink-0" />
          Screenshot this page before you close it.
        </p>
      </div>
    </div>
  )
}
