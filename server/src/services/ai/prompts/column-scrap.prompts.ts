/**
 * 칼럼 스크랩 AI 채우기용 프롬프트
 */
export const ColumnScrapPrompts = {
  xPostJson(url: string, handleLine: string, handleForTitle: string): string {
    return `다음은 X(트위터) 포스트 링크입니다. 서버에서는 로그인·쿠키 없이 트윗 본문을 읽을 수 없습니다.
웹에서 보이는 "Something went wrong", 확장 프로그램 경고 등의 HTML은 제공하지 않습니다. 그런 문구를 title·summary·bodyMd에 절대 넣지 마세요.

URL: ${url}
${handleLine}

JSON만 출력 (코드펜스 금지). bodyMd는 반드시 아래 구조의 마크다운 문자열(줄바꿈은 \\n으로 이스케이프):
- 첫 줄: ## 요약
- 그 다음 2~3문장: 왜 이 링크를 스크랩하는지, 원문에서 무엇을 확인해야 하는지
- 빈 줄 후 ## 상세 정리
- 글머리로 최소 5개: 원문에서 확인할 질문·체크리스트·메모 포인트(가능한 한 구체적으로. "내용 확인" 같은 빈 문구 금지)

필드:
- title: 40자 이내. 예: "@${handleForTitle} — X 포스트"
- summary: 목록 카드용 한 줄(80자 이내)
- bodyMd: 위 구조 준수
- sourceKind: x
- tags: 최대 3개

형식:
{"title":"","summary":"","bodyMd":"","sourceKind":"x","tags":[]}`
  },

  deepAnalysisNote(url: string, fullText: string): string {
    return `역할: 웹 스크랩용 **심층 분석 노트** 작성. 아래는 페이지에서 추출한 텍스트입니다. 한국어로만 답하세요.

다음을 빠짐없이 채우세요. 총 분량 **800~1800자** 권장(짧게 끊지 말 것).

1) **주제 한 줄**: 무엇에 대한 글·문서·영상·저장소인지
2) **핵심 내용**: 주장, 절차, API·명령, 설정값, 버전, 수치, 인용 등 **구체적 사실**을 원문에 가깝게 (가능하면 용어·코드명 유지)
3) **구조**: 목차·단계·섹션이 있으면 어떤 순서로 전개되는지
4) **대상 독자**: 누가 읽으면 좋은지
5) **활용**: 실무·학습에서 어떻게 쓸 수 있는지
6) **전제·한계**: 문서에 적힌 제한, 주의, "실험적" 표기 등

불확실하면 [추측]이라고 표시하세요. 홍보 문구만 있고 실질 정보가 없으면 그 사실을 명시하세요.

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

칼럼 스크랩용으로 **JSON 한 개만** 출력하세요. 설명 문장·코드펜스 금지.

규칙:
- title: 카드·목록용(40자 이내). HTML 제목을 다듬어도 됩니다.
- summary: **목록 카드용 한 줄**(80자 이내). 핵심만 압축한 문장 1개.
- bodyMd: 마크다운 문자열. **반드시** 아래 두 섹션을 순서대로 포함하세요. 줄바꿈은 JSON 안에서 \\n 으로 이스케이프.
  - 첫 블록: 줄 "## 요약" 다음에 빈 줄, 그다음 **2~4문장**. summary와 같은 뉘앙스이되 조금만 풀어 씀.
  - 둘째 블록: 줄 "## 상세 정리" 다음에 빈 줄, 그다음 **최소 6개의 글머리(- )** 또는 **소제목(### ) 3개 이상**으로 나누어 서술. [심층 분석 노트]의 구체적 사실·용어·수치를 빠짐없이 녹일 것. **본문(요약+상세) 합계 1200자 이상**을 목표(가능하면 1800자까지). 짧은 불릿만 나열하지 말고 각 항목마다 1~2문장 설명을 붙일 것.
- sourceKind: blog | article | readme | youtube | x | other 중 하나
- tags: 주제 키워드, 최대 5개

형식 예(참고용, 이스케이프에 유의):
{"title":"","summary":"","bodyMd":"## 요약\\n\\n...\\n\\n## 상세 정리\\n\\n...","sourceKind":"article","tags":["키워드"]}`
  },

  expandBodyMarkdown(params: {
    url: string
    title: string
    summaryLine: string
    siteAnalysis: string
  }): string {
    const { url, title, summaryLine, siteAnalysis } = params
    return `아래 [심층 분석 노트]만 참고해 칼럼 스크랩용 마크다운 본문을 작성하세요. JSON 금지, 마크다운 원문만 출력.

URL: ${url}
제목: ${title}
목록용 한 줄 요약(요약 섹션과 맞출 것): ${summaryLine}

[심층 분석 노트]
${siteAnalysis}

필수 구조:
1) 첫 줄: ## 요약
2) 빈 줄 후 2~4문장 (위 한 줄 요약을 풀어 쓴 느낌)
3) 빈 줄 후 줄: ## 상세 정리
4) 빈 줄 후: 글머리(- ) 최소 8개 또는 ### 소제목 4개 이상. 각 항목에 1~2문장 설명. 노트의 구체적 용어·수치·절차를 빠짐없이 반영.
5) 전체 1200자 이상 목표 (가능하면 2000자까지).`
  },
} as const
