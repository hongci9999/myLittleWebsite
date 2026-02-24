# 랜딩 페이지 & 메인 허브 구현 계획

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 스크롤 기반 랜딩 페이지와 카드 그리드 메인 허브를 구축하고, About/Portfolio/Blog 페이지를 추가한다.

**Architecture:** `/`는 랜딩(표어 3문장 스크롤 리빌 + 홈 버튼), `/main`은 카드 허브. Intersection Observer로 의존성 없이 애니메이션. 페이지 목록은 config로 중앙화해 확장 가능하게.

**Tech Stack:** React, React Router, Tailwind CSS, shadcn/ui (Button, Card), TypeScript

---

## Task 1: 네비게이션 config

**Files:**
- Create: `client/src/shared/config/nav.ts`

**Step 1: Create nav config**

```ts
// client/src/shared/config/nav.ts
export const MAIN_NAV = [
  { path: '/about', label: 'About', description: '소개' },
  { path: '/portfolio', label: 'Portfolio', description: '포트폴리오' },
  { path: '/blog', label: 'Blog', description: '기술 블로그' },
] as const;
```

**Step 2: Commit**

```bash
git add client/src/shared/config/nav.ts
git commit -m "feat: add nav config for main hub"
```

---

## Task 2: ScrollReveal 훅 (Intersection Observer)

**Files:**
- Create: `client/src/shared/hooks/useScrollReveal.ts`

**Step 1: Create hook**

```ts
// client/src/shared/hooks/useScrollReveal.ts
import { useEffect, useRef, useState } from 'react';

export function useScrollReveal(threshold = 0.2) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isVisible };
}
```

**Step 2: Commit**

```bash
git add client/src/shared/hooks/useScrollReveal.ts
git commit -m "feat: add useScrollReveal hook for scroll-based animation"
```

---

## Task 3: LandingPage

**Files:**
- Create: `client/src/pages/LandingPage.tsx`

**Step 1: Create LandingPage**

```tsx
// client/src/pages/LandingPage.tsx
import { Link } from 'react-router-dom';
import { useScrollReveal } from '@/shared/hooks/useScrollReveal';
import { Button } from '@/components/ui/button';

const PHRASES = [
  '끊임없이 배워나가는',
  '끝없이 확장해나가는',
  '결국 인간을 위하는 개발자',
];

function RevealSection({ phrase, delay = 0 }: { phrase: string; delay?: number }) {
  const { ref, isVisible } = useScrollReveal(0.2);

  return (
    <section
      ref={ref}
      className="min-h-[80vh] flex items-center justify-center px-4 transition-all duration-700 ease-out"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(24px)',
        transitionDelay: `${delay}ms`,
      }}
    >
      <p className="text-2xl md:text-4xl font-medium text-center max-w-2xl">
        {phrase}
      </p>
    </section>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-svh bg-background text-foreground font-sans">
      {PHRASES.map((phrase, i) => (
        <RevealSection key={phrase} phrase={phrase} delay={i * 100} />
      ))}
      <section className="min-h-[80vh] flex items-center justify-center px-4">
        <Button asChild size="lg">
          <Link to="/main">홈</Link>
        </Button>
      </section>
    </div>
  );
}
```

**Step 2: Verify**

Run: `npm run dev -w client`
Expected: Landing at / shows scroll animation, Home button goes to /main

**Step 3: Commit**

```bash
git add client/src/pages/LandingPage.tsx
git commit -m "feat: add LandingPage with scroll reveal and home button"
```

---

## Task 4: MainPage (허브 카드 그리드)

**Files:**
- Create: `client/src/pages/MainPage.tsx`
- Modify: `client/src/components/Layout.tsx` (Link to main if needed)
- Add: shadcn Card if not present

**Step 1: Add Card component**

Run: `cd client && npx shadcn@latest add card --yes`

**Step 2: Create MainPage**

```tsx
// client/src/pages/MainPage.tsx
import { Link } from 'react-router-dom';
import { MAIN_NAV } from '@/shared/config/nav';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function MainPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-3xl font-bold mb-2">myLittleWebsite</h1>
      <p className="text-muted-foreground mb-8">
        자료 정리, 포트폴리오, 기술 학습을 위한 개인 웹사이트
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MAIN_NAV.map(({ path, label, description }) => (
          <Card key={path} className="hover:border-primary/50 transition-colors">
            <CardHeader>
              <CardTitle>{label}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="secondary">
                <Link to={path}>이동</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

**Step 3: Update Layout**

Layout header Link: change `to="/"` to `to="/main"` (or keep "/" and add logic - but Landing is at / so "/" would be landing. Main is at /main. So header should link to /main for "home" of the site.)

Actually: when user is on /main, /about, etc., the header "myLittleWebsite" should go to /main (hub). So `to="/main"`.

**Step 4: Commit**

```bash
git add client/src/pages/MainPage.tsx client/src/components/Layout.tsx
git commit -m "feat: add MainPage hub with card grid"
```

---

## Task 5: 플레이스홀더 페이지 (About, Portfolio, Blog)

**Files:**
- Create: `client/src/pages/AboutPage.tsx`
- Create: `client/src/pages/PortfolioPage.tsx`
- Create: `client/src/pages/BlogPage.tsx`

**Step 1: Create placeholder pages**

```tsx
// AboutPage.tsx
export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <h1 className="text-3xl font-bold mb-4">About</h1>
      <p className="text-muted-foreground">준비 중입니다.</p>
    </div>
  );
}
```

Same pattern for PortfolioPage and BlogPage (change title).

**Step 2: Commit**

```bash
git add client/src/pages/AboutPage.tsx client/src/pages/PortfolioPage.tsx client/src/pages/BlogPage.tsx
git commit -m "feat: add placeholder pages for About, Portfolio, Blog"
```

---

## Task 6: Layout 네비게이션 및 진입점 수정

**Files:**
- Modify: `client/src/App.tsx` (ensure Landing has no Layout)
- Modify: `client/src/components/Layout.tsx` (Link to /main, add nav links)

**Step 1: Update App.tsx routes**

Current: Layout wraps index at /. We need Landing at / without Layout.

```tsx
<Routes>
  <Route path="/" element={<LandingPage />} />
  <Route element={<Layout />}>
    <Route path="main" element={<MainPage />} />
    <Route path="about" element={<AboutPage />} />
    <Route path="portfolio" element={<PortfolioPage />} />
    <Route path="blog" element={<BlogPage />} />
  </Route>
</Routes>
```

**Step 2: Update Layout**

- Logo/brand: `to="/main"`
- Add nav links: Main, About, Portfolio, Blog (optional)

**Step 3: Commit**

```bash
git add client/src/App.tsx client/src/components/Layout.tsx
git commit -m "feat: wire Landing without Layout, Layout nav to /main"
```

---

## Task 7: Verification & CHANGELOG

**Step 1: Run build**

```bash
npm run build
```

Expected: Success

**Step 2: Update CHANGELOG**

```markdown
## [Unreleased]
### Added
- 랜딩 페이지: 스크롤 기반 표어 애니메이션, 홈 버튼
- 메인 허브: About/Portfolio/Blog 카드 그리드
- 플레이스홀더 페이지 (About, Portfolio, Blog)
```

**Step 3: Commit**

```bash
git add docs/CHANGELOG.md
git commit -m "docs: update CHANGELOG for landing and main hub"
```

---

## Execution Handoff

Plan complete and saved to `docs/plans/2026-02-25-landing-and-main.md`.

Two execution options:

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

Which approach?
