# @tailwindcss/typography (Tailwind v4)

날짜: 2026-02-28

태그: [프론트, 도구]

## 요약

마크다운·블로그 본문에 `prose` 클래스로 일괄 스타일을 적용하는 Tailwind 플러그인.

## 핵심 개념

- **prose**: 제목, 단락, 리스트, 인용구, 코드 등 본문 요소에 적절한 여백·폰트·색상 적용
- **prose-neutral**, **prose-invert**: 색상 변형 (다크 모드용)

## Tailwind v4 설정

```css
@import 'tailwindcss';
@plugin '@tailwindcss/typography';
```

`tailwind.config.js` 없이 CSS에서 플러그인만 등록하면 됨.

## 사용 예

```tsx
<article className="prose prose-neutral dark:prose-invert max-w-none">
  <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
</article>
```

## 참고

- [tailwindcss-typography](https://github.com/tailwindlabs/tailwindcss-typography)
- 학습자료 문서 뷰어 (`LearningDocPage`)에서 사용
