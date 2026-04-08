import { BentoCard } from '@/shared/ui/BentoCard'
import type { TarotReadingResponse } from '@/shared/api/tarot'
import type { TarotDrawCard } from '../model/types'
import { TarotCard } from './TarotCard'
import './tarot.css'

type TarotSpreadProps = {
  cards: TarotDrawCard[]
  started: boolean
  rotations: number[]
  reading: TarotReadingResponse | null
  readingLoading: boolean
  readingError: string | null
  canRequestReading: boolean
  onStart: () => void
  onCardClick: (index: number) => void
  onRequestReading: () => void
}

export function TarotSpread({
  cards,
  started,
  rotations,
  reading,
  readingLoading,
  readingError,
  canRequestReading,
  onStart,
  onCardClick,
  onRequestReading,
}: TarotSpreadProps) {
  return (
    <BentoCard className="h-full p-4 sm:p-5">
      <div>
        <h2 className="text-sm font-medium tracking-tight text-muted-foreground">
          오늘의 타로 운세
        </h2>
      </div>

      <div className="relative mt-3">
        {!started && (
          <div className="tarot-overlay">
            <button
              type="button"
              onClick={onStart}
              className="tarot-start-button"
            >
              ✦ 운세보기 ✦
            </button>
          </div>
        )}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {cards.map((card, index) => (
            <TarotCard
              key={card.slot}
              drawCard={card}
              started={started}
              rotationDeg={rotations[index]}
              onClick={() => onCardClick(index)}
            />
          ))}
        </div>
      </div>

      <div className="mt-4 h-52 overflow-y-auto rounded-md border border-border/60 p-3">
        {readingLoading && (
          <p className="text-xs text-muted-foreground">카드를 해석하고 있습니다...</p>
        )}
        {readingError && <p className="text-xs text-red-500">{readingError}</p>}

        {reading ? (
          <>
            <h3 className="text-xs font-semibold tracking-tight">오늘의 해석</h3>
            <div className="mt-2 space-y-1.5">
              {reading.cards.map((card) => (
                <p
                  key={`${card.slot}-${card.majorId}`}
                  className="text-[11px] leading-relaxed text-muted-foreground"
                >
                  <span className="font-semibold text-foreground">
                    {card.slot === 'past' ? '과거' : card.slot === 'present' ? '현재' : '조언'} ·{' '}
                    {card.name}
                  </span>{' '}
                  {card.interpretation}
                </p>
              ))}
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
              {reading.overall.summary}
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
              {reading.overall.actionTip}
            </p>
          </>
        ) : (
          !readingLoading &&
          !readingError && (
            <div className="flex h-full items-center justify-center">
              <button
                type="button"
                onClick={onRequestReading}
                disabled={!canRequestReading}
                className="tarot-start-button disabled:cursor-not-allowed disabled:opacity-60"
              >
                ✦ 해석 보기 ✦
              </button>
            </div>
          )
        )}
      </div>
    </BentoCard>
  )
}
