import { apiUrl } from '@/shared/api/base'

export type ChatMessage = { role: 'user' | 'model'; text: string }

/** POST /api/chat — 로그인 토큰 있으면 사용 제한 없음 */
export async function sendChat(messages: ChatMessage[], token: string | null): Promise<string> {
  const res = await fetch(apiUrl('/api/chat'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ messages }),
  })
  const data = (await res.json().catch(() => ({}))) as { text?: string; error?: string }
  if (!res.ok) throw new Error(data.error ?? `요청 실패 (${res.status})`)
  return data.text ?? ''
}
