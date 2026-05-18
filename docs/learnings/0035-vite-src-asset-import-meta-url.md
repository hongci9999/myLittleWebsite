# Vite: src 내부 정적 이미지와 import.meta.url

날짜: 2026-05-19
태그: [프론트, 도구, 배포, 개발방법론]

## 요약

Vite + React에서 **컴포넌트 옆 `assets/` 폴더**의 PNG·SVG를 쓸 때, `/src/...` 같은 개발 서버 경로 문자열은 **프로덕션 빌드에서 404**가 난다. `import` 또는 `new URL(..., import.meta.url)`로 URL을 얻어야 빌드 산출물(`dist/assets/`)에 포함된다.

---

## 핵심 개념

| 방식 | 빌드 포함 | 전형적 용도 |
|------|-----------|-------------|
| `client/public/` + `/foo.png` | `dist` 루트에 **그대로 복사**(해시 없음) | favicon, `robots.txt`, URL이 고정이어야 하는 파일 |
| `import img from './x.png'` | 해시 파일명으로 번들 | TS/JS에서 URL 상수로 쓸 때 |
| `new URL('./x.png', import.meta.url).href` | 동일(정적 분석으로 수집) | 파일명을 배열·루프로 매핑할 때 |
| 문자열 `'/src/widgets/.../x.png'` | **포함 안 됨** — dev에서만 우연히 동작 | 사용 금지 |

---

## 상세 설명 (이해한 내용)

### 1. 왜 dev만 되는가

`vite dev`는 소스 트리를 그대로 노출해 `/src/...` 요청을 처리한다. `vite build`는 JS·CSS·**참조된** 에셋만 `dist/`로보낸다. 문자열 경로만 있고 import/`new URL`이 없으면 Rollup이 파일을 모른다.

### 2. 이 레포 사례 (타로 위젯)

- 자산 위치: `client/src/widgets/TarotDailyWidget/assets/cards/`
- 수정 전: `/src/widgets/TarotDailyWidget/assets/cards/...` → CloudFront 배포 시 깨짐
- 수정 후: `import.meta.url` 기준 상대 경로 → `dist/assets/back-CEAia13F.png` 등

에러 픽스: [error-fixes/0004](../error-fixes/0004-tarot-deploy-image-paths.md)

### 3. 패턴 선택 가이드

```ts
// 단일 파일 — import도 동일하게 동작
import backUrl from '../assets/cards/back.png'

// 여러 파일명을 데이터로 관리
function cardUrl(name: string) {
  return new URL(`../assets/cards/major/${name}`, import.meta.url).href
}
```

`public/projects/*.png`처럼 **설정 JSON에서 경로 문자열만** 쓰는 경우는 `public`이 맞다(프로젝트 페이지 스크린샷 등).

### 4. 배포 검증

1. `npm run build -w client` (또는 `client`에서 `npm run build`)
2. `dist/assets/`에 해당 이미지·해시 파일 존재 확인
3. `npm run preview`로 프로덕션 모드에서 UI 확인

AWS 배포 맥락: [0029](./0029-aws-static-frontend-vite-s3-cloudfront.md)

---

## 참고

- [Vite — Static Asset Handling](https://vite.dev/guide/assets.html)
- [error-fixes/0004](../error-fixes/0004-tarot-deploy-image-paths.md)
- 타로 위젯 설계: [plans/2026-04-08-tarot-daily-widget-design.md](../plans/2026-04-08-tarot-daily-widget-design.md)
