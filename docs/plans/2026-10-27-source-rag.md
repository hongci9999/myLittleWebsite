# 원문 조각 벡터 RAG 구현 계획

결정 배경·이유: [ADR 0033](../decisions/0033-source-chunk-rag.md)

## 목표

"요약엔 없고 원문 속에만 있는 내용" 질문을 도구 1~2회로 답한다.

- 성공 기준 질문 (지금은 못 하거나 도구 한도에 걸림)
  1. "Cursor 규칙 파일 얘기한 영상 뭐였지?"
  2. "MCP 서버 인증 방식 설명한 자료 찾아줘"
  3. "부트캠프에서 MQTT 재연결 어떻게 처리했어?"
- 기존 질문("유니티 관련 뭐 있어?")은 지금처럼 `list_scraps`로 답해야 한다(회귀 없음).

## 단계

### 1. DB
- [ ] [2026-10-27-source-chunks.sql](2026-10-27-source-chunks.sql) 실행 (pgvector 확장, `source_chunks`, HNSW 인덱스, `match_source_chunks` RPC)

### 2. 색인 모듈 — `server/src/services/knowledge/chunks.ts`
- [ ] `chunkText(text)`: 약 1,000자 + 150자 겹침, `\n\n` → `\n` → `. ` 경계 우선
- [ ] `embed(texts, taskType)`: Gemini `gemini-embedding-001:batchEmbedContents`, `outputDimensionality: 768`, 100개씩 배치. 768차원은 정규화돼 나오지 않으므로 L2 정규화
- [ ] `indexSource(db, url, text)`: 해당 url 기존 조각 삭제 → 청킹 → 임베딩 → insert

### 3. 색인 시점
- [ ] `scripts/backfill-sources.ts`: 원문 upsert 뒤 `indexSource` 호출, 조각이 없는 url만 색인, `--reindex`면 전부. 부트캠프 기록(`bootcamp_docs`, url = `/bootcamp/<slug>`)도 포함
- [ ] `quick-save` `keepSource`: 원문 저장 직후 `indexSource` (실패는 로그만, 저장 응답엔 영향 없음)
- [ ] `import-bootcamp.ts`: 문서 upsert 뒤 해당 기록 재색인

### 4. 도구 — `knowledgeTools`에 `search_sources`
- [ ] 입력 `{ query: string, k?: number(1~20, 기본 8) }`
- [ ] 질문 임베딩(`RETRIEVAL_QUERY`) → `match_source_chunks` → url로 스크랩 매핑해 `{ id, title, siteUrl, url, text, similarity }` 반환
- [ ] description: "제목·요약에 없는 세부 내용, 특정 설명이 나온 부분 찾기. 조각만으로 부족하면 그 url을 get_source로"

### 5. 대화창 프롬프트 — `services/chat.ts` SYSTEM
- [ ] 현재 규칙("자료 질문은 `list_scraps`를 인자 없이 호출해 전체 목록에서 의미로 고른다, 섹션 짐작 금지" — 2026-10-27 태그 필터 오탐 수정)은 유지하고 분기만 추가:
  - 주제·자료 찾기("하네스 관련 자료") → 기존대로 `list_scraps` 전체 목록
  - 원문 속 세부 내용("Cursor 규칙 파일 얘기한 영상") → `search_sources` 먼저, 소속 스크랩은 반환된 id로 `get_scraps`
- [ ] 회귀 확인: 2026-10-27 테스트 질문 10개(하네스·무료 이미지·목소리 클론·랙돌·2D 스프라이트·언리얼·루프 엔지니어링·랜딩페이지·유니티·칼럼 MCP)가 여전히 `list_scraps` 1회로 답하는지

### 6. 검증
- [ ] 로컬에서 위 성공 기준 질문 3개 + 회귀 질문 1개 확인 (어떤 도구를 몇 번 불렀는지 기록)
- [ ] MCP 클라이언트에서 `search_sources` 직접 호출 확인
- [ ] 배포 후 대화창에서 1번 질문 재확인

### 7. 문서
- [ ] ADR 0033 상태 → 채택, 결과에 검증 기록
- [ ] `mcp-guide.md` 도구 목록, CLAUDE.md 백필 단계 설명(색인 포함), About 페이지 대화창 설명

## 범위 밖 (필요해지면)

- 리랭커, BM25 하이브리드: 검증에서 엉뚱한 조각이 상위에 오면 검토
- 스크랩 요약(`summary`) 임베딩으로 `list_scraps` 보조: 목록이 수천 건이 되면 검토
