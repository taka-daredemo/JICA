import * as React from 'react'
import { cn } from '@/lib/utils/cn'

export interface ModalProps extends React.HTMLAttributes<HTMLDivElement> {
  open: boolean
  onClose: () => void
  closeOnEsc?: boolean
  closeOnOverlay?: boolean
}

export function Modal({
  open,
  onClose,
  closeOnEsc = true,
  closeOnOverlay = true,
  className,
  children,
  ...props
}: ModalProps) {
  React.useEffect(() => {
    if (!open || !closeOnEsc) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, closeOnEsc, onClose])

  if (!open) return null

  return (
    <div
      className={cn('fixed inset-0 z-50 flex items-center justify-center')}
      aria-modal="true"
      role="dialog"
      {...props}
    >
      <div
        className="absolute inset-0 bg-black/50"
        onClick={closeOnOverlay ? onClose : undefined}
      />
      <div
        className={cn(
          'relative z-10 w-full max-w-lg rounded-lg border border-slate-200 bg-white p-6 shadow-lg',
          className,
        )}
      >
        {children}
      </div>
    </div>
  )
}

export function ModalHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mb-4', className)} {...props} />
}

export function ModalTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn('text-lg font-semibold', className)} {...props} />
}

export function ModalDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('text-sm text-slate-600', className)} {...props} />
}

export function ModalFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mt-6 flex justify-end gap-2', className)} {...props} />
}

export default Modal


