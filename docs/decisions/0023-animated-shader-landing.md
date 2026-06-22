# 랜딩 페이지 셰이더 오로라 배경 (three.js)

- **날짜**: 2026-06-22
- **상태**: 채택

## 배경 (왜 이 결정이 필요한가)

진입 페이지(`/`)는 텍스트 슬로건과 시작하기 버튼만 있는 정적인 화면이었다. 사이트의 첫인상을 담당하는 만큼, 학습·확장·인간중심이라는 정체성을 시각적으로도 전달할 임팩트가 필요했다. 외부에서 제공받은 GLSL 셰이더 배경 컴포넌트를 통합할지 결정해야 했다.

## 결정 (무엇으로 했는지)

- `three`를 사용한 GLSL 프래그먼트 셰이더 오로라 배경을 `client/src/components/ui/animated-shader-background.tsx`(shadcn UI 규약 경로)에 두고, 부모를 채우는 배경(`absolute inset-0`)으로 재사용 가능하게 했다.
- 랜딩 페이지를 셰이더 배경 + 비네트 오버레이 위에 슬로건·가치 칩(Reason-First / Always Extensible / For Humans)·CTA를 올린 글래스모피즘 레이아웃으로 재구성했다.
- 의존성으로 `three`, `lucide-react`(아이콘)를 추가하고, `index.css`에 `float` 키프레임을 더했다.

## 이유 (다른 선택지를 배제한 이유)

- **CSS 그라데이션/애니메이션만으로 처리**: 가볍지만 제공된 오로라 셰이더의 유기적인 흐름을 재현하기 어렵다. 학습 측면에서도 three.js·GLSL 경험이 남지 않는다.
- **이미지/동영상 배경**: 정적이거나 용량이 크고, 테마·반응형 대응이 떨어진다. 셰이더는 해상도에 맞춰 실시간 렌더된다.
- three.js는 번들이 가볍지 않지만, 셰이더가 진입 페이지에만 쓰이고 코드 분할로 다른 라우트에 영향이 없다는 점에서 수용했다.

## 결과/참고

- 컴포넌트는 props 없이 `useEffect`로 three.js 라이프사이클(렌더러 생성·resize·dispose)을 자체 관리한다. cleanup에서 `cancelAnimationFrame`·`dispose`로 메모리 누수를 방지한다.
- `Infinity` 아이콘은 전역 `Infinity`를 가려 eslint 경고가 나므로 `InfinityIcon`으로 alias 했다.
- 재사용 가능 배경이므로 추후 다른 섹션에서도 `className`만 넘겨 활용할 수 있다.
