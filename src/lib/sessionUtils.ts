import type { Session } from '../types'

export function sessionStartMs(session: Pick<Session, 'date' | 'startTime'>): number {
  return new Date(`${session.date}T${session.startTime}:00`).getTime()
}

/** Soonest session first (nearest in the future / most recent past at top of each group). */
export function sortSessionsNearestFirst(sessions: Session[]): Session[] {
  return [...sessions].sort((a, b) => sessionStartMs(a) - sessionStartMs(b))
}

/** Most recent past session first. */
export function sortSessionsMostRecentFirst(sessions: Session[]): Session[] {
  return [...sessions].sort((a, b) => sessionStartMs(b) - sessionStartMs(a))
}

export function groupSessionsByStatus(sessions: Session[]) {
  return {
    open: sortSessionsNearestFirst(sessions.filter((s) => s.status === 'open')),
    upcoming: sortSessionsNearestFirst(sessions.filter((s) => s.status === 'upcoming')),
    closed: sortSessionsMostRecentFirst(sessions.filter((s) => s.status === 'closed')),
  }
}
