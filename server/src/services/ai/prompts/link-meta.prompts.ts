/**
 * 링크 메타(제목·설명) AI 제안용 프롬프트. 입력만 조합하고 호출은 유스케이스에서.
 */
export const LinkMetaPrompts = {
  analyzeWebsite(url: string, fullText: string): string {
    return `다음 웹사이트 내용을 분석해주세요. 어떤 사이트인지, 주요 내용·목적·대상이 무엇인지 200자 이내로 요약해주세요.

URL: ${url}

---
${fullText}
---
`
  },

  titleHintLine(userTitle: string): string {
    return userTitle.trim()
      ? `제목(사이트 이름): ${userTitle} (이 사이트명을 우선 사용)`
      : '제목이 없으므로 URL 또는 분석을 보고 사이트 이름(브랜드명·서비스명)을 생성해주세요. 설명이 아닌 이름만.'
  },

  contextWithAnalysis(url: string, siteAnalysis: string): string {
    return `[웹사이트 분석 결과]
${siteAnalysis}

위 분석을 바탕으로 링크 추가용 메타데이터를 제시해주세요.

`
  },

  contextUrlOnly(url: string): string {
    return `[URL만 제공됨 - 사이트 fetch 실패 또는 내용 없음]
URL: ${url}

`
  },

  metadataJson(
    contextBlock: string,
    titleHintLine: string,
    classificationCatalog: string | null
  ): string {
    const baseRules = `규칙:
- title은 사이트 이름(브랜드명·서비스명)만. 설명·문구 아님. 예: "shadcn/ui", "React", "GitHub" (O) / "React 컴포넌트 라이브러리" (X, 이건 description)
- description은 문어체로 작성. "이 사이트는", "~은/는"으로 시작하지 말고, 기능·역할만 바로 설명.`

    if (classificationCatalog?.trim()) {
      return `${contextBlock}${titleHintLine}

${baseRules}
- valueIds: 아래 목록에 나온 **id 문자열(UUID)만** 배열로 넣으세요. 목록에 없는 id를 만들지 마세요. 맞는 태그가 없으면 [].
- 각 분류 축에서 복수 선택 가능. 정말 맞는 것만 고르세요(보통 1~4개).

## 분류 태그 후보 (이 id만 사용)
${classificationCatalog.trim()}

반드시 아래 JSON 형식으로만 답해주세요. 다른 텍스트 없이 JSON만 출력하세요.
{
  "title": "사이트 이름 (20자 이내, 브랜드·서비스명만)",
  "description": "한 줄 설명 (50자 이내, 문어체, 기능만)",
  "valueIds": ["uuid-목록에서-복사", "..."]
}`
    }

    return `${contextBlock}${titleHintLine}

${baseRules}

반드시 아래 JSON 형식으로만 답해주세요. 다른 텍스트 없이 JSON만 출력하세요.
{
  "title": "사이트 이름 (20자 이내, 브랜드·서비스명만)",
  "description": "한 줄 설명 (50자 이내, 문어체, 기능만)"
}`
  },
} as const
