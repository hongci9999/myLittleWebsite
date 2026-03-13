# GitHub Actions 개요

날짜: 2026-03-13
태그: [도구, 개발방법론, 백엔드]

## 요약

GitHub Actions는 GitHub 리포지토리에서 **CI/CD(지속적 통합·배포)** 와 **자동화 작업**을 실행하는 플랫폼이다. 워크플로 파일(YAML)로 트리거·작업을 정의하고, push·schedule·수동 실행 등으로 동작시킨다.

---

## 핵심 개념

| 개념 | 설명 |
|------|------|
| **Workflow** | `.github/workflows/*.yml` 파일. 전체 자동화 정의 |
| **Job** | 워크플로 내 실행 단위. 병렬 또는 순차 실행 가능 |
| **Step** | Job 내 개별 실행 단계. `run`, `uses` 등 |
| **Trigger** | 워크플로를 실행시키는 이벤트. `push`, `schedule`, `workflow_dispatch` 등 |
| **Secrets** | 암호·API 키 등 민감 정보. Settings → Secrets에서 설정 |

---

## 트리거 (on)

```yaml
on:
  push:
    branches: [main]
  schedule:
    - cron: '0 12 */5 * *'  # 5일마다 12:00 UTC
  workflow_dispatch: # 수동 실행 (Actions 탭에서 Run workflow)
```

### Cron 문법

| 필드 | 분 | 시 | 일 | 월 | 요일 |
|------|-----|-----|-----|-----|------|
| 예시 | 0 | 12 | */5 | * | * |

- `*/5`: 5 간격 (1, 6, 11, 16, 21, 26일)
- `0 12 * * *`: 매일 12:00 UTC
- [crontab.guru](https://crontab.guru/)로 검증 가능

---

## GitHub Secrets 상세

### 개요

GitHub Secrets는 **API 키, 비밀번호, 토큰** 등 민감 정보를 워크플로에 안전하게 전달하는 방법이다. 코드에 직접 넣지 않고 Settings에서 등록하면, 워크플로 실행 시 `${{ secrets.이름 }}`으로 참조할 수 있다.

### 종류

| 종류 | 범위 | 용도 |
|------|------|------|
| **Repository secrets** | 해당 리포지토리 모든 워크플로 | 일반적인 API 키, DB 연결 정보 등 |
| **Environment secrets** | 특정 Environment에 연결된 워크플로만 | production/staging 등 환경별로 다른 값 |
| **Organization secrets** | 조직 내 모든 리포지토리 | 팀 공통 인증 정보 |

대부분의 경우 **Repository secrets**만 사용하면 된다. Environment는 `jobs.xxx.environment: production`처럼 워크플로에서 지정할 때 쓰인다.

### 설정 방법

1. 리포지토리 **Settings** 이동
2. 왼쪽 **Secrets and variables** → **Actions** 클릭
3. **Repository secrets** 섹션에서 **New repository secret** 클릭
4. **Name**: 대문자·언더스코어 (예: `SUPABASE_URL`)
5. **Secret**: 값 입력 후 **Add secret**

한 번 저장하면 **값은 다시 볼 수 없다**. 수정하려면 기존 시크릿을 삭제하고 새로 추가해야 한다.

### 워크플로에서 사용

```yaml
steps:
  - name: Use secret
    run: |
      curl -H "Authorization: Bearer ${{ secrets.API_TOKEN }}" \
        "https://api.example.com/data"
```

- `${{ secrets.이름 }}` 형식으로 참조
- 로그에 출력되지 않음 (GitHub가 `***`로 마스킹)
- **주의**: `echo ${{ secrets.KEY }}`처럼 직접 출력하면 안 됨. 실수로 로그에 노출될 수 있음

### 보안 규칙

| 규칙 | 설명 |
|------|------|
| 커밋 금지 | `.env`, 하드코딩된 키는 절대 커밋하지 않음 |
| 최소 권한 | 필요한 시크릿만 등록. anon key로 충분하면 service role key 사용 금지 |
| 포크 제외 | 포크한 리포지토리에서는 원본 Repository secrets 사용 불가 (의도적) |
| 로그 검토 | 워크플로 로그에 시크릿이 노출되지 않았는지 확인 |

### 이 프로젝트 (Supabase Keep-Alive)

| Secret | 값 출처 | 용도 |
|--------|---------|------|
| `SUPABASE_URL` | Supabase 대시보드 → Project Settings → API → Project URL | REST API 엔드포인트 |
| `SUPABASE_ANON_KEY` | 같은 화면 → anon public | 인증 헤더 |

`server/.env`에 있는 값과 동일하다. 로컬 env는 Git에 커밋하지 않고, GitHub에는 Repository secrets로만 등록한다.

---

## 이 프로젝트에서의 사용

**Supabase Keep-Alive** (`.github/workflows/supabase-keepalive.yml`):

- **목적**: 7일 비활성 시 자동 정지되는 Supabase 무료 프로젝트 유지
- **방식**: 5일마다 `keepalive` 테이블 REST API 조회 → DB 활동 발생
- **필요 Secrets**: `SUPABASE_URL`, `SUPABASE_ANON_KEY`
- **설계**: `docs/plans/2026-03-13-supabase-keepalive-github-actions.md`

---

## 참고

- [GitHub Actions 문서](https://docs.github.com/ko/actions)
- [Encrypted secrets](https://docs.github.com/ko/actions/security-guides/encrypted-secrets)
- [Scheduled workflows](https://docs.github.com/ko/actions/using-workflows/events-that-trigger-workflows#schedule)
- 이 프로젝트: `.github/workflows/supabase-keepalive.yml`
