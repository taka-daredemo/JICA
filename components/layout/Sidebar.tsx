'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname, useParams } from 'next/navigation'
import { cn } from '@/lib/utils/cn'
import {
  LayoutDashboard,
  CheckSquare,
  DollarSign,
  Users,
  UserCheck,
  GraduationCap,
  FileText,
} from 'lucide-react'

const items = [
  { href: '/dashboard', label: 'ダッシュボード', icon: LayoutDashboard },
  { href: '/tasks', label: 'タスク管理', icon: CheckSquare },
  { href: '/budget', label: '予算管理', icon: DollarSign },
  { href: '/team', label: 'チーム管理', icon: Users },
  { href: '/farmers', label: '農家管理', icon: UserCheck },
  { href: '/training', label: '研修管理', icon: GraduationCap },
  { href: '/reports', label: 'レポート', icon: FileText },
]

export function Sidebar({ className }: { className?: string }) {
  const pathname = usePathname()
  const params = useParams()
  const locale = (params?.locale as string) || 'ja'
  
  return (
    <aside className={cn('hidden w-60 shrink-0 border-r bg-white md:block', className)}>
      <nav className="flex flex-col gap-1 p-3">
        {items.map((it) => {
          const Icon = it.icon
          const href = `/${locale}${it.href}`
          const isActive = pathname?.includes(it.href)
          return (
            <Link
              key={it.href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                isActive
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-slate-700 hover:bg-slate-100'
              )}
            >
              <Icon className="h-4 w-4" />
              {it.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}

export default Sidebar


