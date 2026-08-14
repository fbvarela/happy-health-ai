import { Bell, Menu } from 'lucide-react'

export function DashboardHeader({
  notifications = 2,
  onMenu,
}: {
  notifications?: number
  onMenu?: () => void
}) {
  return (
    <header className="sticky top-0 z-20 bg-primary text-primary-foreground">
      <div className="mx-auto flex h-14 max-w-md items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <span
            className="flex size-7 items-center justify-center rounded-md bg-primary-foreground/15"
            aria-hidden="true"
          >
            <span className="size-3 rounded-sm bg-primary-foreground" />
          </span>
          <h1 className="text-base font-semibold tracking-tight">
            Happy Health
          </h1>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            className="relative flex size-11 items-center justify-center rounded-full transition-colors active:bg-primary-foreground/15"
            aria-label={`Notificaciones${notifications ? `, ${notifications} sin leer` : ''}`}
          >
            <Bell className="size-5" />
            {notifications > 0 ? (
              <span className="absolute right-1.5 top-1.5 flex min-w-4 items-center justify-center rounded-full bg-warning px-1 text-[10px] font-bold leading-4 text-warning-foreground">
                {notifications}
              </span>
            ) : null}
          </button>
          <button
            type="button"
            className="flex size-11 items-center justify-center rounded-full transition-colors active:bg-primary-foreground/15"
            aria-label="Abrir menú"
            onClick={onMenu}
          >
            <Menu className="size-5" />
          </button>
        </div>
      </div>
    </header>
  )
}
