# 칼럼 스크랩·스크랩 목록 UX·마크다운 임베드

날짜: 2026-03-24  
상태: 채택

## 배경 (왜 이 결정이 필요한가)

- 블로그·기사·README·유튜브·X 등 **외부 글을 스크랩**해 두고, 카드 목록·상세 메모·태그로 정리하는 **칼럼 스크랩** 기능이 필요했다.
- **X URL**은 서버 `fetch` 시 실제 트윗 대신 오류·확장프로그램 안내 HTML만 오는 경우가 많아, 그대로 AI에 넣으면 **쓸데없는 영문 문구**가 생성되었다.
- **원문 외 참고 링크**(후속 글, 문서 등)를 같은 스크랩에 묶어 두고 싶었다(AI 도구 스크랩의 `extra_links`와 정렬).
- **추가·편집 다이얼로그 하단의 전체 목록**은 폼과 역할이 겹치고 스크롤이 길어져, **목록 페이지에서 바로 편집·삭제**하는 편이 낫다.
- 마크다운 본문에 유튜브 URL만 넣었을 때 **플레이어로 보이게** 하면 메모 가치가 올라간다.
- 링크용 Ollama(`suggestLinkMeta`)와 달리 칼럼은 **긴 메모(`bodyMd`)**가 핵심이라, 한 줄 분석만으로는 **본문이 부실**했다.

## 결정 (무엇으로 했는지)

1. **스키마**
   - `column_scraps.source_kind`에 `x` 추가.
   - `extra_links` JSONB 배열 `{ label, url }[]` 추가.
2. **칼럼 AI 채움 (`suggestColumnScrapFromUrl`)**
   - **X/Twitter 호스트**: HTML fetch 생략, URL·핸들 기반 전용 프롬프트.
   - **그 외**: Cheerio 추출 텍스트로 **1단계 심층 분석**(길이·항목 지정) → **2단계 JSON**(title, summary, bodyMd, …). `bodyMd`는 `## 요약` / `## 상세 정리` 구조와 분량 목표를 프롬프트에 명시.
   - JSON `bodyMd`가 짧으면 **3단계**: 분석 텍스트만으로 마크다운 본문 재생성(`expandColumnBodyMarkdown`).
   - 표지: HTML `og:image` 추출을 `fetch-website`에 추가.
3. **API**
   - `POST /api/column-scraps/ai-fill` (인증).
   - CRUD에 `extraLinks` 반영; 목록 검색에 추가 링크 포함.
4. **UI**
   - `OverflowMenu`(세로 ⋮)로 카드/행에서 편집·삭제; 다이얼로그에서는 **전체 목록 제거**(칼럼·AI 스크랩 공통 방향).
5. **MarkdownWithMath**
   - `a` 컴포넌트 오버라이드: YouTube `href`면 iframe(nocookie) + 링크.

## 이유 (다른 선택지를 배제한 이유)

- **X도 fetch 후 AI**: 오염된 HTML이 재현될 수 있어 제외.
- **다이얼로그에 목록 유지**: 정보 중복·긴 스크롤; 카드 액션이 일반적인 패턴.
- **유튜브만 별도 shortcode 문법**: 사용자가 URL만 붙여 넣는 경우가 많아 **기존 링크 문법**을 해석하는 쪽이 학습 비용이 낮다.
- **본문 한 번의 JSON만**: 모델이 `bodyMd`를 짧게 주는 경향이 있어 **조건부 3차 호출**로 보완(지연·토큰 비용 vs 품질 트레이드오프).

## 결과/참고

- 마이그레이션: `docs/plans/2026-03-24-column-scraps-migration.sql`, `2026-03-24-column-scraps-add-x-kind.sql`, `2026-03-24-column-scraps-extra-links.sql`
- 구현: `server/src/services/ollama.ts`, `fetch-website.ts`, `routes/column-scraps.ts`, `client/.../MarkdownWithMath.tsx`, `OverflowMenu.tsx`
- API 명세: `docs/api-spec.md` §6·§7
- 학습: `docs/learnings/0020-column-scrap-markdown-youtube.md`
