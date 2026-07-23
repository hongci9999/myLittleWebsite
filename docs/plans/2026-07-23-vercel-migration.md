# AWS → Vercel 이전 실행 walkthrough

날짜: 2026-07-23
관련: [decisions/0025-vercel-single-hosting](../decisions/0025-vercel-single-hosting.md)

코드 준비(레포)는 완료됐다. 아래는 **콘솔에서 직접** 해야 하는 배포·도메인·정리 단계다.

## 0. 코드 변경 요약 (완료됨)

- `server/src/app.ts` — Express `app` export(리스닝 제외)
- `server/src/index.ts` — 로컬 dev용 `app.listen`만
- `api/index.ts` — Vercel 함수 진입점(`export default app`)
- `vercel.json` — build/output/rewrite/함수 설정 + `includeFiles: docs/learnings/**`
- `server/src/config/learning-sections.ts` — 프로젝트 루트 해석 cwd 폴백
- `.github/workflows/deploy-aws.yml` — 자동 트리거 제거(수동 전용)

## 1. Vercel 프로젝트 생성 (vercel-setup)

1. [vercel.com](https://vercel.com) → **Add New → Project** → GitHub `hongci9999/myLittleWebsite` Import.
2. 설정:
   - **Root Directory**: `./` (레포 루트)
   - **Framework Preset**: Vite (또는 Other) — `vercel.json`이 build/output을 지정하므로 자동 인식됨
   - Build Command / Output Directory / Install Command는 `vercel.json` 값 사용(각각 `npm run build -w client`, `client/dist`, 기본 `npm install`)
3. **Environment Variables** 등록 (Production + Preview). `server/.env`와 동일 값:
   - `SUPABASE_URL`, `SUPABASE_ANON_KEY`
   - `GEMINI_API_KEY` (또는 `GOOGLE_AI_API_KEY`), 필요 시 `GEMINI_MODEL`
   - 선택: `GEEKNEWS_RSS_URL`, `D2_HELLOWORLD_ATOM_URL`, `*_CACHE_TTL_MS`
   - **설정 금지**: `VITE_API_BASE_URL`(same-origin 유지), `CORS_ALLOWED_ORIGINS`, `LISTEN_HOST`, `PORT`
4. **Deploy** → `*.vercel.app` URL 확보.

### 검증 (배포 직후)

- `https://<프로젝트>.vercel.app/api/health` → `{"status":"ok"}`
- `https://<프로젝트>.vercel.app/main` — GeekNews·즐겨찾기 로드, 콘솔에 CORS/Mixed Content 없음
- 로그인·링크·타로 등 API 동작
- 학습 기록: 정적 섹션(정보처리기사/SQLD/CS) 문서 열람, `project-learning`(프로젝트 학습 노트) 트리·본문 확인 → `includeFiles` 동작 확인
- AI 채우기·youtube-transcript 등 느린 호출이 `maxDuration`(60s) 내 완료되는지 확인

## 2. 커스텀 도메인 연결 (domain-cutover)

1. Vercel 프로젝트 **Settings → Domains** → `mylittlewebsite.p-e.kr` 추가.
2. 내도메인.한국 관리 페이지에서 해당 호스트 **CNAME**을 기존 ALB → **`cname.vercel-dns.com`** 으로 변경.
   - 기존에도 CNAME(→ ALB)이라 값만 교체.
3. DNS 전파 후 Vercel이 TLS 자동 발급. `https://mylittlewebsite.p-e.kr/main` 확인.

> 주의: 이 호스트는 이전엔 **API 전용**이었다. 이제 사이트 전체가 이 도메인으로 서비스된다. 프론트 코드의 API 호출은 same-origin이라 도메인 변경과 무관하게 동작한다.

## 3. AWS 자원 정리 (retire-aws, 검증 완료 후)

Vercel이 안정적으로 동작하는 것을 확인한 뒤 순서대로 제거:

1. **CloudFront** 배포 `EAV5ODYEOW4VD` 비활성화 → 삭제
2. **S3** 프론트 버킷 `mylittlewebsite-dev-661596276927-ap-northeast-2-an` 및 EB 버전 버킷 정리
3. **Elastic Beanstalk** 환경 `MLWserver-env` → 애플리케이션 `MLWserver` 종료
4. **ACM** 인증서(서울, `mylittlewebsite.p-e.kr`) 삭제 (도메인이 Vercel로 넘어간 뒤)
5. **IAM** OIDC 역할 `github-actions-mylittlewebsite-deploy` 삭제
6. 레포에서 `.github/workflows/deploy-aws.yml`, `scripts/package-eb-bundle.sh` 삭제

## 알아둘 리스크

- **함수 실행 시간**: Gemini AI·youtube-transcript가 느리면 제한 초과 가능. `maxDuration: 60` 설정됨(Hobby 월 사용량 한도 유의).
- **인메모리 캐시**: geeknews/tech-blogs/d2 캐시는 콜드스타트마다 초기화(기능 정상, 캐시 효율만 저하).
- **ESM `.js` import**: `@vercel/node`(esbuild)가 `.ts`로 해석. 첫 배포에서 함수 빌드 성공 여부 확인.
