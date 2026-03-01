# Next.js 개요 및 Vite 대비 특징

날짜: 2026-02-28
태그: [프론트, 아키텍처, 도구]

## 요약

Next.js는 React 기반 풀스택 프레임워크로, SSR·SSG·API Routes·Server Actions 등을 내장한다. Vite + React는 가벼운 SPA에 적합하고, Next.js는 SEO·풀스택·서버 렌더링이 필요한 프로젝트에 유리하다. Next.js 15는 Turbopack 안정화, React 19 지원, 캐싱 시맨틱 변경 등으로 개발·빌드 경험이 개선되었다.

---

## 핵심 개념

| 용어 | 의미 |
|------|------|
| **SSR** | Server-Side Rendering. 서버에서 HTML을 렌더링해 전달. SEO·초기 로딩에 유리 |
| **SSG** | Static Site Generation. 빌드 시점에 HTML 생성. 정적 콘텐츠에 적합 |
| **ISR** | Incremental Static Regeneration. SSG + 주기적 재생성 |
| **Server Actions** | 서버에서 실행되는 함수. 별도 API 라우트 없이 폼·뮤테이션 처리 |
| **App Router** | `app/` 디렉터리 기반 파일 라우팅. 레이아웃·스트리밍·병렬 로딩 지원 |
| **Turbopack** | Webpack 대체 번들러. 개발 서버·Fast Refresh 가속 |

---

## Next.js 15 주요 기능 (2024–2025)

### 1. 개발·빌드 성능

- **Turbopack Dev (Stable)**: `next dev --turbo`로 개발 서버 가속
  - 초기 라우트 컴파일 최대 45.8% 단축
  - Fast Refresh 최대 96.3% 단축
  - 로컬 서버 기동 최대 76.7% 단축
- **ESLint 9** 지원
- **next.config.ts**: TypeScript로 설정 작성 가능

### 2. React 19 및 렌더링

- **React 19** 기본 지원 (App Router)
- **React Compiler (실험)**: `useMemo`·`useCallback` 등 수동 메모이제이션 감소
- **Hydration 에러 개선**: 소스 코드와 해결 제안 표시
- **Async Request APIs**: `cookies()`, `headers()`, `params`, `searchParams` 등이 비동기로 전환 (codemod 제공)

### 3. 캐싱 시맨틱 (Breaking)

- `fetch`, GET Route Handlers, Client Router Cache가 **기본 비캐시**
- 이전 동작 유지: `dynamic = 'force-static'`, `staleTimes` 등으로 옵트인

### 4. Server Actions·폼

- **Server Actions 보안 강화**: 추측 불가능한 엔드포인트, 미사용 액션 제거
- **next/form**: 클라이언트 네비게이션과 함께 폼 처리

### 5. 기타

- **Partial Prerendering (PPR)**: 정적 + 스트리밍 조합으로 FCP 개선
- **unstable_after (실험)**: 응답 스트리밍 후 로깅·분석 등 후처리 실행
- **Static Route Indicator**: 개발 시 정적/동적 라우트 시각 표시
- **@next/codemod**: 업그레이드·마이그레이션 자동화

---

## Next.js vs Vite + React

### 비교 요약

| 항목 | Next.js 15 | Vite + React |
|------|------------|--------------|
| **초기 페인트** | <1s | 1–2s |
| **Time to Interactive** | 1–2s | 2–3s |
| **Lighthouse** | 95–100 | 85–95 |
| **번들 크기** | ~92KB | ~42KB |
| **개발 서버 기동** | 3–5초 | 1–2초 |
| **HMR** | 빠름 (Turbopack) | 매우 빠름 (ms 단위) |

### Next.js가 유리한 경우

- 이커머스, 마켓플레이스
- SEO가 중요한 콘텐츠 (블로그, 포트폴리오, 랜딩)
- API·DB를 프론트와 함께 두는 풀스택 앱
- 서버 사이드 로직이 필요한 SaaS

### Vite + React가 유리한 경우

- 관리자 대시보드, 내부 도구
- 로그인 뒤만 쓰는 앱 (SEO 불필요)
- 별도 백엔드(Express 등)와 분리된 프론트 전용 프로젝트
- PWA, SPA 중심 앱

---

## 프로젝트(myLittleWebsite) 컨텍스트

- **현재**: Vite + React (client) + Express (server) 분리 구조
- **Next.js 검토 시점**: SEO·풀스택 통합·Server Actions 도입을 고려할 때
- **마이그레이션**: [Next.js 공식 Vite 마이그레이션 가이드](https://nextjs.org/docs/app/guides/migrating/from-vite) 참고

---

## 참고

- [Next.js 15 공식 블로그](https://nextjs.org/blog/next-15)
- [Next.js 공식 문서](https://nextjs.org/docs)
- [Vite → Next.js 마이그레이션 가이드](https://nextjs.org/docs/app/guides/migrating/from-vite)
- [React 19 업그레이드 가이드](https://react.dev/blog/2024/04/25/react-19-upgrade-guide)
