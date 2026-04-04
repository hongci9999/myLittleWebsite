# youtube-transcript를 서버(tsx)에서 require로 로드

날짜: 2026-04-04  
태그: [ai, 백엔드, 도구, npm]

## 요약

`youtube-transcript` 패키지를 ESM `import { fetchTranscript } from 'youtube-transcript'`로 가져오면, tsx로 서버를 띄울 때 CJS main이 잡히며 named export 오류가 난다. `createRequire(import.meta.url)`로 CommonJS require 한 번 감싸 해결했다.

## 핵심 개념

- 패키지가 `exports`/`main`으로 CJS만 제공하면, 번들러·런타임에 따라 ESM named import가 실패할 수 있다.
- Node의 `module.createRequire`는 ESM 모듈 안에서도 해당 파일 기준으로 `require()`를 쓸 수 있게 한다.

## 상세 설명 (이해한 내용)

- 오류 예: `does not provide an export named 'fetchTranscript'`.
- `server/src/services/youtube-transcript-text.ts`에서 `const require = createRequire(import.meta.url)` 후 `require('youtube-transcript')`로 `fetchTranscript`만 꺼내 타입 단언으로 사용한다.

## 참고

- 의사결정·맥락: [decisions 0016](../decisions/0016-gemini-youtube-transcript-and-public-meta.md)
