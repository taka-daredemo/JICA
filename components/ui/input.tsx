import * as React from 'react'
import { cn } from '@/lib/utils/cn'

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', error, disabled, ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        disabled={disabled}
        className={cn(
          'flex h-10 w-full rounded-md border bg-white px-3 py-2 text-sm outline-none transition-colors',
          'placeholder:text-slate-400',
          'focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          error ? 'border-red-500 focus-visible:ring-red-600' : 'border-slate-300 hover:border-slate-400',
          className,
        )}
        aria-invalid={error || undefined}
        {...props}
      />
    )
  }
)

Input.displayName = 'Input'

export default Input


