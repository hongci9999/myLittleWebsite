# shadcn/ui 적용 내역 (이 프로젝트)

날짜: 2026-02-23
태그: [프론트, 도구]

## 요약

shadcn/ui를 Vite + React 프로젝트에 적용했다. `npx shadcn@latest init`을 실행하지 않고, 공식 문서를 참고해 설정 파일과 컴포넌트를 직접 작성했다.

---

## 1. 왜 이렇게 했는지

| 항목           | 설명                                                                        |
| -------------- | --------------------------------------------------------------------------- |
| **CLI 미사용** | `npx shadcn@latest init`은 대화형이라 자동화 어려움.                        |
| **수동 설정**  | components.json, utils, CSS 변수, Button 컴포넌트를 문서 기준으로 직접 작성 |

---

## 2. 단계별로 한 일

### 2-1. Tailwind CSS v4 설치

**목적**: shadcn/ui는 Tailwind로 스타일을 적용한다.

**한 일**:

- `tailwindcss`, `@tailwindcss/vite` 패키지 추가
- `vite.config.ts`에 `tailwindcss()` 플러그인 등록

```ts
// vite.config.ts
import tailwindcss from '@tailwindcss/vite'
plugins: [react(), tailwindcss()]
```

---

### 2-2. 경로 별칭 `@/` 설정

**목적**: `import { Button } from "@/components/ui/button"`처럼 `@/`로 `src/`를 참조한다.

**한 일**:

| 파일                | 변경 내용                                                  |
| ------------------- | ---------------------------------------------------------- |
| `vite.config.ts`    | `resolve.alias`: `"@": path.resolve(__dirname, "./src")`   |
| `tsconfig.json`     | `compilerOptions.baseUrl`, `paths: { "@/*": ["./src/*"] }` |
| `tsconfig.app.json` | 위와 동일 (IDE·타입 체크용)                                |

---

### 2-3. index.css — Tailwind + 테마 변수

**목적**: Tailwind를 불러오고, shadcn용 CSS 변수(테마)를 정의한다.

**한 일**:

1. **Tailwind 불러오기**

   ```css
   @import 'tailwindcss';
   ```

2. **`:root` (라이트 모드)**  
   `--background`, `--foreground`, `--primary`, `--border` 등 색상 변수 정의 (oklch 사용)

3. **`.dark` (다크 모드)**  
   같은 변수명에 다크용 값 정의

4. **`@theme inline`**  
   Tailwind v4에서 위 변수를 `bg-primary`, `text-foreground` 같은 유틸리티로 쓰기 위해 매핑

   ```css
   @theme inline {
     --color-background: var(--background);
     --color-primary: var(--primary);
     /* ... */
   }
   ```

5. **버튼 커서**  
   Tailwind v4는 버튼 기본 커서가 `default`라서, `cursor: pointer` 추가

6. **body 기본 스타일**  
   `background`, `color`를 테마 변수로 지정

---

### 2-4. components.json

**목적**: shadcn CLI가 이 파일을 읽고, `npx shadcn add <컴포넌트>` 실행 시 어디에 무엇을 넣을지 결정한다.

**한 일**:

- `client/components.json` 생성
- style: `new-york`, baseColor: `neutral`, css: `src/index.css`
- aliases: `@/components`, `@/lib/utils` 등

---

### 2-5. lib/utils.ts — cn() 함수

**목적**: Tailwind 클래스를 조건부로 합치고, 충돌 시 나중 클래스가 이기도록 한다.

**한 일**:

- `clsx` + `tailwind-merge`로 `cn()` 함수 구현
- shadcn 컴포넌트에서 `className={cn("base", variant, className)}` 형태로 사용

```ts
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

---

### 2-6. components/ui/button.tsx

**목적**: shadcn Button 컴포넌트를 프로젝트에 추가한다.

**한 일**:

- `@radix-ui/react-slot`: `asChild`일 때 자식 요소를 그대로 렌더 (예: Link를 버튼처럼)
- `class-variance-authority` (cva): variant/size별 Tailwind 클래스 정의
- `buttonVariants`: default, outline, ghost, destructive 등 variant, sm/lg/icon 등 size
- `Button`: `forwardRef`로 ref 전달, `Slot` 또는 `button` 렌더
- `buttonVariants` export: Link 등에 버튼 스타일을 쓸 때 사용
- `eslint-disable`: `buttonVariants`(함수)와 `Button`(컴포넌트)를 같이 export해서 react-refresh 규칙 위반 → 해당 라인만 예외 처리

---

### 2-7. package.json — 의존성

**추가한 패키지**:

| 패키지                     | 용도                                 |
| -------------------------- | ------------------------------------ |
| `tailwindcss`              | Tailwind CSS                         |
| `@tailwindcss/vite`        | Vite용 Tailwind 플러그인             |
| `@radix-ui/react-slot`     | Button의 `asChild` (자식으로 렌더)   |
| `class-variance-authority` | variant/size별 클래스 정의           |
| `clsx`                     | 조건부 클래스 합치기                 |
| `tailwind-merge`           | Tailwind 클래스 충돌 시 나중 것 우선 |

---

### 2-8. index.html

**한 일**:

- `html`에 `class="dark"` 추가 → 다크 테마 적용
- `lang="ko"`, `title="myLittleWebsite"` 변경

---

### 2-9. Layout, HomePage 수정

**한 일**:

- 기존 CSS 파일(`Layout.css`, `HomePage.css`) 삭제
- Tailwind 유틸 클래스로 대체: `bg-background`, `text-foreground`, `border-border` 등
- HomePage에 `<Button>`, `<Button variant="outline">` 사용

---

## 3. 파일 구조 (변경된 것만)

```
client/
├── components.json          # [추가] shadcn 설정
├── package.json             # [수정] 의존성 추가
├── vite.config.ts           # [수정] tailwindcss, @ alias
├── tsconfig.json            # [수정] baseUrl, paths
├── tsconfig.app.json        # [수정] baseUrl, paths
├── index.html               # [수정] class="dark", lang, title
└── src/
    ├── index.css            # [수정] Tailwind + 테마 변수
    ├── lib/
    │   └── utils.ts          # [추가] cn()
    └── components/
        └── ui/
            └── button.tsx   # [추가] Button
```

---

## 4. 사용 흐름

1. **테마 변수** (`index.css`)  
   `:root` / `.dark`에 `--primary`, `--background` 등 정의

2. **Tailwind 매핑** (`@theme inline`)  
   `bg-primary` → `var(--primary)` 사용

3. **Button**  
   `buttonVariants`로 variant/size별 `bg-primary`, `border-input` 등 적용

4. **페이지**  
   `<Button variant="outline">`처럼 사용

---

## 5. 추가 컴포넌트 넣을 때

```bash
npx shadcn@latest add card
npx shadcn@latest add input
```

CLI가 `components.json`을 보고 `src/components/ui/`에 파일을 추가하고, 필요한 Radix 패키지를 설치한다.

---

## 참고

- [shadcn/ui Vite 설치 가이드](https://ui.shadcn.com/docs/installation/vite)
- [shadcn/ui 테마](https://ui.shadcn.com/docs/theming)
- 이 프로젝트: `docs/decisions/0005-design-system-shadcn.md`
