import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  icon?: React.ReactNode
  suffix?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, icon, suffix, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-ink-secondary">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {icon && (
            <div className="absolute left-3 text-ink-muted pointer-events-none">{icon}</div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full rounded-xl bg-bg-surface border text-ink-primary placeholder:text-ink-muted',
              'px-4 py-2.5 text-sm h-11',
              'transition-colors duration-200',
              'focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/50',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              error ? 'border-danger/50 focus:ring-danger/30' : 'border-bg-border',
              icon && 'pl-10',
              suffix && 'pr-12',
              className
            )}
            {...props}
          />
          {suffix && (
            <div className="absolute right-3 text-ink-muted">{suffix}</div>
          )}
        </div>
        {(error || hint) && (
          <p className={cn('text-xs', error ? 'text-danger' : 'text-ink-muted')}>{error || hint}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-ink-secondary">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={inputId}
          className={cn(
            'w-full rounded-xl bg-bg-surface border text-ink-primary',
            'px-4 py-2.5 text-sm h-11 appearance-none',
            'transition-colors duration-200',
            'focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/50',
            error ? 'border-danger/50' : 'border-bg-border',
            className
          )}
          {...props}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value} className="bg-bg-surface">
              {o.label}
            </option>
          ))}
        </select>
        {error && <p className="text-xs text-danger">{error}</p>}
      </div>
    )
  }
)

Select.displayName = 'Select'
