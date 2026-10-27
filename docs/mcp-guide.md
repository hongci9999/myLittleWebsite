# MCP 연결 가이드

이 사이트에 모아 둔 자료(AI 개발 도구, 칼럼, 게임 개발 자료, 유용한 링크)와 포트폴리오를 **내가 쓰는 AI(Claude, Cursor 등)가 직접 읽게** 하는 MCP 서버입니다. 연결해 두면 AI가 답할 때 이 사이트 자료를 근거로 쓰고 출처 링크를 달아 줍니다.

```
https://my-little-website-client-self.vercel.app/api/mcp
```

- **읽기 전용**이고 **인증이 없습니다**. 사이트에 이미 공개된 정보만 제공합니다.
- 방식은 Streamable HTTP입니다(MCP 표준 원격 서버 방식).

---

## 이런 걸 물어볼 수 있어요

| 질문 예시 | AI가 쓰는 도구 |
|---|---|
| "저장된 자료 중에 2D 스프라이트 만들 때 쓸 만한 도구 있어?" | `list_scraps` → `get_scraps` |
| "온톨로지 칼럼 내용으로 할 만한 사이드 프로젝트 제안해 줘" | `get_scraps` → `get_source` |
| "그 영상에서 정확히 뭐라고 했는지 스크립트 보고 알려줘" | `get_source` (유튜브 자막) |
| "CHEESESTORM 프로젝트로 자기소개서 문제해결 경험 문단 써 줘" | `get_portfolio` → `read_dev_notes` |
| "부트캠프 EV 배터리 프로젝트에서 내 역할과 Recall을 고른 이유" | `get_portfolio` → `get_project_record` |
| "CHEESESTORM README 기준으로 Firestore 비용 줄인 방법" | `get_portfolio` → `get_source`(repoUrl) |
| "이 사이트는 왜 Vercel로 옮겼어?" | `read_dev_notes` (기술 결정 기록) |

---

## 연결하기

### Claude Code

```bash
claude mcp add --transport http mysite https://my-little-website-client-self.vercel.app/api/mcp
```

연결 확인은 `claude mcp list`로 합니다.

### Codex (CLI·IDE 확장·데스크톱 앱)

```bash
codex mcp add mysite --url https://my-little-website-client-self.vercel.app/api/mcp
```

같은 설정을 `~/.codex/config.toml`에 직접 적어도 됩니다.

```toml
[mcp_servers.mysite]
url = "https://my-little-website-client-self.vercel.app/api/mcp"
```

CLI, IDE 확장, 데스크톱 앱이 이 설정을 함께 씁니다. 앱이나 확장에서는 **설정(톱니) → MCP servers → Add server → Streamable HTTP**에 URL을 넣고 재시작해도 됩니다. 확인은 `codex mcp list`, 대화 중에는 `/mcp`로 합니다.

### Claude (웹·데스크톱 앱)

**설정 → 커넥터 → 커스텀 커넥터 추가**에서 이름(예: `mysite`)과 위 URL을 넣습니다. 인증 설정은 비워 둡니다. 대화창 도구 메뉴에서 커넥터를 켜고 질문합니다.

> 커스텀 커넥터 사용 가능 여부는 요금제에 따라 다를 수 있습니다.

### Cursor

`~/.cursor/mcp.json` (전역) 또는 프로젝트의 `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "mysite": { "url": "https://my-little-website-client-self.vercel.app/api/mcp" }
  }
}
```

### VS Code (Copilot 에이전트 모드)

프로젝트의 `.vscode/mcp.json`:

```json
{
  "servers": {
    "mysite": { "type": "http", "url": "https://my-little-website-client-self.vercel.app/api/mcp" }
  }
}
```

### 그 밖의 클라이언트

"원격 MCP 서버(HTTP / Streamable HTTP)"를 지원하면 위 URL만 넣으면 됩니다. SSE 전용 클라이언트는 지원하지 않습니다.

---

## 도구 목록

| 도구 | 입력 | 하는 일 |
|---|---|---|
| `list_scraps` | `section?`: `ai-tools` / `columns` / `game-dev` / `links`, `tag?` | 저장 자료 전체 목록(id·제목·요약·태그·사이트 경로). AI가 여기서 관련 항목을 고릅니다 |
| `get_scraps` | `ids` (최대 10개) | 고른 항목의 정리 본문, 원본 링크, 추가 링크(소개 영상·레포), 사이트 페이지 링크 |
| `get_source` | `url`, `offset?` | 원문. 유튜브는 **자막 스크립트**, GitHub 레포는 README, 그 외는 페이지 본문. 4만 자씩 나눠서 줍니다 |
| `search_sources` | `query`, `k?` (기본 8) | 원문(자막·README·웹 글·부트캠프 기록)과 정리 본문을 **의미로 검색**해 관련 조각과 소속 자료를 줍니다. 제목·요약엔 없는 세부 내용(특정 기술 이름 등)을 찾을 때 |
| `get_portfolio` | 없음 | 자기소개(About), 프로젝트 목록, 부트캠프 기록 목록 |
| `get_project_record` | `slug` | 부트캠프 프로젝트 기록 전문 (예: `ev-battery`) |
| `read_dev_notes` | `path?` | 이 사이트를 만들며 남긴 기술 결정 기록(ADR)·학습 노트·버그 수정 기록·월별 개발 일지. path 없이 부르면 파일 목록 |

**참고**
- `get_source`는 사이트에 저장된 자료의 링크(원본 url 또는 추가 링크)와 프로젝트 카드의 링크(GitHub·라이브·구축 후기)만 조회할 수 있습니다.
- 원문은 하루 한 번 자동으로 모으고 검색 색인도 갱신합니다 — 새로 저장한 자료는 최대 하루 뒤 `search_sources`에 잡힙니다.
- 유튜브 자막은 미리 저장해 둔 것을 줍니다. 아직 저장되지 않은 영상은 자막 대신 AI가 영상을 보고 만든 요약을 주고, 이때 결과의 `kind`가 `ai-digest`입니다.

---

## 직접 확인해 보기

```bash
curl -X POST https://my-little-website-client-self.vercel.app/api/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list","params":{}}'
```

GUI로 보려면 `npx @modelcontextprotocol/inspector`를 실행하고, Transport를 **Streamable HTTP**로 두고 위 URL로 연결합니다.

---

## 운영 메모 (사이트 관리자용)

- **코드**: 도구 정의는 `server/src/services/knowledge/`, 엔드포인트는 `server/src/routes/mcp.ts`
- **원문 캐시**: Supabase `scrap_sources` 테이블([SQL](https://github.com/hongci9999/myLittleWebsite/blob/main/docs/plans/2026-10-13-scrap-sources.sql)). 배포 서버(Vercel) IP에서는 유튜브 자막 요청이 막히므로 **로컬에서** 채웁니다.
  ```bash
  npm run backfill-sources -w server            # 캐시에 없는 것만
  npm run backfill-sources -w server -- --force # 전부 다시
  ```
  자료를 새로 추가하면(특히 유튜브) 한 번씩 실행합니다.
- **섹션 추가**: `knowledge/index.ts`의 `SECTIONS`에 한 줄
- **설계 배경**: [ADR 0028](https://github.com/hongci9999/myLittleWebsite/blob/main/docs/decisions/0028-site-knowledge-mcp.md)
