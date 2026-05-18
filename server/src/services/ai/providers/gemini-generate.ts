export type GeminiContentPart =
  | { text: string }
  | { file_data: { file_uri: string; mime_type?: string } }

type GeminiGenerateResponse = {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> }
  }>
  error?: { message?: string; code?: number }
}

export async function geminiGenerateContent(
  apiKey: string,
  model: string,
  parts: GeminiContentPart[]
): Promise<string> {
  const url = new URL(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`
  )
  url.searchParams.set('key', apiKey.trim())

  const res = await fetch(url.toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts }],
    }),
  })

  const data = (await res.json()) as GeminiGenerateResponse
  if (!res.ok) {
    const msg = data.error?.message ?? (await res.text())
    throw new Error(`Gemini request failed: ${res.status} ${msg}`)
  }

  const text =
    data.candidates?.[0]?.content?.parts
      ?.map((p) => p.text ?? '')
      .join('') ?? ''
  return text.trim()
}
