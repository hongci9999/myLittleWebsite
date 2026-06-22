/**
 * 게임 개발 도서관 AI 채우기용 프롬프트
 */
export const GameDevResourcePrompts = {
  xPostJson(url: string, handleLine: string): string {
    return `다음은 X(트위터) 링크입니다. **게임 개발 정보 도서관** 스크랩용으로 JSON 한 개만 출력하세요. HTML·오류 문구를 title·summary·bodyMd에 넣지 마세요.

URL: ${url}
${handleLine}

bodyMd: 마크다운. ## 요약 / ## 상세 정리 구조. 트윗 본문은 원문에서만 확인 가능함을 짧게 안내하고, 게임 개발 관점에서 메모할 체크리스트를 글머리로.

필드:
- title: 40자 이내
- summary: 80자 이내
- bodyMd: 위 구조, 줄바꿈은 \\n
- mediaKind: 반드시 other
- category: graphics | physics | ai | gameplay | engine | network | sound | optimization | etc 중 하나 (내용 추정)
- tags: 최대 5개 (게임 엔진·기법 키워드)

형식:
{"title":"","summary":"","bodyMd":"","mediaKind":"other","category":"etc","tags":[]}`
  },

  deepAnalysisNote(url: string, fullText: string): string {
    return `역할: **게임 개발** 관점의 심층 분석 노트. 페이지 텍스트입니다. 한국어로만.

다음을 빠짐없이 채우세요. 총 분량 **600~1500자** 권장.

1) **주제·분야**: 그래픽스·렌더링, 물리, AI, 게임플레이·설계, 엔진·툴, 네트워크, 사운드, 최적화 등 어디에 해당하는지
2) **핵심 내용**: 다루는 기법·패턴·알고리즘·워크플로
3) **대상·난이도**: 초급/중급/고급, 특정 엔진(Unity/Unreal/Godot 등) 여부
4) **실무 포인트**: 적용 시 주의·한계·관련 공식 문서
5) **연관 키워드·버전** 정보가 있으면 인용

불확실하면 [추측] 표시.

URL: ${url}

---
${fullText}
---
`
  },

  deepAnalysisNoteObsidianClipTranscript(
    transcript: string,
    context?: { title?: string; channel?: string }
  ): string {
    const metaLines: string[] = []
    if (context?.title?.trim()) {
      metaLines.push(`참고 제목(자막 외 보조, 추론에만 사용): ${context.title.trim()}`)
    }
    if (context?.channel?.trim()) {
      metaLines.push(`참고 채널(보조): ${context.channel.trim()}`)
    }
    const metaBlock =
      metaLines.length > 0 ? `${metaLines.join('\n')}\n\n` : ''

    return `역할: **게임 개발** 관점의 심층 분석 노트. 아래는 Obsidian Web Clipper에서 추출한 **동영상 자막(스크립트) 텍스트만** 입니다. 한국어로만.

**반드시 지킬 것**
- 아래 **자막 텍스트만** 분석 근거로 사용하세요. URL·영상·음성·외부 페이지에 접근하지 않았습니다.
- 영상을 직접 본다고 가정하지 마세요. 외부 검색·일반 지식으로 내용을 채우지 마세요.
- 자막에 없는 내용은 쓰지 말고, 불가피하면 [추측]으로만 표시하세요.

다음을 빠짐없이 채우세요. 총 분량 **800~1800자** 권장(짧게 끊지 말 것).

1) **주제·분야**: 자막 기준 이 영상이 무엇에 대한 것인지 (그래픽스·물리·AI·게임플레이·엔진·네트워크·사운드·최적화 등)
2) **핵심 내용**: 자막에 나온 주장, 절차, 설정값, 버전, 수치, 인용 등 **구체적 사실**
3) **구조**: 자막이 어떤 순서로 전개되는지(섹션·단계)
4) **대상·난이도**: 누가 보면 좋은지, 엔진·툴 전제
5) **실무 활용**: 게임 제작·학습에서 어떻게 쓸 수 있는지
6) **전제·한계**: 자막에 밝힌 제한, 주의, 불확실한 부분

${metaBlock}---
${transcript}
---
`
  },

  deepAnalysisNoteYoutubeTranscript(url: string, fullText: string): string {
    return `역할: **게임 개발** 관점의 심층 분석 노트. 아래는 YouTube 영상에서 추출한 **메타데이터·자막(transcript)** 입니다. 한국어로만.

자막이 주 분석 근거입니다. 제목·채널·설명은 보조로만 쓰고, 자막에 없는 내용은 [추측]으로 표시하세요.

다음을 빠짐없이 채우세요. 총 분량 **800~1800자** 권장(짧게 끊지 말 것).

1) **주제·분야**: 무엇에 대한 영상인지 (게임 개발 분야)
2) **핵심 내용**: 주장, 절차, 데모, 설정값, 버전, 수치, 인용 등 **구체적 사실** (가능하면 용어·코드명 유지)
3) **구조**: 영상이 어떤 순서로 전개되는지(섹션·단계)
4) **대상·난이도**: 누가 보면 좋은지, 엔진·툴 전제
5) **실무 활용**: 게임 제작·학습에서 어떻게 쓸 수 있는지
6) **전제·한계**: 자막·설명에 밝힌 제한, 주의, 불확실한 부분

자막이 비어 있거나 의미 없으면 그 사실을 명시하세요.

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

**게임 개발 정보 도서관**용으로 JSON 한 개만 출력. 설명·코드펜스 금지.

규칙:
- title: 목록용 40자 이내
- summary: 한 줄 80자 이내
- bodyMd: 마크다운. ## 요약 → 2~4문장, ## 상세 정리 → 글머리 6개 이상 또는 ### 3개 이상. 합계 **800자 이상** 목표. 줄바꿈은 JSON에서 \\n
- mediaKind: youtube | article | repo | blog | doc | book | asset | other 중 **정확히 하나**
- category: graphics | physics | ai | gameplay | engine | network | sound | optimization | etc 중 **정확히 하나** (콘텐츠 주제 분야)
- tags: 키워드 최대 5개 (예: Unity, ECS, 렌더링, GDC)

형식:
{"title":"","summary":"","bodyMd":"## 요약\\n\\n...\\n\\n## 상세 정리\\n\\n...","mediaKind":"article","category":"graphics","tags":[]}`
  },

  expandBodyMarkdown(params: {
    url: string
    title: string
    summaryLine: string
    siteAnalysis: string
  }): string {
    const { url, title, summaryLine, siteAnalysis } = params
    return `아래 [심층 분석 노트]만 참고해 **게임 개발 정보 도서관**용 마크다운 본문을 작성하세요. JSON 금지, 마크다운 원문만 출력.

URL: ${url}
제목: ${title}
목록용 한 줄 요약과 맞출 것: ${summaryLine}

[심층 분석 노트]
${siteAnalysis}

맥락: 게임 개발 방법론·이론·기술·프로그램·엔진·툴·강의·문서 등 **게임 제작·학습에 쓰는 자료**입니다.

필수 구조:
1) 첫 줄: ## 요약
2) 빈 줄 후 2~4문장: 무엇을 정리·보관하는 자료인지
3) 빈 줄 후 ## 상세 정리
4) 빈 줄 후: 글머리(- ) 최소 8개 또는 ### 소제목 4개 이상. 핵심 개념·적용 포인트·엔진/플랫폼·주의사항·관련 링크 포인트 등 실무 메모. 노트의 구체적 용어·기법을 반영.
5) 전체 1000자 이상 목표.`
  },
} as const
