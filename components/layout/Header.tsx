import * as React from 'react'
import { Button } from '@/components/ui/button'

export function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <span className="text-base font-semibold">JICA Project</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm">EN</Button>
          <Button variant="ghost" size="sm">JP</Button>
        </div>
      </div>
    </header>
  )
}

export default Header


