import * as React from 'react'
import { cn } from '@/lib/utils/cn'

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive'
type Size = 'sm' | 'md' | 'lg'

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  isLoading?: boolean
}

const baseStyles =
  'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-blue-600 text-white hover:bg-blue-600/90 focus-visible:ring-blue-600',
  secondary:
    'bg-slate-800 text-white hover:bg-slate-800/90 focus-visible:ring-slate-800',
  outline:
    'border border-slate-300 bg-white text-slate-900 hover:bg-slate-50 focus-visible:ring-slate-300',
  ghost:
    'bg-transparent text-slate-900 hover:bg-slate-100 focus-visible:ring-slate-300',
  destructive:
    'bg-red-600 text-white hover:bg-red-600/90 focus-visible:ring-red-600',
}

const sizeClasses: Record<Size, string> = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-11 px-6 text-base',
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, disabled, children, ...props }, ref) => {
    const isDisabled = disabled || isLoading
    return (
      <button
        ref={ref}
        className={cn(baseStyles, variantClasses[variant], sizeClasses[size], className)}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        aria-busy={isLoading || undefined}
        {...props}
      >
        {isLoading ? (
          <span className="inline-flex items-center gap-2">
            <svg
              className="h-4 w-4 animate-spin text-current"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              />
            </svg>
            <span className="sr-only">Loading</span>
            {children}
          </span>
        ) : (
          children
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'

export const buttonVariants = {
  base: baseStyles,
  variant: variantClasses,
  size: sizeClasses,
}

export default Button


