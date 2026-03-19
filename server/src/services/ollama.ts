/**
 * Ollama API 호출 서비스
 * 링크 설명·분류 추천용
 */

const OLLAMA_HOST = process.env.OLLAMA_HOST ?? 'http://localhost:11434'
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? 'lfm2:24b'

export interface AiSuggestResult {
  description: string
  suggestedLabels: string[]
}

/** Ollama /api/generate 호출 */
async function generate(prompt: string): Promise<string> {
  const res = await fetch(`${OLLAMA_HOST}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: OLLAMA_MODEL,
      prompt,
      stream: false,
    }),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Ollama request failed: ${res.status} ${text}`)
  }
  const data = (await res.json()) as { response?: string }
  return (data.response ?? '').trim()
}

/**
 * URL과 제목으로 링크 설명·분류 추천
 * @param url 링크 URL
 * @param title 링크 제목
 * @param availableLabels 사용 가능한 분류 label 목록 (예: ["이미지 생성", "프론트엔드", "웹 서비스"])
 */
export async function suggestLinkMeta(
  url: string,
  title: string,
  availableLabels: string[]
): Promise<AiSuggestResult> {
  const labelsStr =
    availableLabels.length > 0
      ? availableLabels.join(', ')
      : '(없음 - 새로 만들어도 됨)'

  const prompt = `다음 링크에 대한 설명과 분류를 추천해주세요.

URL: ${url}
제목: ${title}

사용 가능한 분류(태그): ${labelsStr}

반드시 아래 JSON 형식으로만 답해주세요. 다른 텍스트 없이 JSON만 출력하세요.
{
  "description": "한 줄 설명 (50자 이내)",
  "suggestedLabels": ["분류1", "분류2"]
}

suggestedLabels는 위 사용 가능한 분류에서 선택하거나, 없으면 적절한 새 분류를 제안하세요. 1~5개 정도.`

  const raw = await generate(prompt)

  // JSON 추출 (마크다운 코드블록 제거)
  let jsonStr = raw
  const codeBlock = raw.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (codeBlock) jsonStr = codeBlock[1].trim()

  try {
    const parsed = JSON.parse(jsonStr) as {
      description?: string
      suggestedLabels?: string[]
    }
    return {
      description: parsed.description ?? '',
      suggestedLabels: Array.isArray(parsed.suggestedLabels)
        ? parsed.suggestedLabels.filter((s) => typeof s === 'string')
        : [],
    }
  } catch {
    return { description: raw.slice(0, 200), suggestedLabels: [] }
  }
}
