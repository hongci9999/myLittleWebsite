# 기술 스택 선정

- **날짜**: 2026-02-17
- **상태**: 채택

## 배경 (왜 이 결정이 필요한가)

자료 정리, 포트폴리오, 기술 학습을 위한 개인 웹사이트를 구축한다. 학습과 기능 확장을 우선시하여, 장기적으로 확장 가능한 스택이 필요했다.

## 결정 (무엇으로 했는지)

| 레이어 | 기술 |
|--------|------|
| 프론트엔드 | React + TypeScript (Next.js 또는 Vite) |
| 백엔드 | Node.js + Express + TypeScript |
| 데이터베이스 | PostgreSQL (Supabase 호스팅) |
| 인증·기타 | Supabase Auth, Storage, Realtime (필요 시) |

## 이유 (다른 선택지를 배제한 이유)

- **프론트/백엔드 분리**: 학습 관점에서 REST API, 계층 분리가 명확함
- **Node.js**: TypeScript로 풀스택 일관성, 생태계 풍부
- **Supabase**: PostgreSQL + Auth + Storage 통합, 무료 티어, 기능 확장 시 인프라 부담 적음
- **Next.js/Vite 보류**: 구체적인 선택은 구현 단계에서 결정

## 결과/참고

- `.cursor/rules/stack-structure.mdc`에 스택·폴더 구조 정의
