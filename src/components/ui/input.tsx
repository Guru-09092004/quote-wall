import * as React from 'react'
import { cn } from '@/lib/utils'

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
  ({ className, type, ...props }, ref) => (
    <input
      className={cn(
        'flex h-11 w-full rounded-sm border border-input bg-transparent px-3 py-2 text-base text-foreground shadow-none outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-foreground focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      ref={ref}
      type={type}
      {...props}
    />
  ),
)
Input.displayName = 'Input'

export { Input }
