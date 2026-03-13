# 로컬 AI: Ollama와 WebLLM

날짜: 2026-03-13
태그: [ai, 백엔드, 프론트, 도구]

## 요약

웹 앱에서 "내 디바이스/서버"에서 동작하는 AI를 쓰려면 **Ollama**(로컬 서버) 또는 **WebLLM**(브라우저 내)을 사용한다. 각각의 특성, 배포 시나리오, 사용법을 정리한다.

---

## 핵심 개념

### Ollama

- **역할**: 로컬에서 LLM을 실행하는 서버
- **주소**: 기본 `http://localhost:11434`
- **API**: OpenAI 호환 스타일의 `/api/generate`, `/api/chat` 등
- **모델**: `ollama pull <model>`로 다운로드 (Phi-3, Llama, Mistral 등)

### WebLLM

- **역할**: 브라우저에서 WebGPU로 LLM 추론
- **패키지**: `@mlc-ai/web-llm`
- **특징**: 서버 없음, 100% 클라이언트 사이드, 데이터 외부 전송 없음

---

## 상세 설명

### 1. Ollama 동작 방식

| 항목 | 내용 |
|------|------|
| **실행** | PC/서버에 Ollama 설치 후 백그라운드 실행 |
| **localhost** | `localhost`는 "현재 그 기기"를 가리킴 |
| **다른 PC** | A PC에서 Ollama 실행, B PC에서 접속 시 B PC의 localhost를 봄 → Ollama 없으면 연결 실패 |

**해결**: 서버에 Ollama를 두고, 백엔드가 `localhost:11434`로 호출하면, 클라이언트는 어느 PC에서 접속해도 우리 API만 호출하면 됨.

### 2. WebLLM 동작 방식

- 브라우저가 WebGPU로 모델 추론
- 첫 실행 시 모델 다운로드 (수백 MB~수 GB)
- WebGPU 미지원 브라우저에서는 제한적

### 3. 배포 시나리오 비교

| 시나리오 | Ollama 클라이언트 | Ollama 서버 | WebLLM |
|----------|-------------------|-------------|--------|
| 같은 PC에서만 사용 | ✅ | ✅ | ✅ |
| 다른 PC에서 접속 | ❌ | ✅ | ✅ |
| AWS EC2 배포 | - | ✅ | ✅ |
| 설치 없이 사용 | ❌ (Ollama 설치) | ❌ (서버에 설치) | ✅ |

### 4. Ollama CORS

- 브라우저에서 `fetch('http://localhost:11434/...')` 호출 시 origin이 다르면 CORS 차단
- **해결 A**: `OLLAMA_ORIGINS="*"` 또는 `"https://your-site.com"` 설정
- **해결 B**: 서버 프록시 — 클라이언트는 우리 API만 호출, 서버가 Ollama 호출 (권장)

### 5. Ollama API 예시

```bash
# 생성
curl http://localhost:11434/api/generate -d '{
  "model": "phi3:mini",
  "prompt": "한 줄로 답해: Figma는?",
  "stream": false
}'

# 채팅
curl http://localhost:11434/api/chat -d '{
  "model": "phi3:mini",
  "messages": [{"role": "user", "content": "안녕"}],
  "stream": false
}'
```

---

## 참고

- [plans/2026-03-13-links-ai-suggest-design.md](../plans/2026-03-13-links-ai-suggest-design.md) — 링크 AI 자동 설명·분류 설계
- [ollama.com](https://ollama.com) — Ollama 공식
- [WebLLM GitHub](https://github.com/mlc-ai/web-llm) — WebLLM
