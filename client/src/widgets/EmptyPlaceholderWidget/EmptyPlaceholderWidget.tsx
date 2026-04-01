import { BentoCard } from '@/shared/ui/BentoCard'

export default function EmptyPlaceholderWidget() {
  return (
    <BentoCard className="h-full p-4 sm:p-5">
      <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/20">
        <p className="text-sm text-muted-foreground">준비중</p>
      </div>
    </BentoCard>
  )
}
