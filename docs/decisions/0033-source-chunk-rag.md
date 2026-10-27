# 원문 조각 검색 — pgvector 벡터 RAG를 `search_sources` 도구로 추가

- **날짜**: 2026-10-27
- **상태**: 제안

## 배경 (왜 이 결정이 필요한가)

대화창·MCP(ADR 0028·0030)는 **도구 호출형(agentic) RAG**다. LLM이 `list_scraps`(id·제목·요약·태그 전체 목록)를 보고 후보를 고른 뒤 `get_scraps`·`get_source`로 읽는다. 자료 *고르기*는 잘 되지만, **원문 속 세부 내용 찾기**에서 막힌다.

- **문제 1 — 요약에 없는 내용은 못 찾는다.** "Cursor 규칙 파일 얘기한 영상 뭐였지?"처럼 자막 중간에만 나온 내용은 제목·요약·태그에 없어서 `list_scraps` 단계에서 후보가 안 잡힌다.
- **문제 2 — 원문을 통째로 읽어야 한다.** 후보를 잡아도 `get_source`는 40k자씩 반환한다. 원문(`scrap_sources`) 실측(2026-10-27): page 33건 평균 2.7만 자(최대 20.6만), 자막 97건 평균 9천 자, README 38건 평균 2.2만 자 — 합계 약 260만 자, 40k 초과 12건. 후보 3~4개만 읽어도 한 질문에 수만~수십만 토큰.
- **문제 3 — 도구 호출 5회 제한.** "MCP 인증 방식 설명한 자료 다 찾아줘"처럼 여러 원문을 뒤져야 하는 질문은 목록 1회 + 원문 몇 개에서 한도에 걸려 답이 불완전해진다.
- 부트캠프 기록(`bootcamp_docs.body_md`)도 같은 문제 — 문서가 길어서 "MQTT 재연결 어떻게 처리했지" 같은 질문은 `get_project_record`로 전문을 읽어야 한다.

즉 **"어느 자료인지"는 LLM이 고르는 게 낫고, "자료 안의 어느 부분인지"는 벡터 검색이 낫다.** 후자에 일반(벡터) RAG를 도입한다.

## 결정 (무엇으로 했는지)

기존 도구 흐름은 그대로 두고, 원문 조각 검색 도구 하나를 추가하는 **하이브리드**.

1. **색인 테이블 `source_chunks`** (Supabase pgvector) — `url`, `chunk_idx`, `text`, `embedding vector(768)`. 대상: `scrap_sources` 원문 + `bootcamp_docs.body_md`(url = 기록 페이지 경로). HNSW 코사인 인덱스. 검색은 `match_source_chunks(query_embedding, match_count)` RPC.
2. **청킹** — 약 1,000자, 150자 겹침. 문단·줄바꿈 경계 우선으로 자른다.
3. **임베딩** — Gemini `gemini-embedding-001`, `outputDimensionality: 768`(pgvector 인덱스 한도 2,000차원 이내·저장량 절감), 문서는 `RETRIEVAL_DOCUMENT`, 질문은 `RETRIEVAL_QUERY`. 기존 `GEMINI_API_KEY` + `fetch` 직접 호출(SDK 추가 없음, `chat.ts`와 같은 방식).
4. **색인 시점**
   - `backfill-sources` 스크립트: 원문 저장 후 청킹·임베딩까지. `--reindex`로 전체 재색인. 부트캠프 기록도 여기서.
   - 빠른 저장 `keepSource`: 원문 저장 직후 같은 함수로 색인(실패해도 저장은 성공 — 다음 백필이 채움).
5. **도구 `search_sources(query, k?)`** — 질문 임베딩 → top-k(기본 8) 조각 + 소속 스크랩 id·제목·siteUrl·유사도. MCP·대화창 공통(`knowledgeTools`에 추가).
6. **시스템 프롬프트** — "제목·요약으로 안 잡히는 세부 내용, 특정 설명이 나온 부분은 `search_sources`. 조각만으로 부족하면 그 url을 `get_source`로."

## 이유 (다른 선택지를 배제한 이유)

| 대안 | 배제 이유 |
|------|-----------|
| `list_scraps`까지 벡터 검색으로 교체 | 목록은 수백 건이라 LLM이 전체를 보고 고르는 게 더 정확. 문제는 목록이 아니라 원문 |
| Postgres full-text(`tsvector`) | 한국어 형태소 분석 기본 미지원, "인증 방식" ↔ "OAuth 토큰" 같은 의미 매칭 불가 |
| 도구 호출 한도만 늘리기 | 토큰 비용·지연이 그대로 커지고 문제 1(후보 자체가 안 잡힘)은 못 풂 |
| 외부 벡터DB(Pinecone 등) | 이미 Supabase 사용 중, pgvector는 확장 하나 켜면 끝. 서비스·키 추가 불필요 |
| 원문을 LLM 요약으로 압축해 저장 | 세부 내용이 요약 과정에서 사라짐 — 문제 1이 그대로 |
| 리랭커·하이브리드(BM25) 검색 | 260만 자·약 3천 조각 규모에선 과함. 정확도 부족이 확인되면 추가 |

## 결과/참고

- 계획: [2026-10-27-source-rag.md](../plans/2026-10-27-source-rag.md), SQL: [2026-10-27-source-chunks.sql](../plans/2026-10-27-source-chunks.sql)
- 규모 추정: 약 3천 조각 × 768차원 ≈ 9MB(Supabase 무료 한도 내). 임베딩 비용 무시 가능 수준.
- 유튜브 자막은 로컬에서만 받을 수 있어서(Vercel IP 차단) 자막 색인도 로컬 백필에서 한다.
