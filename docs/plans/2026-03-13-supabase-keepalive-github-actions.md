# Supabase Keep-Alive + GitHub Actions 설계

날짜: 2026-03-13

## 배경

Supabase 무료 티어는 7일간 활동이 없으면 프로젝트가 자동 일시 정지된다. 개발·학습용 프로젝트는 실제 트래픽이 적어 정지될 위험이 있다. GitHub Actions로 주기적으로 DB에 간단한 쿼리를 보내 활동을 유지한다.

## 접근 방식

| 방식 | 설명 | 선택 |
|------|------|------|
| **A. curl + REST API** | 워크플로에서 curl로 Supabase REST API 호출 | ✅ 채택 |
| B. Node.js 스크립트 | @supabase/supabase-js로 쿼리 실행 | - |

**선택 이유**: 의존성 없음, 설정 단순, 실행 빠름. `keepalive` 전용 테이블 사용.

## 설계

### 1. keepalive 테이블 (확장 버전)

Supabase SQL Editor에서 실행:

```sql
CREATE TABLE IF NOT EXISTS keepalive (
  id INT PRIMARY KEY DEFAULT 1,
  pinged_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO keepalive (id) VALUES (1) ON CONFLICT (id) DO UPDATE SET pinged_at = now();
```

- `id`: 고정 행 1개
- `pinged_at`: 마지막 ping 시각 (대시보드에서 확인 가능)

### 2. GitHub Actions 워크플로

- **파일**: `.github/workflows/supabase-keepalive.yml`
- **트리거**: cron `0 12 */5 * *` (매월 1, 6, 11, 16, 21, 26일 12:00 UTC)
- **동작**: `SUPABASE_URL`, `SUPABASE_ANON_KEY` Secrets로 REST API 호출
- **엔드포인트**: `GET {SUPABASE_URL}/rest/v1/keepalive?select=id&limit=1`

### 3. GitHub Secrets 설정

리포지토리 Settings → Secrets and variables → Actions에서:

| Secret | 설명 |
|--------|------|
| `SUPABASE_URL` | Project URL (예: https://xxx.supabase.co) |
| `SUPABASE_ANON_KEY` | anon public 키 |

## 결과

- 5일마다 DB 쿼리 발생 → 7일 비활성 타이머 초기화
- 무료 티어 유지하면서 자동 정지 방지
- 학습: `docs/learnings/0019-github-actions.md`
