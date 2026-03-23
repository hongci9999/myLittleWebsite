/**
 * 우측 사이드바 바로가기 (유용한 링크, AI 개발 도구, 학습 기록, 칼럼, 프로젝트)
 */
export const SIDEBAR_SHORTCUTS = [
  { path: '/links', label: '유용한 링크', icon: '◈' },
  { path: '/ai-dev-tools', label: 'AI 개발 도구', icon: '✦' },
  { path: '/learning', label: '학습 기록', icon: '◆' },
  { path: '/column', label: '칼럼', icon: '◇' },
  { path: '/project', label: '프로젝트', icon: '○' },
] as const;
