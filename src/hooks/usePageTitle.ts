import { useEffect } from 'react'

export function usePageTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} · Ashesi Attendance` : 'Ashesi Attendance'
    return () => { document.title = 'Ashesi Attendance' }
  }, [title])
}
