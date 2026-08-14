'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Calendar,
  Home,
  MoreHorizontal,
  ShieldAlert,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const items: { key: string; href: string; label: string; icon: LucideIcon }[] = [
  { key: 'inicio', href: '/', label: 'Inicio', icon: Home },
  { key: 'pacientes', href: '/pacientes', label: 'Pacientes', icon: Users },
  { key: 'incidentes', href: '/incidentes', label: 'Incidentes', icon: ShieldAlert },
  { key: 'citas', href: '/citas', label: 'Citas', icon: Calendar },
  { key: 'mas', href: '/mas', label: 'Más', icon: MoreHorizontal },
]

export function BottomNav({ active }: { active?: string }) {
  const pathname = usePathname()
  const activeKey = active ?? (pathname === '/' ? 'inicio' : pathname.split('/')[1])

  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-card/95 backdrop-blur"
    >
      <ul className="mx-auto flex max-w-md items-stretch justify-between px-2 pb-[env(safe-area-inset-bottom)]">
        {items.map(({ key, href, label, icon: Icon }) => {
          const isActive = key === activeKey
          return (
            <li key={key} className="flex-1">
              <Link
                href={href}
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
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
