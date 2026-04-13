import { useEffect, useMemo, useRef, useState } from 'react'
import { fetchTarotReading, type TarotReadingResponse } from '@/shared/api/tarot'
import {
  createFreshTarotDailySnapshot,
  loadTarotDailySnapshot,
  saveTarotDailySnapshot,
} from './model/tarot-daily-persistence'
import type { TarotCardUiState, TarotDrawCard } from './model/types'
import { TarotSpread } from './ui/TarotSpread'

type TimeoutBucket = {
  spin?: number
  reveal?: number
}

const SPIN_MS = 850
const REVEAL_MS = 350

function spinTurnsWithStop(targetDeg: number): number {
  const turns = 2 + Math.floor(Math.random() * 2)
  return turns * 360 + targetDeg
}

export default function TarotDailyWidget() {
  const initial = useMemo(
    () => loadTarotDailySnapshot() ?? createFreshTarotDailySnapshot(),
    []
  )
  const [started, setStarted] = useState(initial.started)
  const [cards, setCards] = useState<TarotDrawCard[]>(initial.cards)
  const [rotations, setRotations] = useState<number[]>(initial.rotations)
  const [reading, setReading] = useState<TarotReadingResponse | null>(initial.reading)
  const [readingLoading, setReadingLoading] = useState(false)
  const [readingError, setReadingError] = useState<string | null>(null)
  const timersRef = useRef<Record<number, TimeoutBucket>>({})

  useEffect(() => {
    saveTarotDailySnapshot({ started, cards, rotations, reading })
  }, [started, cards, rotations, reading])

  const clearCardTimers = (index: number) => {
    const bucket = timersRef.current[index]
    if (!bucket) return
    if (bucket.spin) window.clearTimeout(bucket.spin)
    if (bucket.reveal) window.clearTimeout(bucket.reveal)
    delete timersRef.current[index]
  }

  useEffect(() => {
    const timerTable = timersRef.current
    return () => {
      Object.keys(timerTable).forEach((k) => clearCardTimers(Number(k)))
    }
  }, [])

  const startFortune = () => {
    if (started) return
    setStarted(true)
    setReading(null)
    setReadingError(null)
    setReadingLoading(false)
  }

  const patchCardState = (index: number, uiState: TarotCardUiState) => {
    setCards((prev) =>
      prev.map((card, i) => (i === index ? { ...card, uiState } : card))
    )
  }

  const instantlyReveal = (index: number) => {
    clearCardTimers(index)
    setRotations((prev) =>
      prev.map((deg, i) =>
        i === index ? (cards[index]?.orientation === 'reversed' ? 180 : 0) : deg
      )
    )
    patchCardState(index, 'revealed')
  }

  const onCardClick = (index: number) => {
    if (!started) return
    const current = cards[index]
    if (!current) return

    if (current.uiState === 'spinning' || current.uiState === 'revealing') {
      instantlyReveal(index)
      return
    }
    if (current.uiState === 'revealed') return

    const targetStopDeg = current.orientation === 'reversed' ? 180 : 0
    patchCardState(index, 'spinning')
    setRotations((prev) =>
      prev.map((n, i) => (i === index ? n + spinTurnsWithStop(targetStopDeg) : n))
    )

    timersRef.current[index] = {
      spin: window.setTimeout(() => {
        patchCardState(index, 'revealing')
        timersRef.current[index] = {
          ...timersRef.current[index],
          reveal: window.setTimeout(() => {
            patchCardState(index, 'revealed')
            clearCardTimers(index)
          }, REVEAL_MS),
        }
      }, SPIN_MS),
    }
  }

  const canRequestReading = started && cards.every((c) => c.uiState === 'revealed')

  const requestReading = () => {
    if (!canRequestReading || readingLoading) return
    setReadingLoading(true)
    setReadingError(null)

    fetchTarotReading(
      cards.map((c) => ({
        slot: c.slot,
        majorId: c.card.id,
        orientation: c.orientation,
      }))
    )
      .then((result) => setReading(result))
      .catch((err) => {
        const msg = err instanceof Error ? err.message : '타로 해석 요청 실패'
        setReadingError(msg)
      })
      .finally(() => setReadingLoading(false))
  }

  return (
    <TarotSpread
      cards={cards}
      started={started}
      rotations={rotations}
      reading={reading}
      readingLoading={readingLoading}
      readingError={readingError}
      canRequestReading={canRequestReading}
      onStart={startFortune}
      onCardClick={onCardClick}
      onRequestReading={requestReading}
    />
  )
}
