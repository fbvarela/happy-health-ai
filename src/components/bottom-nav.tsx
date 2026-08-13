'use client'

import {
  Calendar,
  Home,
  MoreHorizontal,
  ShieldAlert,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const items: { key: string; label: string; icon: LucideIcon }[] = [
  { key: 'inicio', label: 'Inicio', icon: Home },
  { key: 'pacientes', label: 'Pacientes', icon: Users },
  { key: 'incidentes', label: 'Incidentes', icon: ShieldAlert },
  { key: 'citas', label: 'Citas', icon: Calendar },
  { key: 'mas', label: 'Más', icon: MoreHorizontal },
]

export function BottomNav({
  active = 'inicio',
  onChange,
}: {
  active?: string
  onChange?: (key: string) => void
}) {
  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-card/95 backdrop-blur"
    >
      <ul className="mx-auto flex max-w-md items-stretch justify-between px-2 pb-[env(safe-area-inset-bottom)]">
        {items.map(({ key, label, icon: Icon }) => {
          const isActive = key === active
          return (
            <li key={key} className="flex-1">
              <button
                type="button"
                onClick={() => onChange?.(key)}
                aria-current={isActive ? 'page' : undefined}
                className="flex min-h-16 w-full flex-col items-center justify-center gap-1 px-1 py-2"
              >
                <span
                  className={cn(
                    'flex h-8 w-14 items-center justify-center rounded-full transition-colors',
                    isActive
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground',
                  )}
                >
                  <Icon className="size-5" />
                </span>
                <span
                  className={cn(
                    'text-[11px] font-medium',
                    isActive ? 'text-foreground' : 'text-muted-foreground',
                  )}
                >
                  {label}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
