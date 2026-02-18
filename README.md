# myLittleWebsite

> 자료 정리 + 포트폴리오 + 기술 학습을 위한 개인 웹사이트

---

## 목적

- **자료 정리**: 학습 내용, 메모 등을 체계적으로 정리
- **포트폴리오**: 프로젝트·경험 공유
- **기술 학습**: 풀스택 개발 경험, 제작·배포·유지보수 전 과정 실습

---

## 기술 스택

| 레이어 | 기술 |
|--------|------|
| 프론트엔드 | React + TypeScript (Next.js 또는 Vite) |
| 백엔드 | Node.js + Express + TypeScript |
| 데이터베이스 | PostgreSQL (Supabase) |
| 인증·기타 | Supabase Auth, Storage, Realtime (필요 시) |

선택 이유: [docs/decisions/0001-tech-stack.md](docs/decisions/0001-tech-stack.md)

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
└── .cursor/         # Cursor AI 룰
```

---

## 시작하기

> ⏳ client, server 세팅 진행 중

```bash
# 클라이언트
cd client && npm install && npm run dev

# 서버 (별도 터미널)
cd server && npm install && npm run dev
```

---

## 문서

- [의사결정 기록](docs/decisions/) - 기술·구조 선택 이유
- [CHANGELOG](docs/CHANGELOG.md) - 변경 내역
- [프로젝트 기록 가이드](docs/README.md)
