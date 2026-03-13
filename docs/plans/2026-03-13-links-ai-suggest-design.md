# 링크 AI 자동 설명·분류 설계

날짜: 2026-03-13

유용한 링크 등록 시 AI가 설명과 분류를 자동 추천하는 기능 설계. 로컬/서버 AI 옵션 검토 포함.

---

## 1. 목표

- **링크 등록 시**: URL과 제목만 입력하면 AI가 `description`, `valueIds`(분류)를 자동 추천
- **로컬 AI 우선**: 내 디바이스 또는 내 서버에서 동작하는 AI 사용 (프라이버시·비용)
- **확장성**: 나중에 AWS 등 클라우드 배포 시에도 동일 구조로 동작

---

## 2. 옵션 비교

### 2.1 WebLLM (브라우저 내 AI)

| 항목 | 내용 |
|------|------|
| **동작** | 브라우저에서 WebGPU로 LLM 실행 |
| **설치** | `@mlc-ai/web-llm` npm 패키지, 별도 설치 없음 |
| **장점** | 어느 PC에서 접속해도 동작, 배포 사이트에서 즉시 사용 |
| **단점** | 첫 실행 시 모델 다운로드(수백 MB~수 GB), WebGPU 필요, 저사양에서 느림 |

### 2.2 Ollama (클라이언트 → localhost)

| 항목 | 내용 |
|------|------|
| **동작** | PC에 Ollama 설치, `localhost:11434` API |
| **장점** | 더 큰 모델, 빠른 추론 |
| **단점** | **같은 PC에서만** 동작. B PC에서 접속 시 B PC의 localhost를 봄 → Ollama 없으면 실패 |
| **CORS** | 브라우저 직접 호출 시 `OLLAMA_ORIGINS` 설정 필요 |

### 2.3 Ollama (서버에서 실행)

| 항목 | 내용 |
|------|------|
| **동작** | 서버(VPS, EC2 등)에 Ollama 설치, 백엔드가 `localhost:11434` 호출 |
| **흐름** | 클라이언트 → 우리 API → 서버 내부 Ollama |
| **장점** | **어느 PC에서 접속해도** 동작, 클라이언트 단순화 |
| **단점** | 서버에 Ollama 설치·관리, 메모리·디스크 사용 |

### 2.4 추천

| 우선순위 | 방식 | 이유 |
|----------|------|------|
| 1 | **Ollama 서버** | 단순한 구조, AWS 등 클라우드 배포 시 그대로 사용 가능 |
| 2 | WebLLM | Ollama 없을 때 폴백, 또는 설치 없는 환경용 |

---

## 3. 배포 시나리오

### 3.1 로컬 개발

- 서버(Express)와 Ollama를 같은 PC에서 실행
- 백엔드 `fetch('http://localhost:11434/api/generate', ...)` 호출

### 3.2 AWS 등 클라우드

| 서비스 | Ollama 사용 | 비고 |
|--------|-------------|------|
| EC2 | ✅ | VM에 Ollama 설치 |
| Lightsail | ✅ | EC2와 유사 |
| ECS/EKS | ✅ | 컨테이너로 Ollama 실행 |
| Lambda | ❌ | 메모리·실행 시간 제한 |

- 서버와 Ollama가 같은 인스턴스에 있으면 구조 동일
- Ollama 포트(11434)는 외부 노출 금지, 우리 API만 공개

---

## 4. Ollama 사용법

### 4.1 설치

- **Windows**: [ollama.com](https://ollama.com) → Download for Windows
- **macOS**: `brew install ollama` 후 `ollama serve`
- **Linux**: `curl -fsSL https://ollama.com/install.sh | sh`

### 4.2 모델 다운로드

```bash
ollama pull phi3:mini      # 작은 모델, 4GB RAM 정도
ollama pull llama3.2:3b    # 대안
```

### 4.3 API 테스트

```bash
curl http://localhost:11434/api/generate -d '{
  "model": "phi3:mini",
  "prompt": "Figma는 무엇인가요? 한 줄로 답해주세요.",
  "stream": false
}'
```

### 4.4 추천 모델 (링크 설명·분류용)

| 모델 | 크기 | 특징 |
|------|------|------|
| phi3:mini | ~2GB | 빠르고 가벼움 |
| llama3.2:3b | ~2GB | 짧은 생성에 적합 |
| llama3.1:8b | ~4.5GB | 품질 좋음, RAM 8GB+ 권장 |

---

## 5. 구현 시 고려사항

### 5.1 입력

- URL + title만으로 설명·분류 생성
- (선택) URL 메타 스크래핑(og:description 등)으로 품질 향상 가능

### 5.2 분류 매칭

- AI가 "이미지 생성", "프론트엔드" 같은 label 반환
- `fetchDimensions()`로 가져온 `classification_values`와 매칭 → `valueIds` 변환

### 5.3 프롬프트 예시

```
URL: https://...
제목: Figma
사용 가능한 분류: [목적: 디자인-이미지생성, 개발-프론트엔드, ...] [종류: 웹서비스, API, ...]

JSON으로 반환: { "description": "한 줄 설명", "suggestedLabels": ["디자인", "웹서비스"] }
```

### 5.4 UX

- 링크 추가 폼에 "AI로 채우기" 버튼
- 클릭 시 AI 추천 → 폼에 채움 → 사용자가 수정·확인 후 저장

---

## 6. 아키텍처 (Ollama 서버 방식)

```
[클라이언트] -- POST /api/links/ai-suggest (url, title) --> [우리 서버]
                                                              |
                                                              v
                                              fetch('http://localhost:11434/api/generate')
                                                              |
                                                              v
                                                         [Ollama]
```

- 환경 변수: `OLLAMA_HOST` (기본 `http://localhost:11434`)
- Ollama 미설치 시: API 엔드포인트가 503 또는 에러 반환, 클라이언트는 수동 입력 유도

---

## 7. 참고

- [learnings/0018-local-ai-ollama-webllm.md](../learnings/0018-local-ai-ollama-webllm.md) — Ollama, WebLLM 기술 상세
- [plans/2026-03-03-links-admin-design.md](./2026-03-03-links-admin-design.md) — 링크 페이지 기존 설계
