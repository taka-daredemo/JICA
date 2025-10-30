import * as React from 'react'
import { cn } from '@/lib/utils/cn'

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, disabled, children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        disabled={disabled}
        className={cn(
          'h-10 w-full rounded-md border bg-white px-3 text-sm outline-none transition-colors',
          'focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          error ? 'border-red-500 focus-visible:ring-red-600' : 'border-slate-300 hover:border-slate-400',
          className,
        )}
        aria-invalid={error || undefined}
        {...props}
      >
        {children}
      </select>
    )
  }
)

Select.displayName = 'Select'

export default Select


