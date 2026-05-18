/**
 * 텍스트 완성 전용 추상화. Ollama·OpenAI·Anthropic 등은 이 인터페이스만 구현하면
 * suggest-* 유스케이스는 변경 없이 동작한다.
 */
export interface AiTextProvider {
  complete(prompt: string): Promise<string>
  /** Gemini 등: 공개 YouTube watch URL을 멀티모달 입력으로 처리 */
  completeWithYoutubeUrl?(watchUrl: string, prompt: string): Promise<string>
}
