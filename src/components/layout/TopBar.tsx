import { Bell } from 'lucide-react'
import { useAppStore } from '../../store'

interface TopBarProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}

export function TopBar({ title, subtitle, actions }: TopBarProps) {
  const { userName } = useAppStore()

  return (
    <header className="h-16 flex items-center justify-between px-6 border-b border-bg-border flex-shrink-0 bg-bg-surface/50 backdrop-blur-sm sticky top-0 z-20">
      <div>
        <h1 className="text-base font-semibold text-ink-primary leading-tight">{title}</h1>
        {subtitle && <p className="text-xs text-ink-muted mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-2">
        {actions}
        <button className="relative p-2 rounded-xl text-ink-muted hover:text-ink-primary hover:bg-bg-elevated transition-colors">
          <Bell size={16} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-accent" />
        </button>
      </div>
    </header>
  )
}
