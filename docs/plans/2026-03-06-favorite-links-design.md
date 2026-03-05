# 즐겨찾기 링크 위젯 설계

- **날짜**: 2026-03-06
- **상태**: 채택

## 배경

유용한 링크 페이지에서 방문자가 링크를 즐겨찾기하고, 메인 페이지 위젯 영역에서 즐겨찾기한 링크를 확인할 수 있도록 한다.

## 결정

- **저장**: 방문자별 localStorage (`mlw-favorite-links`)
- **Links 페이지**: 각 링크 카드에 별 아이콘, 클릭 시 토글
- **메인 페이지**: Hero 아래 콘텐츠 영역 = 위젯 영역. 즐겨찾기 링크 위젯 표시
- **빈 상태**: "즐겨찾기 링크 없습니다" 문구 표시

## 구현 요약

1. `useFavoriteLinks` 훅: localStorage 읽기/쓰기, 리렌더 트리거
2. LinksPage: 링크 카드에 별 버튼 추가
3. MainPage: FavoriteLinksWidget (BentoCard 스타일), 빈 상태 메시지
