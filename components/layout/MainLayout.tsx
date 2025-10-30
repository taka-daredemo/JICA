import * as React from 'react'
import Header from './Header'
import Sidebar from './Sidebar'
import { cn } from '@/lib/utils/cn'

export function MainLayout({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <div className="mx-auto flex w-full max-w-7xl gap-6 px-4 py-6">
        <Sidebar />
        <main className={cn('w-full', className)}>{children}</main>
      </div>
    </div>
  )
}

export default MainLayout


