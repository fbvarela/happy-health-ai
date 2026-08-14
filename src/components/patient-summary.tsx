import { ChevronRight } from 'lucide-react'

export function PatientSummary({
  name,
  room,
  initial,
}: {
  name: string
  room: string
  initial: string
}) {
  return (
    <button
      type="button"
      className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-3 text-left shadow-sm transition-colors active:bg-accent/40"
    >
      <span
        className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-semibold text-primary-foreground"
        aria-hidden="true"
      >
        {initial}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-lg font-semibold leading-tight text-foreground">
          {name}
        </p>
        <p className="truncate text-sm text-muted-foreground">{room}</p>
      </div>
      <span className="flex items-center gap-0.5 text-sm font-medium text-primary">
        Ficha
        <ChevronRight className="size-4" />
      </span>
    </button>
  )
}
