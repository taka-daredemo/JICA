import * as React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils/cn'

const items = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/tasks', label: 'Tasks' },
  { href: '/budget', label: 'Budget' },
  { href: '/team', label: 'Team' },
  { href: '/farmers', label: 'Farmers' },
  { href: '/training', label: 'Training' },
  { href: '/reports', label: 'Reports' },
]

export function Sidebar({ className }: { className?: string }) {
  return (
    <aside className={cn('hidden w-60 shrink-0 border-r bg-white md:block', className)}>
      <nav className="flex flex-col gap-1 p-3">
        {items.map((it) => (
          <Link
            key={it.href}
            href={it.href}
            className={cn(
              'rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-100',
            )}
          >
            {it.label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}

export default Sidebar


