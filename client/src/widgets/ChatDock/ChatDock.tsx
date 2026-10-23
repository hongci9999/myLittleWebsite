import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { ChevronDown, ChevronUp, RotateCcw, Send } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/shared/context/AuthContext'
import { sendChat, type ChatMessage } from '@/shared/api/chat'
import { MarkdownWithMath } from '@/shared/ui/MarkdownWithMath'

/** 화면 중앙 하단 대화창 — 답변이 오면 입력창 위로 대화 패널이 펼쳐진다. 기록은 메모리에만 */
export default function ChatDock() {
  const { token } = useAuth()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(true)
  const endRef = useRef<HTMLDivElement>(null)

  const expanded = open && (messages.length > 0 || error !== null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' })
  }, [messages, pending, expanded])

  async function submit(e?: FormEvent) {
    e?.preventDefault()
    const text = input.trim()
    if (!text || pending) return
    const next: ChatMessage[] = [...messages, { role: 'user', text }]
    setMessages(next)
    setInput('')
    setError(null)
    setOpen(true)
    setPending(true)
    try {
      const answer = await sendChat(next, token)
      setMessages([...next, { role: 'model', text: answer }])
    } catch (err) {
      // 실패한 질문은 대화에서 빼고 입력창에 되돌린다
      setMessages(messages)
      setInput(text)
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setPending(false)
    }
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      void submit()
    }
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center px-4 pb-4 lg:right-40">
      <div className="pointer-events-auto w-full max-w-2xl overflow-hidden rounded-2xl border border-border/60 bg-background/95 shadow-lg backdrop-blur-sm">
        <div
          className={cn(
            'grid transition-[grid-template-rows] duration-300 ease-out',
            expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
          )}
        >
          {/* overflow-hidden: 0fr일 때 헤더가 칸 밖으로 넘쳐 입력창과 겹치지 않게 */}
          <div className="min-h-0 overflow-hidden">
            <div className="flex items-center justify-end gap-1 border-b border-border/60 px-3 py-1.5">
              <button
                type="button"
                onClick={() => {
                  setMessages([])
                  setError(null)
                }}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <RotateCcw className="size-3.5" /> 새 대화
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="대화 접기"
                className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <ChevronDown className="size-4" />
              </button>
            </div>
            <div className="max-h-[60vh] space-y-3 overflow-y-auto px-4 py-3 text-sm">
              {messages.map((m, i) =>
                m.role === 'user' ? (
                  <p key={i} className="ml-auto w-fit max-w-[85%] whitespace-pre-wrap rounded-xl bg-primary/10 px-3 py-2">
                    {m.text}
                  </p>
                ) : (
                  <MarkdownWithMath
                    key={i}
                    className="prose prose-sm prose-neutral max-w-[95%] rounded-xl bg-muted/60 px-4 py-3 dark:prose-invert prose-a:text-primary prose-p:my-1.5 prose-ul:my-1.5 prose-li:my-0.5 prose-headings:mt-3 prose-headings:mb-1.5"
                  >
                    {m.text}
                  </MarkdownWithMath>
                )
              )}
              {pending && (
                <div role="status" aria-label="답변 찾는 중" className="flex w-fit items-center gap-1 rounded-xl bg-muted/60 px-4 py-3">
                  {[0, 150, 300].map((d) => (
                    <span
                      key={d}
                      className="size-1.5 animate-bounce rounded-full bg-muted-foreground motion-reduce:animate-none"
                      style={{ animationDelay: `${d}ms` }}
                    />
                  ))}
                </div>
              )}
              {error && <p className="text-destructive">{error}</p>}
              <div ref={endRef} />
            </div>
          </div>
        </div>

        <form onSubmit={submit} className="flex items-end gap-2 p-2">
          {!open && messages.length > 0 && (
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="대화 펼치기"
              className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <ChevronUp className="size-4" />
            </button>
          )}
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            rows={1}
            placeholder="사이트 자료에 대해 물어보세요"
            className="max-h-32 min-h-9 flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none placeholder:text-muted-foreground [field-sizing:content]"
          />
          <button
            type="submit"
            disabled={pending || !input.trim()}
            aria-label="보내기"
            className="rounded-lg bg-primary p-2 text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40"
          >
            <Send className="size-4" />
          </button>
        </form>
      </div>
    </div>
  )
}
