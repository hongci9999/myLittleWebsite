# Feature-Sliced Design (기능 분할 설계)

날짜: 2026-02-23
태그: [프론트, 개발방법론, 아키텍처]

## 요약

Feature-Sliced Design(FSD)은 프런트엔드 아키텍처 방법론이다. 레이어·슬라이스·세그먼트로 코드를 분해하고, 공개 API로 캡슐화하여 모듈 간 느슨한 결합·높은 응집력·쉬운 확장을 목표로 한다. OOP의 추상화·캡슐화·상속 원칙을 프런트엔드 구조에 적용한 형태다.

---

## 핵심 개념

| 용어 | 의미 |
|------|------|
| **레이어 (Layer)** | 최상위 디렉터리. app → pages → widgets → features → entities → shared 순의 계층 구조. 위 레이어는 아래 레이어만 사용 가능 |
| **슬라이스 (Slice)** | 레이어 내 비즈니스 단위. 예: user, post, newsfeed |
| **세그먼트 (Segment)** | 슬라이스 내 목적별 폴더. api, ui, model, lib, config, consts |
| **공개 API** | index.ts 등 진입점. 슬라이스/세그먼트는 이 파일을 통해서만 외부에 노출 |

---

## 상세 설명 (이해한 내용)

### 1. 레이어 구조

각 레이어는 고유한 책임을 가지며, **아래로만 의존**한다.

| 레이어 | 역할 | 비고 |
|--------|------|------|
| **app** | 앱 진입점. 프로바이더, 라우터, 전역 스타일, 전역 타입 | 필수 |
| **processes** | 여러 페이지에 걸친 프로세스 (예: 회원가입) | 선택, 거의 사용 안 함 |
| **pages** | 애플리케이션 페이지 | 필수 |
| **widgets** | 페이지에서 쓰는 독립적인 UI 블록 | 필수 |
| **features** | 좋아요, 리뷰 작성 등 사용자 시나리오 | 선택 |
| **entities** | 사용자, 리뷰, 댓글 등 비즈니스 엔티티 | 선택 |
| **shared** | UI 키트, axios 설정, 헬퍼 등 재사용 코드 | 필수 |

- 아래 레이어일수록 추상화 수준이 높고 재사용성이 크다.
- 아래 레이어를 변경하면 위 레이어에 영향이 크므로, 변경 시 주의가 필요하다.

### 2. 슬라이스

슬라이스는 **비즈니스 도메인**에 따라 이름이 정해진다. 표준화된 이름은 없다.

- 사진 갤러리: photo, album, gallery
- SNS: post, user, newsfeed

밀접한 슬라이스는 디렉터리로 묶을 수 있으나, 격리 규칙은 유지해야 한다.

### 3. 디렉터리 구조 예시 (SNS 앱)

```
src/
├── app/                    # 앱 진입점
│   ├── providers/
│   ├── router/
│   └── index.tsx
│
├── pages/
│   ├── home/               # 슬라이스: home 페이지
│   │   ├── ui/
│   │   │   └── HomePage.tsx
│   │   └── index.ts
│   ├── post-detail/
│   │   ├── ui/
│   │   └── index.ts
│   └── profile/
│       ├── ui/
│       └── index.ts
│
├── widgets/
│   ├── post-card/          # 슬라이스: 게시물 카드 위젯
│   │   ├── ui/
│   │   │   └── PostCard.tsx
│   │   └── index.ts
│   └── header/
│       ├── ui/
│       └── index.ts
│
├── features/
│   ├── like-post/          # 슬라이스: 좋아요 기능
│   │   ├── api/
│   │   ├── model/
│   │   ├── ui/
│   │   │   └── LikeButton.tsx
│   │   └── index.ts
│   └── add-comment/
│       ├── api/
│       ├── model/
│       ├── ui/
│       └── index.ts
│
├── entities/
│   ├── user/               # 슬라이스: 사용자 엔티티
│   │   ├── api/
│   │   ├── model/
│   │   ├── ui/
│   │   │   └── UserAvatar.tsx
│   │   └── index.ts
│   └── post/
│       ├── api/
│       ├── model/
│       ├── ui/
│       └── index.ts
│
└── shared/
    ├── ui/                 # UI 키트, Button, Input 등
    ├── lib/                # axios, 유틸 함수
    └── config/
```

### 4. 세그먼트

슬라이스 내부를 목적별로 나눈다. 팀 합의에 따라 구성·이름을 바꿀 수 있다.

| 세그먼트 | 용도 |
|----------|------|
| **api** | 서버 요청 |
| **ui** | UI 컴포넌트 |
| **model** | 상태, actions, selectors |
| **lib** | 보조 기능 |
| **config** | 설정값 (거의 사용 안 함) |
| **consts** | 상수 |

### 5. 공개 API

- 각 슬라이스·세그먼트는 `index.ts`(또는 `index.js`)를 진입점으로 한다.
- 외부에서는 이 인덱스를 통해서만 import한다.
- 내부 구현은 격리되며, import 경로 변경 시 한 곳만 수정하면 된다.

**예시: import 경로**

```ts
// ✅ 좋음: 공개 API만 사용
import { PostCard } from '@/widgets/post-card';
import { LikeButton } from '@/features/like-post';
import { UserAvatar } from '@/entities/user';
import { Button } from '@/shared/ui';

// ❌ 피함: 내부 구현 직접 참조
import { PostCard } from '@/widgets/post-card/ui/PostCard';
import { likeApi } from '@/features/like-post/api/likeApi';
```

**예시: entities/post의 index.ts (공개 API)**

```ts
// entities/post/index.ts
export { PostCard } from './ui/PostCard';
export { usePost, postApi } from './model';
export type { Post } from './model/types';
```

### 6. FSD가 OOP 원칙을 적용하는 방식

| OOP 원칙 | FSD에서의 구현 |
|----------|----------------|
| **추상화·다형성** | 레이어. 낮은 레이어가 추상적이어서 위에서 재사용 가능 |
| **캡슐화** | 공개 API. 슬라이스/세그먼트 내부는 격리 |
| **상속** | 레이어. 위 레이어가 아래 레이어를 재사용 |

### 7. 장단점

**장점**

- 구성 요소 교체·추가·제거가 쉬움
- 아키텍처 표준화
- 확장성
- 기술 스택과 무관
- 모듈 간 연결이 명시적이고 제어 가능
- 비즈니스 지향

**단점**

- 진입 장벽이 있음
- 팀 문화·개념 준수 필요
- 문제를 미루지 않고 바로 해결해야 함

### 8. 의존 방향 예시

```
pages/home (HomePage)
  → widgets/post-card (PostCard)
  → widgets/header (Header)
  → features/like-post (LikeButton)
  → entities/post (Post 타입)
  → entities/user (UserAvatar)
  → shared/ui (Button)
```

`HomePage`는 `post-card` 위젯을 쓰고, `PostCard`는 `like-post` 피처와 `user` 엔티티를 쓴다. 모든 import는 위→아래 레이어로만 향한다.

### 9. Next.js와의 충돌

- **Pages**: Next.js `pages/`는 파일 기반 라우팅. FSD `pages`는 평면 목록. 해결: `src/pages/`에 FSD 페이지, 루트 `pages/`에 Next.js 라우팅을 두거나, `pages-flat`과 `pages`를 분리하는 방식 사용.
- **App**: Next.js가 앱 초기화를 담당. 전체 앱 레이아웃은 Layout 패턴으로 처리.

---

## 참고

- [(번역) 기능 분할 설계 - 최고의 프런트엔드 아키텍처](https://emewjin.github.io/feature-sliced-design/)
- [FSD 공식 문서](https://feature-sliced.design/)
- 예제: [Github Client](https://github.com/), [Nike Sneaker Store](https://www.nike.com/), [Sudoku](https://github.com/)
- 이 프로젝트의 foundation 원칙: reason-first, self-documentation, extensibility (FSD와 방향성 유사)
- **이 프로젝트 적용**: `docs/decisions/0004-fsd-application-strategy.md`, `.cursor/rules/stack-structure.mdc`
