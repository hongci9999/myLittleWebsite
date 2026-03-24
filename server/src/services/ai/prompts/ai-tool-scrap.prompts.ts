/**
 * AI 개발 도구 스크랩 AI 채우기용 프롬프트
 */
export const AiToolScrapPrompts = {
  xPostJson(url: string, handleLine: string): string {
    return `다음은 X(트위터) 링크입니다. **AI 개발 도구 스크랩**용으로 JSON 한 개만 출력하세요. HTML·오류 문구를 title·summary·bodyMd에 넣지 마세요.

URL: ${url}
${handleLine}

bodyMd: 마크다운. ## 요약 / ## 상세 정리 구조. 트윗 본문은 원문에서만 확인 가능함을 짧게 안내하고, 나중에 메모할 체크리스트를 글머리로.

필드:
- title: 40자 이내
- summary: 80자 이내
- bodyMd: 위 구조, 줄바꿈은 \\n
- sourceKind: 반드시 other
- tags: 최대 5개

형식:
{"title":"","summary":"","bodyMd":"","sourceKind":"other","tags":[]}`
  },

  deepAnalysisNote(url: string, fullText: string): string {
    return `역할: **AI 개발 도구** 관점의 심층 분석 노트. 페이지 텍스트입니다. 한국어로만.

다음을 빠짐없이 채우세요. 총 분량 **600~1500자** 권장.

1) **도구 유형**: MCP 서버, 스킬 팩, Cursor 룰, CLI, 공식 문서, 저장소 등 무엇에 가까운지
2) **기능·역할**: 무엇을 자동화·보조하는지, 주요 API·명령·설정
3) **설치·연동**: 경로, 환경 변수, 의존성, 호환 편집기
4) **주의·한계**: 실험적 표기, 보안, 유료 여부
5) **공식 링크·버전** 정보가 있으면 인용

불확실하면 [추측] 표시.

URL: ${url}

---
${fullText}
---
`
  },

  metadataJson(params: {
    contextBlock: string
    pageTitleLine: string
    urlKindLine: string
  }): string {
    const { contextBlock, pageTitleLine, urlKindLine } = params
    return `${contextBlock}${pageTitleLine}
${urlKindLine}

**AI 개발 도구 스크랩**용으로 JSON 한 개만 출력. 설명·코드펜스 금지.

규칙:
- title: 목록용 40자 이내
- summary: 한 줄 80자 이내
- bodyMd: 마크다운. ## 요약 → 2~4문장, ## 상세 정리 → 글머리 6개 이상 또는 ### 3개 이상. 합계 **800자 이상** 목표. 줄바꿈은 JSON에서 \\n
- sourceKind: mcp | skill | rules | cli | doc | repo | other 중 **정확히 하나**
- tags: 키워드 최대 5개 (예: MCP, Cursor, Ollama)

형식:
{"title":"","summary":"","bodyMd":"## 요약\\n\\n...\\n\\n## 상세 정리\\n\\n...","sourceKind":"doc","tags":[]}`
  },

  expandBodyMarkdown(params: {
    url: string
    title: string
    summaryLine: string
    siteAnalysis: string
  }): string {
    const { url, title, summaryLine, siteAnalysis } = params
    return `아래 [심층 분석 노트]만 참고해 **AI 개발 도구 스크랩**용 마크다운 본문을 작성하세요. JSON 금지, 마크다운 원문만 출력.

URL: ${url}
제목: ${title}
목록용 한 줄 요약과 맞출 것: ${summaryLine}

[심층 분석 노트]
${siteAnalysis}

맥락: MCP, Agent Skills, Cursor Rules, CLI 에이전트, 문서, Git 저장소 등 **개발자가 AI 코딩 보조에 쓰는 도구**입니다.

필수 구조:
1) 첫 줄: ## 요약
2) 빈 줄 후 2~4문장: 무엇을 정리·보관하는 스크랩인지
3) 빈 줄 후 ## 상세 정리
4) 빈 줄 후: 글머리(- ) 최소 8개 또는 ### 소제목 4개 이상. 설치·설정·연동·주의사항·공식 문서 링크 포인트 등 실무 메모. 노트의 구체적 용어·명령·경로를 반영.
5) 전체 1000자 이상 목표.`
  },
} as const
