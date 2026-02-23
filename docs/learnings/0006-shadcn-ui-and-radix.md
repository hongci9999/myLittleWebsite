# shadcn/ui와 Radix UI

날짜: 2026-02-23
태그: [프론트, 도구, ux]

## 요약

**shadcn/ui**는 copy-paste 방식의 React UI 컴포넌트 모음이다. npm 패키지가 아니라 코드를 프로젝트에 복사해 소유한다. **Radix UI**는 headless(스타일 없음) 프리미티브 라이브러리로, 접근성·키보드·포커스 관리 등 동작만 제공한다. shadcn/ui는 Radix를 기반으로 Tailwind 스타일을 입혀서 컴포넌트를 만든다.

---

## 핵심 개념

| 용어 | 의미 |
|------|------|
| **shadcn/ui** | Copy-paste 컴포넌트. Radix + Tailwind. 코드를 프로젝트에 복사해 소유 |
| **Radix UI** | Headless(스타일 없음) 프리미티브. 접근성·동작만 제공 |
| **Headless** | 스타일 없이 동작(마크업, 접근성, 키보드)만 제공 |
| **Copy-paste** | npm 패키지가 아니라 소스 코드를 프로젝트에 복사 |
| **asChild** | Radix 패턴. 자식 요소를 그대로 렌더해 스타일·동작을 위임 |

---

## 1. shadcn/ui

### 1-1. 무엇인가

- **개념**: React UI 컴포넌트 모음. **npm 패키지가 아니다**.
- **방식**: `npx shadcn add button` 실행 시 `src/components/ui/button.tsx`가 **프로젝트에 복사**된다.
- **결과**: 코드를 프로젝트가 소유한다. 수정·삭제·확장이 자유롭다.

### 1-2. 왜 copy-paste인가

| 기존 방식 (npm 패키지) | shadcn 방식 (copy-paste) |
|----------------------|--------------------------|
| `import { Button } from "some-lib"` | `import { Button } from "@/components/ui/button"` |
| 라이브러리 업데이트에 의존 | 프로젝트 내 코드만 수정 |
| 스타일 오버라이드가 어려움 | 소스 직접 수정 가능 |
| 번들에 라이브러리 포함 | 필요한 코드만 포함 (tree-shake 불필요) |

### 1-3. 스타일·동작의 출처

- **동작**: Radix UI (Dialog, Dropdown, Select 등)
- **스타일**: Tailwind CSS
- **구조**: Radix + Tailwind를 조합한 컴포넌트를 복사해 제공

### 1-4. 컴포넌트 예시

- Button, Card, Input, Select, Dialog, Dropdown Menu, Tabs, Tooltip 등
- shadcn 문서에서 `npx shadcn add <이름>`으로 추가

---

## 2. Radix UI

### 2-1. 무엇인가

- **개념**: **Headless** UI 프리미티브 라이브러리.
- **역할**: 스타일 없이 **동작·접근성·키보드·포커스**만 제공한다.
- **제작**: WorkOS (Modulz 팀)

### 2-2. Headless의 의미

- **Unstyled**: 기본 스타일이 없다. CSS를 직접 작성하거나 Tailwind 등으로 적용.
- **동작**: ARIA, role, focus 관리, 키보드 네비게이션 등은 Radix가 처리한다.

### 2-3. 주요 특징

| 특징 | 설명 |
|------|------|
| **Accessible** | WAI-ARIA 패턴 준수. aria, role, 포커스, 키보드 자동 처리 |
| **Unstyled** | 스타일 없음. 완전한 커스터마이징 |
| **Uncontrolled** | 기본적으로 uncontrolled. controlled도 지원 |
| **asChild** | `asChild` prop으로 자식 요소를 그대로 렌더. 스타일·동작 위임 |
| **Incremental** | 필요한 컴포넌트만 설치. `@radix-ui/react-dialog` 등 개별 패키지 |

### 2-4. 제공하는 것

- **마크업**: 시맨틱 HTML, ARIA 속성
- **동작**: 열림/닫힘, 포커스 트랩, ESC 키, 클릭 외부
- **키보드**: Tab, Enter, Escape, 화살표 등
- **접근성**: 스크린 리더, 키보드 네비게이션

### 2-5. 제공하지 않는 것

- **스타일**: 색, 크기, 레이아웃 등은 없음
- **디자인**: 디자인 시스템이 아님. 기반(primitive)만 제공

### 2-6. 컴포넌트 예시

- Accordion, Alert Dialog, Checkbox, Dialog, Dropdown Menu, Select, Slider, Switch, Tabs, Tooltip, Popover 등 30개 이상

---

## 3. shadcn/ui와 Radix UI의 관계

```
shadcn/ui = Radix UI(동작) + Tailwind(스타일) + copy-paste(소유)
```

| 구분 | Radix UI | shadcn/ui |
|------|----------|-----------|
| **역할** | 동작·접근성 | 동작 + 스타일 |
| **스타일** | 없음 | Tailwind |
| **배포** | npm 패키지 | copy-paste |
| **사용** | `import from "radix-ui"` | 프로젝트에 복사된 코드 |
| **커스터마이징** | 스타일 직접 작성 | 복사된 코드 수정 |

---

## 4. asChild 패턴

Radix의 `asChild`는 shadcn에서도 사용한다.

```tsx
// asChild 없음: <button> 렌더
<Button>클릭</Button>

// asChild: 자식(Link)을 그대로 렌더, Button 스타일·동작 적용
<Button asChild>
  <Link to="/about">about으로</Link>
</Button>
```

- `Slot` 컴포넌트: 자식의 props를 병합해 렌더
- `Link`가 `button`처럼 보이면서 라우팅 동작

---

## 5. 언제 뭘 쓰나

| 상황 | 선택 |
|------|------|
| **빠른 스타일드 UI** | shadcn/ui |
| **동작만 필요, 디자인 직접** | Radix UI |
| **커스터마이징 극대화** | Radix + 직접 스타일 |
| **Tailwind + 스타일드 컴포넌트** | shadcn/ui |

---

## 6. 학습 흐름

1. **shadcn/ui**: `npx shadcn add button` → `button.tsx` 열어서 Radix + Tailwind 조합 확인
2. **Radix**: [radix-ui.com](https://www.radix-ui.com/primitives/docs/overview/introduction) 문서에서 컴포넌트 구조·API 이해
3. **asChild**: Button, Link 조합 예제로 `asChild` 동작 이해

---

## 참고

- [shadcn/ui 공식 문서](https://ui.shadcn.com)
- [Radix UI Primitives 소개](https://www.radix-ui.com/primitives/docs/overview/introduction)
- [Radix UI Accessibility](https://www.radix-ui.com/primitives/docs/overview/accessibility)
- 이 프로젝트: `docs/learnings/0005-shadcn-ui-setup.md` (적용 내역)
