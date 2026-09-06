import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils/cn'

const alertVariants = cva(
  'relative w-full rounded-lg border p-3 text-sm sm:p-4 [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:absolute [&>svg]:left-3 [&>svg]:top-3.5 sm:[&>svg]:left-4 sm:[&>svg]:top-4 [&>svg~*]:pl-6',
  {
    variants: {
      variant: {
        default: 'border-border bg-card text-card-foreground',
        destructive:
          'border-destructive/40 bg-destructive/10 text-destructive dark:text-rose-300 [&>svg]:text-destructive dark:[&>svg]:text-rose-300',
        warning:
          'border-amber-400/40 bg-amber-50 text-amber-900 dark:bg-amber-500/10 dark:text-amber-200 [&>svg]:text-amber-600 dark:[&>svg]:text-amber-300',
        success:
          'border-emerald-400/40 bg-emerald-50 text-emerald-900 dark:bg-emerald-500/10 dark:text-emerald-200 [&>svg]:text-emerald-600 dark:[&>svg]:text-emerald-300',
        info: 'border-sky-400/40 bg-sky-50 text-sky-900 dark:bg-sky-500/10 dark:text-sky-200 [&>svg]:text-sky-600 dark:[&>svg]:text-sky-300',
      },
    },
    defaultVariants: { variant: 'default' },
  }
)

export interface AlertProps
  extends React.ComponentPropsWithoutRef<'div'>, VariantProps<typeof alertVariants> {}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant, ...props }, ref) => (
    <div ref={ref} role="alert" className={cn(alertVariants({ variant }), className)} {...props} />
  )
)
Alert.displayName = 'Alert'

const AlertTitle = React.forwardRef<HTMLHeadingElement, React.ComponentPropsWithoutRef<'h5'>>(
  ({ className, ...props }, ref) => (
    <h5 ref={ref} className={cn('mb-1 font-semibold leading-tight', className)} {...props} />
  )
)
AlertTitle.displayName = 'AlertTitle'

const AlertDescription = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<'div'>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('text-sm opacity-90 [&_p]:leading-relaxed', className)}
      {...props}
    />
  )
)
AlertDescription.displayName = 'AlertDescription'

export { Alert, AlertTitle, AlertDescription, alertVariants }
