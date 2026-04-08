import { useState } from 'react'
import type { TarotDrawCard } from '../model/types'

type TarotCardProps = {
  drawCard: TarotDrawCard
  started: boolean
  rotationDeg: number
  onClick: () => void
}

const BACK_IMAGE_PATH = '/src/widgets/TarotDailyWidget/assets/cards/back.png'

const SLOT_LABEL: Record<TarotDrawCard['slot'], string> = {
  past: '과거',
  present: '현재',
  advice: '조언',
}

export function TarotCard({ drawCard, started, rotationDeg, onClick }: TarotCardProps) {
  const isRevealed = drawCard.uiState === 'revealed' || drawCard.uiState === 'revealing'
  const isSpinning = drawCard.uiState === 'spinning'
  const showBlur = !started
  const nameplateText = isRevealed ? drawCard.card.labelKo : '선택 대기'
  const [backAspectRatio, setBackAspectRatio] = useState<number | null>(null)
  const [frontAspectRatio, setFrontAspectRatio] = useState<number | null>(null)

  const syncAspectRatio = (
    img: HTMLImageElement,
    target: 'back' | 'front'
  ) => {
    if (!img.naturalWidth || !img.naturalHeight) return
    const ratio = img.naturalWidth / img.naturalHeight
    if (target === 'back') setBackAspectRatio(ratio)
    else setFrontAspectRatio(ratio)
  }

  const slotAspectRatio =
    (isRevealed ? frontAspectRatio : backAspectRatio) ??
    backAspectRatio ??
    frontAspectRatio ??
    2 / 3

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!started}
      className="group w-full text-left disabled:cursor-not-allowed"
      aria-label={`${SLOT_LABEL[drawCard.slot]} 카드 선택`}
    >
      <div className="tarot-card-meta">
        <div className="tarot-slot-fixed-chip">{SLOT_LABEL[drawCard.slot]}</div>
        <div className={`tarot-card-shell ${showBlur ? 'tarot-card-blur' : ''}`}>
          <div
            className="tarot-card-rotor"
            style={{
              transform: `rotate(${rotationDeg}deg)`,
              aspectRatio: String(slotAspectRatio),
            }}
          >
            <div className={`tarot-card-flip ${isRevealed ? 'is-revealed' : ''}`}>
              <div
                className={`tarot-face tarot-face-back ${isSpinning ? 'is-spinning' : ''}`}
              >
                <img
                  src={BACK_IMAGE_PATH}
                  alt="타로 카드 뒷면"
                  className="tarot-back-image"
                  onLoad={(e) => syncAspectRatio(e.currentTarget, 'back')}
                  loading="lazy"
                />
              </div>
              <div className="tarot-face tarot-face-front">
                <img
                  src={drawCard.card.imagePath}
                  alt={drawCard.card.labelKo}
                  className="tarot-front-image"
                  onLoad={(e) => syncAspectRatio(e.currentTarget, 'front')}
                  loading="lazy"
                />
              </div>
            </div>
          </div>
          <div className="tarot-card-nameplate">{nameplateText}</div>
        </div>
      </div>
    </button>
  )
}
