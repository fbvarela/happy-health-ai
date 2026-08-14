import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

type VitalStatus = 'critical' | 'warning' | 'normal' | 'none'

interface VitalCardProps {
  icon: LucideIcon
  label: string
  value: string
  unit?: string
  footer: string
  status?: VitalStatus
}

const statusStyles: Record<
  VitalStatus,
  { value: string; iconWrap: string; dot: string; label: string }
> = {
  critical: {
    value: 'text-critical',
    iconWrap: 'bg-critical/10 text-critical',
    dot: 'bg-critical',
    label: 'Crítico',
  },
  warning: {
    value: 'text-foreground',
    iconWrap: 'bg-warning/15 text-warning',
    dot: 'bg-warning',
    label: 'Atención',
  },
  normal: {
    value: 'text-foreground',
    iconWrap: 'bg-success/10 text-success',
    dot: 'bg-success',
    label: 'Normal',
  },
  none: {
    value: 'text-muted-foreground',
    iconWrap: 'bg-muted text-muted-foreground',
    dot: 'bg-border',
    label: 'Sin datos',
  },
}

export function VitalCard({
  icon: Icon,
  label,
  value,
  unit,
  footer,
  status = 'none',
}: VitalCardProps) {
  const s = statusStyles[status]

  return (
    <button
      type="button"
      className="flex min-h-32 w-full flex-col justify-between rounded-2xl border border-border bg-card p-4 text-left shadow-sm transition-colors active:bg-accent/40"
    >
      <div className="flex items-center justify-between">
        <span
          className={cn(
            'flex size-9 items-center justify-center rounded-xl',
            s.iconWrap,
          )}
          aria-hidden="true"
        >
          <Icon className="size-5" />
        </span>
        <span className="flex items-center gap-1.5">
          <span className={cn('size-2 rounded-full', s.dot)} aria-hidden="true" />
          <span className="text-xs font-medium text-muted-foreground">
            {s.label}
          </span>
        </span>
      </div>

      <div className="mt-3">
        <p className="flex items-baseline gap-1">
          <span
            className={cn(
              'font-mono text-3xl font-semibold tabular-nums leading-none tracking-tight',
              s.value,
            )}
          >
            {value}
          </span>
          {unit ? (
            <span className="text-sm font-medium text-muted-foreground">
              {unit}
            </span>
          ) : null}
        </p>
        <div className="mt-1.5 flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">{label}</span>
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">{footer}</p>
      </div>
    </button>
  )
}
