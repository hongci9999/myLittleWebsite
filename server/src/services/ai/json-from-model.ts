/** 모델이 ```json ... ``` 로 감싼 경우 본문만 추출 */
export function stripMarkdownCodeFence(raw: string): string {
  const codeBlock = raw.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (codeBlock) return codeBlock[1].trim()
  return raw.trim()
}
