import { cn } from '../../lib/utils'

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div className={cn('animate-pulse rounded-xl bg-bg-elevated', className)} />
  )
}

export function CourseCardSkeleton() {
  return (
    <div className="flex items-center gap-3 p-4 rounded-2xl bg-bg-card border border-bg-border shadow-sm">
      <div className="w-1 self-stretch rounded-full bg-bg-elevated flex-shrink-0" />
      <div className="w-9 h-9 rounded-xl bg-bg-elevated flex-shrink-0 animate-pulse" />
      <div className="flex-1 min-w-0 flex flex-col gap-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-4 w-48" />
        <div className="flex items-center gap-3">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <Skeleton className="h-4 w-8 flex-shrink-0" />
    </div>
  )
}

export function SessionRowSkeleton() {
  return (
    <div className="flex items-center gap-3 p-4 rounded-2xl bg-bg-card border border-bg-border shadow-sm">
      <div className="flex-1 min-w-0 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-16 rounded-full" />
        </div>
        <Skeleton className="h-3 w-48" />
      </div>
      <Skeleton className="h-6 w-10 flex-shrink-0" />
    </div>
  )
}
