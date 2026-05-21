import { cn } from '../../lib/utils'

interface CardProps {
  children: React.ReactNode
  className?: string
  glass?: boolean
  onClick?: () => void
  hover?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

export function Card({ children, className, glass, onClick, hover, padding = 'md' }: CardProps) {
  const pads = {
    none: '',
    sm: 'p-4',
    md: 'p-5',
    lg: 'p-6',
  }

  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-2xl border',
        glass
          ? 'glass'
          : 'bg-bg-card border-bg-border shadow-sm',
        hover && 'cursor-pointer transition-all duration-200 hover:border-accent/30 hover:bg-bg-elevated hover:shadow-md',
        pads[padding],
        className
      )}
    >
      {children}
    </div>
  )
}

interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  icon?: React.ReactNode
  trend?: 'up' | 'down' | 'neutral'
  accent?: boolean
}

export function StatCard({ label, value, sub, icon, accent }: StatCardProps) {
  return (
    <div className={cn(
      'rounded-2xl border p-5 flex flex-col gap-3',
      accent ? 'bg-accent/10 border-accent/20' : 'bg-bg-card border-bg-border shadow-sm'
    )}>
      {icon && (
        <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center',
          accent ? 'bg-accent/20 text-accent' : 'bg-bg-elevated text-ink-secondary'
        )}>
          {icon}
        </div>
      )}
      <div>
        <p className="text-2xl font-bold text-ink-primary">{value}</p>
        <p className="text-sm text-ink-secondary mt-0.5">{label}</p>
        {sub && <p className="text-xs text-ink-muted mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

interface DividerProps {
  className?: string
}

export function Divider({ className }: DividerProps) {
  return <hr className={cn('border-t border-bg-border', className)} />
}
