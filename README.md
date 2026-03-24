# myLittleWebsite

> 자료 정리 + 포트폴리오 + 기술 학습을 위한 개인 웹사이트

---

## 목적

- **자료 정리**: 학습 내용, 자료, 메모 등을 체계적으로 정리
- **포트폴리오**: 프로젝트·경험 공유
- **기술 학습**: 풀스택 개발 경험, 제작·배포·유지보수 전 과정 실습

---

## 기술 스택

| 레이어       | 기술                                       |
| ------------ | ------------------------------------------ |
| 프론트엔드   | React + TypeScript (Next.js 또는 Vite)     |
| 백엔드       | Node.js + Express + TypeScript             |
| 데이터베이스 | PostgreSQL (Supabase)                      |
| 인증·기타    | Supabase Auth, Storage, Realtime (필요 시) |

선택 이유: [docs/decisions/0001-tech-stack.md](docs/decisions/0001-tech-stack.md)

---

## 디바이스 AI (링크 자동 설명·분류)

유용한 링크 등록 시 **로컬/서버에서 동작하는 AI**가 제목·설명·태그를 자동 추천한다. 데이터가 외부로 나가지 않아 프라이버시를 유지할 수 있다.

| 항목          | 내용                                                                                                                                                     |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **실행 환경** | [Ollama](https://ollama.com) — 로컬 LLM 서버 (`localhost:11434`)                                                                                         |
| **모델**      | **lfm2:24b** (Liquid AI LFM2-24B-A2B)                                                                                                                    |
| **모델 설명** | 24B 파라미터 MoE(Mixture of Experts) 구조, 토큰당 2B 활성 파라미터. 온디바이스·엣지 배포용 하이브리드 모델(State Space + attention). ~14GB, 32K 컨텍스트 |
| **용도**      | 링크 URL만 입력해도 제목·설명·분류 태그 자동 생성                                                                                                        |
| **환경 변수** | `OLLAMA_HOST` (기본 `http://localhost:11434`), `OLLAMA_MODEL` (기본 `lfm2:24b`)                                                                          |
| **서버 코드** | `server/src/services/ai/` (프롬프트·`AiTextProvider`·유스케이스), `server/src/services/ollama.ts`는 라우트용 재export                                    |

AI 기능 사용 전에 `ollama run lfm2:24b`로 모델을 실행해 두어야 한다. 상세: [docs/plans/2026-03-13-links-ai-suggest-design.md](docs/plans/2026-03-13-links-ai-suggest-design.md), [docs/decisions/0012-ollama-ai-links.md](docs/decisions/0012-ollama-ai-links.md), 구조·API 교체 용이성: [docs/decisions/0015-ai-text-provider-abstraction.md](docs/decisions/0015-ai-text-provider-abstraction.md)

---

## 프로젝트 구조

```
myLittleWebsite/
├── client/          # 프론트엔드 (React)
├── server/          # 백엔드 (Express)
├── docs/            # 프로젝트 기록
│   ├── CHANGELOG.md
│   ├── decisions/   # 의사결정 기록 (ADR)
│   └── journal/     # 개발 로그
├── .agents/         # 에이전트 스킬 (UI·프론트 품질)
└── .cursor/         # Cursor 룰 + Superpowers 스킬
```

---

## 에이전트 스킬 (Cursor)

AI 보조 작업 시 로드할 수 있는 **스킬**을 저장소에 포함해 두었다. (에디터·요청 문맥에 따라 실제로 쓰이는 스킬은 달라질 수 있다.)

| 묶음            | 경로                                                                     | 역할                                                                                                    |
| --------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| **Superpowers** | [.cursor/skills/superpowers/skills/](.cursor/skills/superpowers/skills/) | 브레인스토밍, 계획·실행, TDD, 체계적 디버깅, 완료 전 검증, Git worktree, 코드리뷰 요청·대응 등 워크플로 |
| **프론트·UI**   | [.agents/skills/](.agents/skills/)                                       | 레이아웃·타이포·접근성·모션·디자인 시스템 정렬 등 UI 품질                                               |

**Superpowers 스킬 이름** (폴더명): `brainstorming`, `dispatching-parallel-agents`, `executing-plans`, `finishing-a-development-branch`, `receiving-code-review`, `requesting-code-review`, `subagent-driven-development`, `systematic-debugging`, `test-driven-development`, `using-git-worktrees`, `using-superpowers`, `verification-before-completion`, `writing-plans`, `writing-skills`

**`.agents` 스킬 이름** (폴더명): `adapt`, `animate`, `arrange`, `audit`, `bolder`, `clarify`, `colorize`, `critique`, `delight`, `distill`, `extract`, `frontend-design`, `harden`, `normalize`, `onboard`, `optimize`, `overdrive`, `polish`, `quieter`, `teach-impeccable`, `typeset`

개념 정리: [docs/learnings/0002-superpowers.md](docs/learnings/0002-superpowers.md) · 의사결정: [docs/decisions/0003-superpowers.md](docs/decisions/0003-superpowers.md)

**Supabase MCP** (이 레포만): [.cursor/mcp.json](.cursor/mcp.json) — `project_ref`는 **`SUPABASE_MCP_PROJECT_REF`** 환경 변수로 넣습니다(OS 사용자/시스템 환경 변수). 값·주의사항은 [.env.example](.env.example). 설정 후 Cursor 재시작.

---

## 시작하기

```bash
# 의존성 설치 (루트에서 한 번에)
npm install

# 동시 실행 (client: 5173, server: 3000)
npm run dev

# 또는 각각 별도 터미널에서
npm run dev:client   # http://localhost:5173
npm run dev:server   # http://localhost:3000
```

---

## 문서

- [의사결정 기록](docs/decisions/) - 기술·구조 선택 이유
- [CHANGELOG](docs/CHANGELOG.md) - 변경 내역
- [프로젝트 기록 가이드](docs/README.md)
