import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface BentoCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  className?: string
}

const BentoCard = forwardRef<HTMLDivElement, BentoCardProps>(
  ({ children, className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'group flex flex-col rounded-2xl border border-border/60 bg-card p-6 shadow-sm transition-all hover:shadow-md',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
)

BentoCard.displayName = 'BentoCard'

export { BentoCard }
