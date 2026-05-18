# 타로 위젯 배포 환경에서 카드 이미지 미표시

날짜: 2026-05-19

## 발생한 오류

메인 **오늘의 타로 운세** 위젯에서 카드 뒷면·앞면 이미지가 모두 깨진 아이콘으로 보였다. `alt` 텍스트(「타로 카드 뒷면」 등)만 표시되었다.

- **로컬** `npm run dev`: 정상
- **프로덕션**(CloudFront 등 `vite build` 산출물): 재현

## 원인

이미지 `src`가 Vite **개발 서버 전용** 절대 경로였다.

- `TarotCard.tsx`: `/src/widgets/TarotDailyWidget/assets/cards/back.png`
- `tarot-major.ts`: `/src/widgets/TarotDailyWidget/assets/cards/major/*.png`

`npm run dev`에서는 Vite가 `/src/...` 요청을 소스 파일로 서빙하지만, 빌드 후 `dist/`에는 해당 경로가 없다. 브라우저는 존재하지 않는 URL을 요청해 404가 난다.

## 수정 방법

Vite가 빌드 시 에셋을 해시 파일명으로 `dist/assets/`에 포함하도록 **`import.meta.url` + `new URL(상대경로, import.meta.url).href`** 패턴으로 변경했다.

| 파일 | 변경 요약 |
|------|-----------|
| `client/src/widgets/TarotDailyWidget/ui/TarotCard.tsx` | 뒷면 `back.png` |
| `client/src/widgets/TarotDailyWidget/model/tarot-major.ts` | 앞면 22장 — `majorCardImage(filename)` 헬퍼 |

```ts
// 예: tarot-major.ts
function majorCardImage(filename: string): string {
  return new URL(`../assets/cards/major/${filename}`, import.meta.url).href
}
```

빌드 후 `dist/assets/back-*.png`, `0-*.png` 등으로 번들되는 것을 `npm run build` 출력으로 확인했다.

## 결과/참고

- 배포본에서 타로 카드 이미지가 정상 로드된다.
- `localStorage` 타로 스냅샷은 카드 `id`만 저장하고 `imagePath`는 `TAROT_MAJOR_CARDS`에서 재구성하므로, 기존 저장 데이터와 충돌 없음.
- 같은 실수 방지: `src` 내부 이미지는 `/src/...` 문자열·`public` 없이 루트 절대 경로를 쓰지 말 것. 상세 패턴은 [learnings/0035](../learnings/0035-vite-src-asset-import-meta-url.md).
- 카드 PNG 용량이 크면(장당 수 MB) 초기 로딩이 무거울 수 있음 — WebP·리사이즈는 별도 개선 과제.
