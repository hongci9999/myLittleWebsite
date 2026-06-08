import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CompositionEvent,
  type ChangeEvent,
} from 'react'
import { useSearchParams } from 'react-router-dom'
import { patchSearchParams } from '@/shared/lib/list-page-url'

const DEFAULT_DEBOUNCE_MS = 300

export type ListPageSearchInputProps = {
  value: string
  onChange: (e: ChangeEvent<HTMLInputElement>) => void
  onCompositionStart: () => void
  onCompositionEnd: (e: CompositionEvent<HTMLInputElement>) => void
}

/**
 * 목록 페이지 검색창: 로컬 state로 IME 조합을 보호하고, 디바운스 후 URL `q`에 반영.
 * 뒤로가기·URL 복원 시 committedValue(=URL)와 입력창을 동기화한다.
 */
export function useListPageSearchInput(
  paramKey = 'q',
  options?: { debounceMs?: number }
): {
  committedValue: string
  inputProps: ListPageSearchInputProps
} {
  const debounceMs = options?.debounceMs ?? DEFAULT_DEBOUNCE_MS
  const [searchParams, setSearchParams] = useSearchParams()
  const committedValue = searchParams.get(paramKey) ?? ''
  const [localValue, setLocalValue] = useState(committedValue)
  const isComposingRef = useRef(false)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  )

  useEffect(() => {
    if (!isComposingRef.current) {
      setLocalValue(committedValue)
    }
  }, [committedValue])

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current !== undefined) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [])

  const writeToUrl = useCallback(
    (value: string) => {
      const trimmed = value.trim()
      setSearchParams(
        (prev) => {
          const current = (prev.get(paramKey) ?? '').trim()
          if (trimmed === current) return prev
          return patchSearchParams(prev, { [paramKey]: trimmed || null })
        },
        { replace: true }
      )
    },
    [paramKey, setSearchParams]
  )

  const scheduleWrite = useCallback(
    (value: string) => {
      if (debounceTimerRef.current !== undefined) {
        clearTimeout(debounceTimerRef.current)
      }
      debounceTimerRef.current = setTimeout(() => {
        writeToUrl(value)
      }, debounceMs)
    },
    [debounceMs, writeToUrl]
  )

  const onChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const next = e.target.value
      setLocalValue(next)
      if (!isComposingRef.current) {
        scheduleWrite(next)
      }
    },
    [scheduleWrite]
  )

  const onCompositionStart = useCallback(() => {
    isComposingRef.current = true
    if (debounceTimerRef.current !== undefined) {
      clearTimeout(debounceTimerRef.current)
    }
  }, [])

  const onCompositionEnd = useCallback(
    (e: CompositionEvent<HTMLInputElement>) => {
      isComposingRef.current = false
      const next = e.currentTarget.value
      setLocalValue(next)
      if (debounceTimerRef.current !== undefined) {
        clearTimeout(debounceTimerRef.current)
      }
      scheduleWrite(next)
    },
    [scheduleWrite]
  )

  return {
    committedValue,
    inputProps: {
      value: localValue,
      onChange,
      onCompositionStart,
      onCompositionEnd,
    },
  }
}
