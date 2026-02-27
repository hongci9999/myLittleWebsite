/**
 * 디자인 결정용 플레이그라운드 (임시 - 결정 후 삭제)
 * 폰트, 색상 테마, 컴포넌트 스타일을 비교·결정
 * 스타일은 전역과 분리되어 독립적으로 동작
 */
import { useState } from 'react'
import './design-playground.css'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

// 본문 폰트 옵션
const FONTS = [
  { id: 'system', name: '시스템 기본', fontFamily: 'system-ui, sans-serif' },
  { id: 'pretendard', name: 'Pretendard', fontFamily: '"Pretendard", system-ui, sans-serif' },
  { id: 'noto', name: 'Noto Sans KR', fontFamily: '"Noto Sans KR", sans-serif' },
  { id: 'nanum', name: '나눔고딕', fontFamily: '"Nanum Gothic", sans-serif' },
  { id: 'geist', name: 'Geist', fontFamily: '"Geist", system-ui, sans-serif' },
  { id: 'inter', name: 'Inter', fontFamily: '"Inter", system-ui, sans-serif' },
  { id: 'spoqa', name: 'Spoqa Han Sans', fontFamily: '"Spoqa Han Sans Neo", sans-serif' },
] as const

// 코드 폰트 옵션 (모노스페이스)
const CODE_FONTS = [
  { id: 'system-mono', name: '시스템 모노', fontFamily: 'ui-monospace, "Cascadia Code", "Source Code Pro", Menlo, monospace' },
  { id: 'consolas', name: 'Consolas', fontFamily: 'Consolas, "Courier New", monospace' },
  { id: 'fira', name: 'Fira Code', fontFamily: '"Fira Code", monospace' },
  { id: 'jetbrains', name: 'JetBrains Mono', fontFamily: '"JetBrains Mono", monospace' },
  { id: 'geist-mono', name: 'Geist Mono', fontFamily: '"Geist Mono", monospace' },
  { id: 'victor', name: 'Victor Mono', fontFamily: '"Victor Mono", monospace' },
  { id: 'source-code', name: 'Source Code Pro', fontFamily: '"Source Code Pro", monospace' },
  { id: 'cascadia', name: 'Cascadia Code', fontFamily: '"Cascadia Code", monospace' },
] as const

const CODE_SAMPLE = `function greet(name: string) {
  return \`Hello, \${name}!\`;
}

const result = greet("myLittleWebsite");
console.log(result); // Hello, myLittleWebsite!`

/** 미리보기 컴포넌트에 모서리 선택 반영 (--radius CSS 변수) */
const PREVIEW_RADIUS = 'rounded-[var(--radius)]'

// 색상 테마 (CSS 변수 오버라이드)
const THEMES: Record<string, Record<string, string>> = {
  light: {
    '--background': 'oklch(0.99 0 0)',
    '--foreground': 'oklch(0.15 0 0)',
    '--primary': 'oklch(0.25 0 0)',
    '--primary-foreground': 'oklch(0.98 0 0)',
    '--muted': 'oklch(0.96 0 0)',
    '--muted-foreground': 'oklch(0.5 0 0)',
    '--border': 'oklch(0.9 0 0)',
    '--card': 'oklch(1 0 0)',
    '--accent': 'oklch(0.95 0 0)',
  },
  dark: {
    '--background': 'oklch(0.12 0.01 260)',
    '--foreground': 'oklch(0.95 0 0)',
    '--primary': 'oklch(0.7 0.15 260)',
    '--primary-foreground': 'oklch(0.12 0 0)',
    '--muted': 'oklch(0.22 0.01 260)',
    '--muted-foreground': 'oklch(0.7 0 0)',
    '--border': 'oklch(0.28 0.01 260)',
    '--card': 'oklch(0.16 0.01 260)',
    '--card-foreground': 'oklch(0.95 0 0)',
    '--popover': 'oklch(0.16 0.01 260)',
    '--popover-foreground': 'oklch(0.95 0 0)',
    '--accent': 'oklch(0.22 0.02 260)',
    '--accent-foreground': 'oklch(0.95 0 0)',
  },
  warm: {
    '--background': 'oklch(0.98 0.01 85)',
    '--foreground': 'oklch(0.25 0.03 50)',
    '--primary': 'oklch(0.55 0.18 45)',
    '--primary-foreground': 'oklch(0.98 0 0)',
    '--muted': 'oklch(0.95 0.02 85)',
    '--muted-foreground': 'oklch(0.45 0.04 50)',
    '--border': 'oklch(0.88 0.02 85)',
    '--card': 'oklch(1 0.005 85)',
    '--accent': 'oklch(0.93 0.03 85)',
  },
  cool: {
    '--background': 'oklch(0.98 0.01 240)',
    '--foreground': 'oklch(0.2 0.02 240)',
    '--primary': 'oklch(0.5 0.2 250)',
    '--primary-foreground': 'oklch(0.98 0 0)',
    '--muted': 'oklch(0.94 0.02 240)',
    '--muted-foreground': 'oklch(0.5 0.02 240)',
    '--border': 'oklch(0.88 0.02 240)',
    '--card': 'oklch(1 0.005 240)',
    '--accent': 'oklch(0.93 0.03 240)',
  },
  forest: {
    '--background': 'oklch(0.97 0.02 145)',
    '--foreground': 'oklch(0.2 0.04 145)',
    '--primary': 'oklch(0.45 0.15 155)',
    '--primary-foreground': 'oklch(0.98 0 0)',
    '--muted': 'oklch(0.92 0.03 145)',
    '--muted-foreground': 'oklch(0.45 0.04 145)',
    '--border': 'oklch(0.85 0.03 145)',
    '--card': 'oklch(0.99 0.01 145)',
    '--accent': 'oklch(0.9 0.04 145)',
  },
  // 두 가지 색 (primary + secondary, accent는 secondary 연한 톤)
  'blue-orange': {
    '--background': 'oklch(0.98 0.01 250)',
    '--foreground': 'oklch(0.2 0.02 250)',
    '--primary': 'oklch(0.5 0.2 250)',
    '--primary-foreground': 'oklch(0.98 0 0)',
    '--secondary': 'oklch(0.75 0.15 55)',
    '--secondary-foreground': 'oklch(0.2 0 0)',
    '--muted': 'oklch(0.94 0.02 250)',
    '--muted-foreground': 'oklch(0.5 0.02 250)',
    '--border': 'oklch(0.88 0.02 250)',
    '--card': 'oklch(1 0.005 250)',
    '--accent': 'oklch(0.92 0.06 55)',
  },
  'purple-teal': {
    '--background': 'oklch(0.98 0.01 280)',
    '--foreground': 'oklch(0.25 0.03 280)',
    '--primary': 'oklch(0.5 0.2 280)',
    '--primary-foreground': 'oklch(0.98 0 0)',
    '--secondary': 'oklch(0.6 0.12 185)',
    '--secondary-foreground': 'oklch(0.98 0 0)',
    '--muted': 'oklch(0.94 0.02 280)',
    '--muted-foreground': 'oklch(0.5 0.03 280)',
    '--border': 'oklch(0.88 0.02 280)',
    '--card': 'oklch(1 0.005 280)',
    '--accent': 'oklch(0.9 0.05 185)',
  },
  'rose-indigo': {
    '--background': 'oklch(0.98 0.01 350)',
    '--foreground': 'oklch(0.25 0.04 350)',
    '--primary': 'oklch(0.55 0.2 350)',
    '--primary-foreground': 'oklch(0.98 0 0)',
    '--secondary': 'oklch(0.55 0.2 270)',
    '--secondary-foreground': 'oklch(0.98 0 0)',
    '--muted': 'oklch(0.95 0.02 350)',
    '--muted-foreground': 'oklch(0.5 0.03 350)',
    '--border': 'oklch(0.9 0.02 350)',
    '--card': 'oklch(1 0.005 350)',
    '--accent': 'oklch(0.92 0.08 270)',
  },
  'amber-cyan': {
    '--background': 'oklch(0.98 0.02 85)',
    '--foreground': 'oklch(0.25 0.04 85)',
    '--primary': 'oklch(0.65 0.18 75)',
    '--primary-foreground': 'oklch(0.15 0 0)',
    '--secondary': 'oklch(0.6 0.12 195)',
    '--secondary-foreground': 'oklch(0.98 0 0)',
    '--muted': 'oklch(0.95 0.03 85)',
    '--muted-foreground': 'oklch(0.45 0.04 85)',
    '--border': 'oklch(0.9 0.03 85)',
    '--card': 'oklch(1 0.01 85)',
    '--accent': 'oklch(0.9 0.05 195)',
  },
  // 추가 추천
  slate: {
    '--background': 'oklch(0.98 0.005 250)',
    '--foreground': 'oklch(0.2 0.02 250)',
    '--primary': 'oklch(0.4 0.03 250)',
    '--primary-foreground': 'oklch(0.98 0 0)',
    '--muted': 'oklch(0.95 0.01 250)',
    '--muted-foreground': 'oklch(0.5 0.02 250)',
    '--border': 'oklch(0.9 0.01 250)',
    '--card': 'oklch(1 0.005 250)',
    '--accent': 'oklch(0.93 0.02 250)',
  },
  olive: {
    '--background': 'oklch(0.97 0.02 120)',
    '--foreground': 'oklch(0.25 0.04 120)',
    '--primary': 'oklch(0.45 0.12 130)',
    '--primary-foreground': 'oklch(0.98 0 0)',
    '--muted': 'oklch(0.92 0.03 120)',
    '--muted-foreground': 'oklch(0.45 0.04 120)',
    '--border': 'oklch(0.85 0.03 120)',
    '--card': 'oklch(0.99 0.01 120)',
    '--accent': 'oklch(0.9 0.05 120)',
  },
  sunset: {
    '--background': 'oklch(0.98 0.02 30)',
    '--foreground': 'oklch(0.3 0.05 30)',
    '--primary': 'oklch(0.6 0.2 25)',
    '--primary-foreground': 'oklch(0.98 0 0)',
    '--muted': 'oklch(0.95 0.03 30)',
    '--muted-foreground': 'oklch(0.5 0.04 30)',
    '--border': 'oklch(0.9 0.03 30)',
    '--card': 'oklch(1 0.01 30)',
    '--accent': 'oklch(0.92 0.06 30)',
  },
  midnight: {
    '--background': 'oklch(0.14 0.02 265)',
    '--foreground': 'oklch(0.95 0 0)',
    '--primary': 'oklch(0.65 0.2 265)',
    '--primary-foreground': 'oklch(0.12 0 0)',
    '--muted': 'oklch(0.25 0.02 265)',
    '--muted-foreground': 'oklch(0.7 0 0)',
    '--border': 'oklch(0.3 0.02 265)',
    '--card': 'oklch(0.18 0.02 265)',
    '--card-foreground': 'oklch(0.95 0 0)',
    '--popover': 'oklch(0.18 0.02 265)',
    '--popover-foreground': 'oklch(0.95 0 0)',
    '--accent': 'oklch(0.3 0.05 265)',
    '--accent-foreground': 'oklch(0.95 0 0)',
  },
  sage: {
    '--background': 'oklch(0.97 0.015 150)',
    '--foreground': 'oklch(0.25 0.03 150)',
    '--primary': 'oklch(0.5 0.1 160)',
    '--primary-foreground': 'oklch(0.98 0 0)',
    '--muted': 'oklch(0.93 0.02 150)',
    '--muted-foreground': 'oklch(0.45 0.03 150)',
    '--border': 'oklch(0.88 0.02 150)',
    '--card': 'oklch(0.99 0.01 150)',
    '--accent': 'oklch(0.9 0.04 150)',
  },
  'coral-mint': {
    '--background': 'oklch(0.98 0.01 350)',
    '--foreground': 'oklch(0.25 0.04 350)',
    '--primary': 'oklch(0.65 0.18 25)',
    '--primary-foreground': 'oklch(0.98 0 0)',
    '--secondary': 'oklch(0.7 0.1 165)',
    '--secondary-foreground': 'oklch(0.2 0 0)',
    '--muted': 'oklch(0.95 0.02 350)',
    '--muted-foreground': 'oklch(0.5 0.03 350)',
    '--border': 'oklch(0.9 0.02 350)',
    '--card': 'oklch(1 0.005 350)',
    '--accent': 'oklch(0.92 0.05 165)',
  },
  'navy-gold': {
    '--background': 'oklch(0.97 0.02 260)',
    '--foreground': 'oklch(0.25 0.03 260)',
    '--primary': 'oklch(0.35 0.12 260)',
    '--primary-foreground': 'oklch(0.98 0 0)',
    '--secondary': 'oklch(0.7 0.15 85)',
    '--secondary-foreground': 'oklch(0.2 0 0)',
    '--muted': 'oklch(0.93 0.02 260)',
    '--muted-foreground': 'oklch(0.5 0.02 260)',
    '--border': 'oklch(0.88 0.02 260)',
    '--card': 'oklch(1 0.005 260)',
    '--accent': 'oklch(0.92 0.06 85)',
  },
  'navy-cyan': {
    '--background': 'oklch(0.97 0.02 260)',
    '--foreground': 'oklch(0.25 0.03 260)',
    '--primary': 'oklch(0.4 0.12 260)',
    '--primary-foreground': 'oklch(0.98 0 0)',
    '--secondary': 'oklch(0.6 0.12 195)',
    '--secondary-foreground': 'oklch(0.98 0 0)',
    '--muted': 'oklch(0.93 0.02 260)',
    '--muted-foreground': 'oklch(0.5 0.02 260)',
    '--border': 'oklch(0.88 0.02 260)',
    '--card': 'oklch(1 0.005 260)',
    '--accent': 'oklch(0.9 0.05 195)',
  },
  'navy-rose': {
    '--background': 'oklch(0.97 0.02 260)',
    '--foreground': 'oklch(0.25 0.03 260)',
    '--primary': 'oklch(0.4 0.12 260)',
    '--primary-foreground': 'oklch(0.98 0 0)',
    '--secondary': 'oklch(0.6 0.18 350)',
    '--secondary-foreground': 'oklch(0.98 0 0)',
    '--muted': 'oklch(0.93 0.02 260)',
    '--muted-foreground': 'oklch(0.5 0.02 260)',
    '--border': 'oklch(0.88 0.02 260)',
    '--card': 'oklch(1 0.005 260)',
    '--accent': 'oklch(0.92 0.06 350)',
  },
  'navy-light': {
    '--background': 'oklch(0.98 0.015 260)',
    '--foreground': 'oklch(0.3 0.03 260)',
    '--primary': 'oklch(0.45 0.1 260)',
    '--primary-foreground': 'oklch(0.98 0 0)',
    '--muted': 'oklch(0.95 0.02 260)',
    '--muted-foreground': 'oklch(0.5 0.02 260)',
    '--border': 'oklch(0.9 0.02 260)',
    '--card': 'oklch(1 0.005 260)',
    '--accent': 'oklch(0.93 0.03 260)',
  },
  'navy-deep': {
    '--background': 'oklch(0.1 0.02 265)',
    '--foreground': 'oklch(0.95 0 0)',
    '--primary': 'oklch(0.7 0.15 265)',
    '--primary-foreground': 'oklch(0.1 0 0)',
    '--muted': 'oklch(0.22 0.02 265)',
    '--muted-foreground': 'oklch(0.7 0 0)',
    '--border': 'oklch(0.28 0.02 265)',
    '--card': 'oklch(0.14 0.02 265)',
    '--card-foreground': 'oklch(0.95 0 0)',
    '--popover': 'oklch(0.14 0.02 265)',
    '--popover-foreground': 'oklch(0.95 0 0)',
    '--accent': 'oklch(0.28 0.05 265)',
    '--accent-foreground': 'oklch(0.95 0 0)',
  },
  // 다크모드 추가
  'dark-warm': {
    '--background': 'oklch(0.13 0.02 50)',
    '--foreground': 'oklch(0.95 0 0)',
    '--primary': 'oklch(0.7 0.15 55)',
    '--primary-foreground': 'oklch(0.12 0 0)',
    '--muted': 'oklch(0.24 0.02 50)',
    '--muted-foreground': 'oklch(0.7 0 0)',
    '--border': 'oklch(0.3 0.02 50)',
    '--card': 'oklch(0.16 0.02 50)',
    '--card-foreground': 'oklch(0.95 0 0)',
    '--popover': 'oklch(0.16 0.02 50)',
    '--popover-foreground': 'oklch(0.95 0 0)',
    '--accent': 'oklch(0.3 0.05 50)',
    '--accent-foreground': 'oklch(0.95 0 0)',
  },
  'dark-forest': {
    '--background': 'oklch(0.11 0.02 155)',
    '--foreground': 'oklch(0.95 0 0)',
    '--primary': 'oklch(0.65 0.15 155)',
    '--primary-foreground': 'oklch(0.1 0 0)',
    '--muted': 'oklch(0.22 0.02 155)',
    '--muted-foreground': 'oklch(0.7 0 0)',
    '--border': 'oklch(0.28 0.02 155)',
    '--card': 'oklch(0.14 0.02 155)',
    '--card-foreground': 'oklch(0.95 0 0)',
    '--popover': 'oklch(0.14 0.02 155)',
    '--popover-foreground': 'oklch(0.95 0 0)',
    '--accent': 'oklch(0.28 0.05 155)',
    '--accent-foreground': 'oklch(0.95 0 0)',
  },
  'dark-rose': {
    '--background': 'oklch(0.12 0.02 350)',
    '--foreground': 'oklch(0.95 0 0)',
    '--primary': 'oklch(0.65 0.18 350)',
    '--primary-foreground': 'oklch(0.12 0 0)',
    '--muted': 'oklch(0.24 0.02 350)',
    '--muted-foreground': 'oklch(0.7 0 0)',
    '--border': 'oklch(0.3 0.02 350)',
    '--card': 'oklch(0.16 0.02 350)',
    '--card-foreground': 'oklch(0.95 0 0)',
    '--popover': 'oklch(0.16 0.02 350)',
    '--popover-foreground': 'oklch(0.95 0 0)',
    '--accent': 'oklch(0.3 0.06 350)',
    '--accent-foreground': 'oklch(0.95 0 0)',
  },
  'dark-slate': {
    '--background': 'oklch(0.11 0.01 260)',
    '--foreground': 'oklch(0.95 0 0)',
    '--primary': 'oklch(0.65 0.12 260)',
    '--primary-foreground': 'oklch(0.1 0 0)',
    '--muted': 'oklch(0.22 0.01 260)',
    '--muted-foreground': 'oklch(0.7 0 0)',
    '--border': 'oklch(0.28 0.01 260)',
    '--card': 'oklch(0.14 0.01 260)',
    '--card-foreground': 'oklch(0.95 0 0)',
    '--popover': 'oklch(0.14 0.01 260)',
    '--popover-foreground': 'oklch(0.95 0 0)',
    '--accent': 'oklch(0.28 0.03 260)',
    '--accent-foreground': 'oklch(0.95 0 0)',
  },
  'dark-oled': {
    '--background': 'oklch(0.05 0 0)',
    '--foreground': 'oklch(0.95 0 0)',
    '--primary': 'oklch(0.75 0.15 265)',
    '--primary-foreground': 'oklch(0.05 0 0)',
    '--muted': 'oklch(0.15 0 0)',
    '--muted-foreground': 'oklch(0.65 0 0)',
    '--border': 'oklch(0.2 0 0)',
    '--card': 'oklch(0.08 0 0)',
    '--card-foreground': 'oklch(0.95 0 0)',
    '--popover': 'oklch(0.08 0 0)',
    '--popover-foreground': 'oklch(0.95 0 0)',
    '--accent': 'oklch(0.2 0 0)',
    '--accent-foreground': 'oklch(0.95 0 0)',
  },
  sand: {
    '--background': 'oklch(0.97 0.02 75)',
    '--foreground': 'oklch(0.3 0.04 75)',
    '--primary': 'oklch(0.5 0.08 65)',
    '--primary-foreground': 'oklch(0.98 0 0)',
    '--muted': 'oklch(0.94 0.03 75)',
    '--muted-foreground': 'oklch(0.45 0.04 75)',
    '--border': 'oklch(0.88 0.03 75)',
    '--card': 'oklch(0.99 0.02 75)',
    '--accent': 'oklch(0.91 0.04 75)',
  },
}

// 모서리 스타일
const RADII = [
  { id: 'sharp', name: '각지게', value: '0' },
  { id: 'sm', name: '작게', value: '0.25rem' },
  { id: 'default', name: '기본', value: '0.5rem' },
  { id: 'round', name: '둥글게', value: '0.75rem' },
  { id: 'lg', name: '크게', value: '1rem' },
  { id: 'pill', name: '필', value: '9999px' },
] as const

// 버튼 스타일
const BUTTON_STYLES = [
  { id: 'default', name: '기본', className: '' },
  { id: 'flat', name: '플랫', className: 'shadow-none' },
  { id: 'soft', name: '부드러움', className: 'shadow-sm' },
  { id: 'ring', name: '링 강조', className: 'ring-2 ring-primary ring-offset-2' },
  { id: 'heavy', name: '강한 그림자', className: 'shadow-lg' },
] as const

// 카드 스타일
const CARD_STYLES = [
  { id: 'default', name: '기본', className: 'border shadow' },
  { id: 'minimal', name: '미니멀', className: 'border-0 shadow-sm bg-muted/30' },
  { id: 'elevated', name: '떠있는', className: 'border shadow-lg' },
  { id: 'outlined', name: '테두리만', className: 'border-2 shadow-none' },
  { id: 'header-accent', name: '헤더 강조', className: 'border shadow [&>*:first-child]:border-b [&>*:first-child]:border-primary/30' },
] as const

// 선택지 표시 스타일 (단일/다중용)
const CHOICE_STYLES_SELECT = [
  { id: 'default', name: '기본' },
  { id: 'card', name: '카드형' },
  { id: 'pill', name: '필형' },
  { id: 'list', name: '리스트형' },
] as const

// 토글 표시 스타일
const CHOICE_STYLES_TOGGLE = [
  { id: 'switch', name: '스위치' },
  { id: 'checkbox', name: '체크박스' },
] as const

// 메뉴 스타일
const MENU_STYLES = [
  { id: 'underline', name: '밑줄' },
  { id: 'pill', name: '필 배경' },
  { id: 'border', name: '좌측 테두리' },
  { id: 'button', name: '버튼형' },
  { id: 'icon', name: '아이콘형' },
] as const

// 코드블록 스타일
const CODE_BLOCK_STYLES = [
  { id: 'default', name: '기본', className: 'border border-border bg-muted/50', hasLabel: false },
  { id: 'left-bar', name: '좌측 강조', className: 'border-0 border-l-4 border-l-primary bg-muted/30', hasLabel: false },
  { id: 'flat', name: '플랫', className: 'border-0 bg-muted/40', hasLabel: false },
  { id: 'elevated', name: '떠있는', className: 'border border-border bg-card shadow-md', hasLabel: false },
  { id: 'with-label', name: '언어 라벨', className: 'border border-border bg-muted/50', hasLabel: true },
  { id: 'label-elevated', name: '언어 라벨 + 떠있는', className: 'border border-border bg-card shadow-md', hasLabel: true },
] as const

// 입력칸 스타일
const INPUT_STYLES = [
  { id: 'default', name: '기본', className: 'border border-input bg-background' },
  { id: 'outline', name: '아웃라인', className: 'border-2 border-input focus:border-primary' },
  { id: 'filled', name: '채움', className: 'border-0 bg-muted/50 focus:bg-muted' },
  { id: 'underline', name: '밑줄', className: 'border-0 border-b-2 border-input rounded-none focus:border-primary' },
  { id: 'ghost', name: '고스트', className: 'border-0 bg-transparent focus:bg-muted/30' },
] as const

// 타이포그래피 (굵기·줄간격)
const TYPO_STYLES = [
  { id: 'default', name: '기본', heading: 'font-bold', body: 'leading-relaxed' },
  { id: 'tight', name: '촘촘', heading: 'font-bold', body: 'leading-snug' },
  { id: 'loose', name: '넓음', heading: 'font-semibold', body: 'leading-loose' },
  { id: 'heavy', name: '강조', heading: 'font-extrabold', body: 'leading-normal' },
  { id: 'light', name: '가벼움', heading: 'font-semibold', body: 'leading-loose' },
] as const

// 제목 크기
const TYPO_SIZE_HEADING = [
  { id: 'xl', name: 'XL', className: 'text-xl' },
  { id: '2xl', name: '2XL', className: 'text-2xl' },
  { id: '3xl', name: '3XL', className: 'text-3xl' },
] as const

// 본문 크기
const TYPO_SIZE_BODY = [
  { id: 'sm', name: '작게', className: 'text-sm' },
  { id: 'base', name: '기본', className: 'text-base' },
  { id: 'lg', name: '크게', className: 'text-lg' },
] as const

// 그림자
const SHADOW_STYLES = [
  { id: 'none', name: '없음', className: 'shadow-none' },
  { id: 'sm', name: '미세', className: 'shadow-sm' },
  { id: 'default', name: '기본', className: 'shadow' },
  { id: 'lg', name: '강함', className: 'shadow-lg' },
  { id: 'xl', name: '매우 강함', className: 'shadow-xl' },
] as const

// 트랜지션
const TRANSITION_STYLES = [
  { id: 'none', name: '없음', value: '0ms' },
  { id: 'fast', name: '빠름', value: '150ms' },
  { id: 'default', name: '기본', value: '300ms' },
  { id: 'slow', name: '느림', value: '500ms' },
  { id: 'slower', name: '매우 느림', value: '700ms' },
] as const

// 탭 스타일
const TAB_STYLES = [
  { id: 'underline', name: '밑줄' },
  { id: 'pill', name: '필' },
  { id: 'box', name: '박스' },
  { id: 'bordered', name: '테두리' },
  { id: 'minimal', name: '미니멀' },
] as const

// 드롭다운 스타일
const DROPDOWN_STYLES = [
  { id: 'default', name: '기본' },
  { id: 'minimal', name: '미니멀' },
  { id: 'outline', name: '아웃라인' },
  { id: 'filled', name: '채움' },
  { id: 'ghost', name: '고스트' },
] as const

// 배지 스타일
const BADGE_STYLES = [
  { id: 'default', name: '기본' },
  { id: 'outline', name: '아웃라인' },
  { id: 'soft', name: '부드러움' },
  { id: 'dot', name: '점 표시' },
  { id: 'count', name: '카운트' },
] as const

// 토스트 스타일
const TOAST_STYLES = [
  { id: 'default', name: '기본' },
  { id: 'minimal', name: '미니멀' },
  { id: 'bordered', name: '테두리' },
  { id: 'floating', name: '떠있는' },
  { id: 'inline', name: '인라인' },
] as const

// 토글 스타일
const TOGGLE_STYLES = [
  { id: 'default', name: '기본' },
  { id: 'pill', name: '필' },
  { id: 'compact', name: '컴팩트' },
  { id: 'large', name: '크게' },
  { id: 'icon', name: '아이콘' },
] as const

// 페이지네이션 스타일
const PAGINATION_STYLES = [
  { id: 'default', name: '기본' },
  { id: 'minimal', name: '미니멀' },
  { id: 'compact', name: '컴팩트' },
  { id: 'numbered', name: '숫자형' },
  { id: 'arrows', name: '화살표' },
] as const

// 프로그레스 스타일
const PROGRESS_STYLES = [
  { id: 'default', name: '기본' },
  { id: 'thin', name: '얇게' },
  { id: 'thick', name: '두껍게' },
  { id: 'striped', name: '줄무늬' },
  { id: 'gradient', name: '그라데이션' },
] as const

export default function DesignPlaygroundPage() {
  const [font, setFont] = useState<(typeof FONTS)[number]['id']>('system')
  const [codeFont, setCodeFont] = useState<(typeof CODE_FONTS)[number]['id']>('system-mono')
  const [themes, setThemes] = useState<string[]>(['light'])
  const [radius, setRadius] = useState<string>('0.5rem')
  const [buttonStyle, setButtonStyle] = useState<(typeof BUTTON_STYLES)[number]['id']>('default')
  const [cardStyle, setCardStyle] = useState<(typeof CARD_STYLES)[number]['id']>('default')
  const [choiceStyleSingle, setChoiceStyleSingle] = useState<(typeof CHOICE_STYLES_SELECT)[number]['id']>('default')
  const [choiceStyleMulti, setChoiceStyleMulti] = useState<(typeof CHOICE_STYLES_SELECT)[number]['id']>('default')
  const [choiceStyleToggle, setChoiceStyleToggle] = useState<(typeof CHOICE_STYLES_TOGGLE)[number]['id']>('switch')
  const [menuStyle, setMenuStyle] = useState<(typeof MENU_STYLES)[number]['id']>('underline')
  const [codeBlockStyle, setCodeBlockStyle] = useState<(typeof CODE_BLOCK_STYLES)[number]['id']>('default')
  const [inputStyle, setInputStyle] = useState<(typeof INPUT_STYLES)[number]['id']>('default')
  const [typoStyle, setTypoStyle] = useState<(typeof TYPO_STYLES)[number]['id']>('default')
  const [typoSizeHeading, setTypoSizeHeading] = useState<(typeof TYPO_SIZE_HEADING)[number]['id']>('2xl')
  const [typoSizeBody, setTypoSizeBody] = useState<(typeof TYPO_SIZE_BODY)[number]['id']>('base')
  const [shadowStyle, setShadowStyle] = useState<(typeof SHADOW_STYLES)[number]['id']>('default')
  const [transitionStyle, setTransitionStyle] = useState<(typeof TRANSITION_STYLES)[number]['id']>('default')
  const [tabStyle, setTabStyle] = useState<(typeof TAB_STYLES)[number]['id']>('underline')
  const [dropdownStyle, setDropdownStyle] = useState<(typeof DROPDOWN_STYLES)[number]['id']>('default')
  const [badgeStyle, setBadgeStyle] = useState<(typeof BADGE_STYLES)[number]['id']>('default')
  const [toastStyle, setToastStyle] = useState<(typeof TOAST_STYLES)[number]['id']>('default')
  const [toggleStyle, setToggleStyle] = useState<(typeof TOGGLE_STYLES)[number]['id']>('default')
  const [paginationStyle, setPaginationStyle] = useState<(typeof PAGINATION_STYLES)[number]['id']>('default')
  const [progressStyle, setProgressStyle] = useState<(typeof PROGRESS_STYLES)[number]['id']>('default')
  const [copied, setCopied] = useState(false)
  const [iconToggleChecked, setIconToggleChecked] = useState(true)

  const fontFamily = FONTS.find((f) => f.id === font)?.fontFamily ?? FONTS[0].fontFamily
  const codeFontFamily =
    CODE_FONTS.find((f) => f.id === codeFont)?.fontFamily ?? CODE_FONTS[0].fontFamily
  const theme = themes[0] ?? 'light'
  const themeVars = THEMES[theme] ?? THEMES.light

  const toggleTheme = (id: string) => {
    setThemes((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    )
  }
  const buttonStyleClass = BUTTON_STYLES.find((s) => s.id === buttonStyle)?.className ?? ''
  const cardStyleClass = CARD_STYLES.find((s) => s.id === cardStyle)?.className ?? ''
  const codeBlockStyleClass =
    CODE_BLOCK_STYLES.find((s) => s.id === codeBlockStyle)?.className ?? ''
  const inputStyleClass = INPUT_STYLES.find((s) => s.id === inputStyle)?.className ?? ''
  const typoStyleClass = TYPO_STYLES.find((s) => s.id === typoStyle)
  const typoSizeHeadingClass = TYPO_SIZE_HEADING.find((s) => s.id === typoSizeHeading)?.className ?? 'text-2xl'
  const typoSizeBodyClass = TYPO_SIZE_BODY.find((s) => s.id === typoSizeBody)?.className ?? 'text-base'
  const shadowStyleClass = SHADOW_STYLES.find((s) => s.id === shadowStyle)?.className ?? ''
  const transitionValue = TRANSITION_STYLES.find((s) => s.id === transitionStyle)?.value ?? '300ms'

  const copySelections = () => {
    const text = `## 디자인 플레이그라운드 선택 결과

### 폰트
- 본문: ${FONTS.find((f) => f.id === font)?.name ?? font}
- 코드: ${CODE_FONTS.find((f) => f.id === codeFont)?.name ?? codeFont}

### 색상
- 테마: ${themes.join(', ')}

### 스타일
- 모서리: ${RADII.find((r) => r.value === radius)?.name ?? radius}
- 버튼: ${BUTTON_STYLES.find((s) => s.id === buttonStyle)?.name ?? buttonStyle}
- 카드: ${CARD_STYLES.find((s) => s.id === cardStyle)?.name ?? cardStyle}
- 선택지 단일: ${CHOICE_STYLES_SELECT.find((s) => s.id === choiceStyleSingle)?.name ?? choiceStyleSingle}
- 선택지 다중: ${CHOICE_STYLES_SELECT.find((s) => s.id === choiceStyleMulti)?.name ?? choiceStyleMulti}
- 선택지 토글: ${CHOICE_STYLES_TOGGLE.find((s) => s.id === choiceStyleToggle)?.name ?? choiceStyleToggle}
- 메뉴: ${MENU_STYLES.find((s) => s.id === menuStyle)?.name ?? menuStyle}
- 코드블록: ${CODE_BLOCK_STYLES.find((s) => s.id === codeBlockStyle)?.name ?? codeBlockStyle}
- 입력칸: ${INPUT_STYLES.find((s) => s.id === inputStyle)?.name ?? inputStyle}
- 타이포: ${TYPO_STYLES.find((s) => s.id === typoStyle)?.name ?? typoStyle}
- 제목 크기: ${TYPO_SIZE_HEADING.find((s) => s.id === typoSizeHeading)?.name ?? typoSizeHeading}
- 본문 크기: ${TYPO_SIZE_BODY.find((s) => s.id === typoSizeBody)?.name ?? typoSizeBody}
- 그림자: ${SHADOW_STYLES.find((s) => s.id === shadowStyle)?.name ?? shadowStyle}
- 트랜지션: ${TRANSITION_STYLES.find((s) => s.id === transitionStyle)?.name ?? transitionStyle}

### 기능 컴포넌트
- 탭: ${TAB_STYLES.find((s) => s.id === tabStyle)?.name ?? tabStyle}
- 드롭다운: ${DROPDOWN_STYLES.find((s) => s.id === dropdownStyle)?.name ?? dropdownStyle}
- 배지: ${BADGE_STYLES.find((s) => s.id === badgeStyle)?.name ?? badgeStyle}
- 토스트: ${TOAST_STYLES.find((s) => s.id === toastStyle)?.name ?? toastStyle}
- 토글: ${TOGGLE_STYLES.find((s) => s.id === toggleStyle)?.name ?? toggleStyle}
- 페이지네이션: ${PAGINATION_STYLES.find((s) => s.id === paginationStyle)?.name ?? paginationStyle}
- 프로그레스: ${PROGRESS_STYLES.find((s) => s.id === progressStyle)?.name ?? progressStyle}
`
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div
      className="design-playground-root min-h-svh bg-background text-foreground"
      style={
        {
          fontFamily,
          ...themeVars,
          '--radius': radius,
          transition: `color ${transitionValue}, background-color ${transitionValue}`,
        } as React.CSSProperties
      }
    >
      {/* 폰트 로드 */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;700&family=Inter:wght@400;500;700&family=Nanum+Gothic:wght@400;700&family=Noto+Sans+KR:wght@400;500;700&family=Source+Code+Pro:wght@400;500&family=Cascadia+Code:wght@400;500&display=swap"
      />
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
      />
      <link
        rel="stylesheet"
        href="https://cdn.jsdelivr.net/gh/spoqa/spoqa-han-sans@latest/css/SpoqaHanSansNeo.css"
      />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500&family=JetBrains+Mono:wght@400;500&family=Geist+Mono:wght@400;500&family=Victor+Mono:wght@400;500&display=swap"
      />

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-10">
        <header className="space-y-4 pb-8 border-b border-border">
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-2xl font-bold tracking-tight">디자인 플레이그라운드</h1>
            <Button variant="outline" size="sm" asChild>
              <Link to="/main">메인으로</Link>
            </Button>
          </div>
          <p className="text-muted-foreground leading-relaxed max-w-2xl">
            폰트, 색상 테마, 모서리·그림자·트랜지션, 버튼·카드·입력칸 등 컴포넌트 스타일을 실시간으로 비교하고 결정할 수 있습니다.
            선택 결과를 복사해 AI에게 전달하면 index.css와 컴포넌트에 반영할 수 있습니다.
          </p>
        </header>

        {/* 1. 폰트 */}
        <section className="space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground">폰트</h2>

          <div>
            <p className="text-xs text-muted-foreground mb-2">본문</p>
            <div className="flex flex-wrap gap-2">
              {FONTS.map((f) => (
                <Button
                  key={f.id}
                  variant={font === f.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFont(f.id)}
                >
                  {f.name}
                </Button>
              ))}
            </div>
            <p className="mt-3 text-lg">
              끊임없이 배워나가는, 끝없이 확장해나가는, 결국 인간을 위하는 개발자
            </p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-2">코드</p>
            <div className="flex flex-wrap gap-2">
              {CODE_FONTS.map((f) => (
                <Button
                  key={f.id}
                  variant={codeFont === f.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCodeFont(f.id)}
                >
                  {f.name}
                </Button>
              ))}
            </div>
            <pre
              className={cn('mt-3 p-4 text-sm overflow-x-auto', codeBlockStyleClass, PREVIEW_RADIUS)}
              style={{ fontFamily: codeFontFamily }}
            >
              <code style={{ fontFamily: codeFontFamily }}>{CODE_SAMPLE}</code>
            </pre>
          </div>
        </section>

        {/* 2. 색상 테마 (복수 선택) */}
        <section>
          <h2 className="text-sm font-medium text-muted-foreground mb-3">색상 테마 (복수 선택 가능)</h2>
          <p className="text-xs text-muted-foreground mb-2">클릭하여 선택/해제. 첫 번째 선택이 페이지에 적용됩니다.</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(THEMES).map(([id, colors]) => {
              const palette = [
                { key: 'background', color: colors['--background'] },
                { key: 'foreground', color: colors['--foreground'] },
                { key: 'primary', color: colors['--primary'] },
                { key: 'secondary', color: colors['--secondary'] ?? colors['--muted'] },
                { key: 'accent', color: colors['--accent'] },
              ]
              const isSelected = themes.includes(id)
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggleTheme(id)}
                  className={`flex flex-col rounded-lg border-2 overflow-hidden text-left transition-all hover:scale-[1.02] ${
                    isSelected ? 'border-primary ring-2 ring-primary/30' : 'border-border hover:border-muted-foreground/30'
                  }`}
                >
                  <div className="flex h-12">
                    {palette.map(({ key, color }) => (
                      <div
                        key={key}
                        className="flex-1 min-w-0"
                        style={{ backgroundColor: color }}
                        title={key}
                      />
                    ))}
                  </div>
                  <span className="px-3 py-2 text-sm font-medium bg-muted/50 flex items-center justify-between">
                    {id}
                    {isSelected && <span className="text-primary">✓</span>}
                  </span>
                </button>
              )
            })}
          </div>
        </section>

        {/* 3. 모서리 / 그림자 / 트랜지션 */}
        <section className="space-y-4">
          <div>
            <h2 className="text-sm font-medium text-muted-foreground mb-2">모서리</h2>
            <div className="flex flex-wrap gap-2">
              {RADII.map((r) => (
                <Button
                  key={r.id}
                  variant={radius === r.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setRadius(r.value)}
                >
                  {r.name}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <h2 className="text-sm font-medium text-muted-foreground mb-2">그림자</h2>
            <div className="flex flex-wrap gap-2">
              {SHADOW_STYLES.map((s) => (
                <Button
                  key={s.id}
                  variant={shadowStyle === s.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setShadowStyle(s.id)}
                >
                  {s.name}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <h2 className="text-sm font-medium text-muted-foreground mb-2">트랜지션</h2>
            <div className="flex flex-wrap gap-2">
              {TRANSITION_STYLES.map((s) => (
                <Button
                  key={s.id}
                  variant={transitionStyle === s.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTransitionStyle(s.id)}
                >
                  {s.name}
                </Button>
              ))}
            </div>
          </div>
        </section>

        {/* 4. 컴포넌트 미리보기 */}
        <section className="space-y-6">
          <h2 className="text-sm font-medium text-muted-foreground">컴포넌트 미리보기</h2>

          <div className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Button</p>
              <div className="flex flex-wrap gap-2">
                {BUTTON_STYLES.map((s) => (
                  <Button
                    key={s.id}
                    variant={buttonStyle === s.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setButtonStyle(s.id)}
                  >
                    {s.name}
                  </Button>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button className={cn(buttonStyleClass, PREVIEW_RADIUS)}>Primary</Button>
              <Button variant="secondary" className={cn(buttonStyleClass, PREVIEW_RADIUS)}>Secondary</Button>
              <Button variant="accent" className={cn(buttonStyleClass, PREVIEW_RADIUS)}>Accent</Button>
              <Button variant="outline" className={cn(buttonStyleClass, PREVIEW_RADIUS)}>Outline</Button>
              <Button variant="ghost" className={cn(buttonStyleClass, PREVIEW_RADIUS)}>Ghost</Button>
            </div>
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-2">테마 색상</p>
            <div className="flex flex-wrap gap-2">
              <span className={cn('inline-flex items-center px-3 py-1.5 text-xs font-medium border border-border bg-background text-foreground', PREVIEW_RADIUS)}>
                background
              </span>
              <span className={cn('inline-flex items-center px-3 py-1.5 text-xs font-medium bg-foreground text-primary-foreground', PREVIEW_RADIUS)}>
                foreground
              </span>
              <span className={cn('inline-flex items-center px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground', PREVIEW_RADIUS)}>
                primary
              </span>
              <span className={cn('inline-flex items-center px-3 py-1.5 text-xs font-medium bg-secondary text-secondary-foreground', PREVIEW_RADIUS)}>
                secondary
              </span>
              <span className={cn('inline-flex items-center px-3 py-1.5 text-xs font-medium bg-accent text-accent-foreground', PREVIEW_RADIUS)}>
                accent
              </span>
              <span className={cn('inline-flex items-center px-3 py-1.5 text-xs font-medium bg-muted text-foreground', PREVIEW_RADIUS)}>
                muted
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Card</p>
              <div className="flex flex-wrap gap-2">
                {CARD_STYLES.map((s) => (
                  <Button
                    key={s.id}
                    variant={cardStyle === s.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCardStyle(s.id)}
                  >
                    {s.name}
                  </Button>
                ))}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Card className={cn('hover:border-primary/50 transition-colors', cardStyleClass, shadowStyleClass, PREVIEW_RADIUS)}>
                <CardHeader>
                  <CardTitle>About</CardTitle>
                  <CardDescription>소개</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="secondary" size="sm" className={cn(buttonStyleClass, PREVIEW_RADIUS)}>
                    이동
                  </Button>
                </CardContent>
              </Card>
              <Card className={cn('hover:border-primary/50 transition-colors', cardStyleClass, shadowStyleClass, PREVIEW_RADIUS)}>
                <CardHeader>
                  <CardTitle>Portfolio</CardTitle>
                  <CardDescription>포트폴리오</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="secondary" size="sm" className={cn(buttonStyleClass, PREVIEW_RADIUS)}>
                    이동
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="space-y-6">
            {/* 단일선택 */}
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">단일선택 (radio)</p>
                <div className="flex flex-wrap gap-2">
                  {CHOICE_STYLES_SELECT.map((s) => (
                    <Button
                      key={s.id}
                      variant={choiceStyleSingle === s.id ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setChoiceStyleSingle(s.id)}
                    >
                      {s.name}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap gap-4">
              {choiceStyleSingle === 'default' && (
                <>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="choice-single-default" className="border-input" />
                    <span>옵션 A</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="choice-single-default" className="border-input" defaultChecked />
                    <span>옵션 B</span>
                  </label>
                </>
              )}
              {choiceStyleSingle === 'card' && (
                <div className="flex gap-2">
                  {['옵션 A', '옵션 B'].map((opt, i) => (
                    <label
                      key={opt}
                      className={cn(
                        'flex items-center gap-2 px-4 py-2 border cursor-pointer transition-colors',
                        PREVIEW_RADIUS,
                        i === 1 ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                      )}
                    >
                      <input type="radio" name="choice-single-card" className="sr-only" defaultChecked={i === 1} />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              )}
              {choiceStyleSingle === 'pill' && (
                <div className="flex gap-1 p-1 rounded-full bg-muted">
                  {['옵션 A', '옵션 B'].map((opt, i) => (
                    <label
                      key={opt}
                      className={cn(
                        'px-4 py-1.5 rounded-full text-sm cursor-pointer transition-colors',
                        i === 1 ? 'bg-primary text-primary-foreground' : 'hover:bg-muted-foreground/10'
                      )}
                    >
                      <input type="radio" name="choice-single-pill" className="sr-only" defaultChecked={i === 1} />
                      {opt}
                    </label>
                  ))}
                </div>
              )}
              {choiceStyleSingle === 'list' && (
                <ul className={cn('space-y-0 border divide-y divide-border p-0 list-none', PREVIEW_RADIUS)}>
                  {['옵션 A', '옵션 B'].map((opt, i) => (
                    <li key={opt}>
                      <label className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/50">
                        <input type="radio" name="choice-single-list" className="border-input" defaultChecked={i === 1} />
                        <span>{opt}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              )}
              </div>
            </div>

            {/* 다중선택 */}
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">다중선택 (checkbox)</p>
                <div className="flex flex-wrap gap-2">
                  {CHOICE_STYLES_SELECT.map((s) => (
                    <Button
                      key={s.id}
                      variant={choiceStyleMulti === s.id ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setChoiceStyleMulti(s.id)}
                    >
                      {s.name}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap gap-4">
              {choiceStyleMulti === 'default' && (
                <>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="rounded border-input" defaultChecked />
                    <span>옵션 A</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="rounded border-input" />
                    <span>옵션 B</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="rounded border-input" defaultChecked />
                    <span>옵션 C</span>
                  </label>
                </>
              )}
              {choiceStyleMulti === 'card' && (
                <div className="flex flex-wrap gap-2">
                  {['옵션 A', '옵션 B', '옵션 C'].map((opt, i) => (
                    <label
                      key={opt}
                      className={cn(
                        'flex items-center gap-2 px-4 py-2 border cursor-pointer transition-colors',
                        PREVIEW_RADIUS,
                        [0, 2].includes(i) ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/50'
                      )}
                    >
                      <input type="checkbox" className="sr-only" defaultChecked={[0, 2].includes(i)} />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              )}
              {choiceStyleMulti === 'pill' && (
                <div className="flex gap-1 p-1 rounded-full bg-muted flex-wrap">
                  {['옵션 A', '옵션 B', '옵션 C'].map((opt, i) => (
                    <label
                      key={opt}
                      className={cn(
                        'px-4 py-1.5 rounded-full text-sm cursor-pointer transition-colors',
                        [0, 2].includes(i) ? 'bg-primary text-primary-foreground' : 'hover:bg-muted-foreground/10'
                      )}
                    >
                      <input type="checkbox" className="sr-only" defaultChecked={[0, 2].includes(i)} />
                      {opt}
                    </label>
                  ))}
                </div>
              )}
              {choiceStyleMulti === 'list' && (
                <ul className={cn('space-y-0 border divide-y divide-border p-0 list-none', PREVIEW_RADIUS)}>
                  {['옵션 A', '옵션 B', '옵션 C'].map((opt, i) => (
                    <li key={opt}>
                      <label className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/50">
                        <input type="checkbox" className="border-input rounded" defaultChecked={[0, 2].includes(i)} />
                        <span>{opt}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              )}
              </div>
            </div>

            {/* 토글 */}
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">토글 (switch/checkbox)</p>
                <div className="flex flex-wrap gap-2">
                  {CHOICE_STYLES_TOGGLE.map((s) => (
                    <Button
                      key={s.id}
                      variant={choiceStyleToggle === s.id ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setChoiceStyleToggle(s.id)}
                    >
                      {s.name}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap gap-4">
              {choiceStyleToggle === 'switch' && (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 rounded-full bg-muted peer-checked:bg-primary transition-colors" />
                      <div className="absolute left-1 top-1 w-4 h-4 rounded-full bg-background shadow transition-transform peer-checked:translate-x-5" />
                    </label>
                    <span className="text-sm">알림 받기</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 rounded-full bg-muted peer-checked:bg-primary transition-colors" />
                      <div className="absolute left-1 top-1 w-4 h-4 rounded-full bg-background shadow transition-transform peer-checked:translate-x-5" />
                    </label>
                    <span className="text-sm">다크 모드</span>
                  </div>
                </div>
              )}
              {choiceStyleToggle === 'checkbox' && (
                <div className="flex flex-col gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="rounded border-input" defaultChecked />
                    <span className="text-sm">알림 받기</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="rounded border-input" />
                    <span className="text-sm">다크 모드</span>
                  </label>
                </div>
              )}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground mb-2">메뉴</p>
              <div className="flex flex-wrap gap-2">
                {MENU_STYLES.map((s) => (
                  <Button
                    key={s.id}
                    variant={menuStyle === s.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setMenuStyle(s.id)}
                  >
                    {s.name}
                  </Button>
                ))}
              </div>
            </div>
            <nav className="flex gap-4">
              {menuStyle === 'underline' && (
                <>
                  <a href="#" className="text-primary font-medium border-b-2 border-primary pb-1">
                    홈
                  </a>
                  <a href="#" className="text-muted-foreground hover:text-foreground pb-1">
                    About
                  </a>
                  <a href="#" className="text-muted-foreground hover:text-foreground pb-1">
                    Blog
                  </a>
                </>
              )}
              {menuStyle === 'pill' && (
                <>
                  <a
                    href="#"
                    className="px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-sm font-medium"
                  >
                    홈
                  </a>
                  <a href="#" className="px-3 py-1.5 rounded-full text-sm text-muted-foreground hover:bg-muted">
                    About
                  </a>
                  <a href="#" className="px-3 py-1.5 rounded-full text-sm text-muted-foreground hover:bg-muted">
                    Blog
                  </a>
                </>
              )}
              {menuStyle === 'border' && (
                <>
                  <a href="#" className="pl-3 border-l-2 border-primary text-primary font-medium">
                    홈
                  </a>
                  <a href="#" className="pl-3 border-l-2 border-transparent text-muted-foreground hover:text-foreground">
                    About
                  </a>
                  <a href="#" className="pl-3 border-l-2 border-transparent text-muted-foreground hover:text-foreground">
                    Blog
                  </a>
                </>
              )}
              {menuStyle === 'button' && (
                <>
                  <Button size="sm" className={PREVIEW_RADIUS}>홈</Button>
                  <Button variant="outline" size="sm" className={PREVIEW_RADIUS}>About</Button>
                  <Button variant="outline" size="sm" className={PREVIEW_RADIUS}>Blog</Button>
                </>
              )}
              {menuStyle === 'icon' && (
                <>
                  <a href="#" className={cn('p-2 bg-primary text-primary-foreground', PREVIEW_RADIUS)} title="홈">⌂</a>
                  <a href="#" className={cn('p-2 text-muted-foreground hover:bg-muted', PREVIEW_RADIUS)} title="About">👤</a>
                  <a href="#" className={cn('p-2 text-muted-foreground hover:bg-muted', PREVIEW_RADIUS)} title="Blog">📝</a>
                </>
              )}
            </nav>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground mb-2">코드블록</p>
              <div className="flex flex-wrap gap-2">
                {CODE_BLOCK_STYLES.map((s) => (
                  <Button
                    key={s.id}
                    variant={codeBlockStyle === s.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCodeBlockStyle(s.id)}
                  >
                    {s.name}
                  </Button>
                ))}
              </div>
            </div>
            {CODE_BLOCK_STYLES.find((s) => s.id === codeBlockStyle)?.hasLabel ? (
              <div className={cn('min-w-0 flex-1 overflow-hidden', codeBlockStyleClass, PREVIEW_RADIUS)}>
                <div className="px-3 py-1 text-xs font-medium text-muted-foreground bg-muted/50 border-b border-border">
                  typescript
                </div>
                <pre
                  className="p-4 text-sm overflow-x-auto"
                  style={{ fontFamily: codeFontFamily }}
                >
                  <code style={{ fontFamily: codeFontFamily }}>{CODE_SAMPLE}</code>
                </pre>
              </div>
            ) : (
              <pre
                className={cn('p-4 text-sm overflow-x-auto', codeBlockStyleClass, PREVIEW_RADIUS)}
                style={{ fontFamily: codeFontFamily }}
              >
                <code style={{ fontFamily: codeFontFamily }}>{CODE_SAMPLE}</code>
              </pre>
            )}
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground mb-2">입력칸</p>
              <div className="flex flex-wrap gap-2">
                {INPUT_STYLES.map((s) => (
                  <Button
                    key={s.id}
                    variant={inputStyle === s.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setInputStyle(s.id)}
                  >
                    {s.name}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2 max-w-xs">
              <input
                type="text"
                placeholder="이름을 입력하세요"
                className={cn(
                  'w-full px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                  PREVIEW_RADIUS,
                  inputStyleClass
                )}
              />
              <textarea
                placeholder="메시지를 입력하세요"
                rows={2}
                className={cn(
                  'w-full px-3 py-2 text-sm resize-none transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                  PREVIEW_RADIUS,
                  inputStyleClass
                )}
              />
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground mb-2">타이포그래피 (굵기·줄간격)</p>
              <div className="flex flex-wrap gap-2">
                {TYPO_STYLES.map((s) => (
                  <Button
                    key={s.id}
                    variant={typoStyle === s.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTypoStyle(s.id)}
                  >
                    {s.name}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">제목 크기</p>
              <div className="flex flex-wrap gap-2">
                {TYPO_SIZE_HEADING.map((s) => (
                  <Button
                    key={s.id}
                    variant={typoSizeHeading === s.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTypoSizeHeading(s.id)}
                  >
                    {s.name}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-2">본문 크기</p>
              <div className="flex flex-wrap gap-2">
                {TYPO_SIZE_BODY.map((s) => (
                  <Button
                    key={s.id}
                    variant={typoSizeBody === s.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTypoSizeBody(s.id)}
                  >
                    {s.name}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <h3 className={cn(typoSizeHeadingClass, typoStyleClass?.heading)}>제목 H3</h3>
              <p className={cn(typoSizeBodyClass, 'text-muted-foreground', typoStyleClass?.body)}>
                본문 텍스트. 자료 정리, 포트폴리오, 기술 학습을 위한 개인 웹사이트입니다.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground mb-2">탭</p>
              <div className="flex flex-wrap gap-2">
                {TAB_STYLES.map((s) => (
                  <Button
                    key={s.id}
                    variant={tabStyle === s.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTabStyle(s.id)}
                  >
                    {s.name}
                  </Button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              {tabStyle === 'underline' && (
                <>
                  <button type="button" className="text-primary font-medium border-b-2 border-primary pb-1">
                    탭1
                  </button>
                  <button type="button" className="text-muted-foreground hover:text-foreground pb-1">
                    탭2
                  </button>
                </>
              )}
              {tabStyle === 'pill' && (
                <div className="flex gap-1 p-1 rounded-full bg-muted">
                  <span className="px-3 py-1 rounded-full bg-primary text-primary-foreground text-sm">탭1</span>
                  <span className="px-3 py-1 rounded-full text-sm text-muted-foreground">탭2</span>
                </div>
              )}
              {tabStyle === 'box' && (
                <div className={cn('flex gap-1 p-1 border border-border', PREVIEW_RADIUS)}>
                  <span className={cn('px-3 py-1 bg-primary text-primary-foreground text-sm', PREVIEW_RADIUS)}>탭1</span>
                  <span className={cn('px-3 py-1 text-sm text-muted-foreground', PREVIEW_RADIUS)}>탭2</span>
                </div>
              )}
              {tabStyle === 'bordered' && (
                <div className="flex gap-0 border-b border-border">
                  <span className="px-4 py-2 border-b-2 border-primary text-primary font-medium text-sm">탭1</span>
                  <span className="px-4 py-2 text-sm text-muted-foreground">탭2</span>
                </div>
              )}
              {tabStyle === 'minimal' && (
                <div className="flex gap-4">
                  <span className="text-primary font-medium">탭1</span>
                  <span className="text-muted-foreground">탭2</span>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground mb-2">배지</p>
              <div className="flex flex-wrap gap-2">
                {BADGE_STYLES.map((s) => (
                  <Button
                    key={s.id}
                    variant={badgeStyle === s.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setBadgeStyle(s.id)}
                  >
                    {s.name}
                  </Button>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {badgeStyle === 'default' && (
                <>
                  <span className={cn('inline-flex items-center px-2.5 py-0.5 text-xs font-medium bg-primary text-primary-foreground', PREVIEW_RADIUS)}>
                    New
                  </span>
                  <span className={cn('inline-flex items-center px-2.5 py-0.5 text-xs font-medium bg-muted text-foreground', PREVIEW_RADIUS)}>
                    3
                  </span>
                </>
              )}
              {badgeStyle === 'outline' && (
                <>
                  <span className={cn('inline-flex items-center border border-primary px-2.5 py-0.5 text-xs font-medium text-primary', PREVIEW_RADIUS)}>
                    New
                  </span>
                  <span className={cn('inline-flex items-center border border-border px-2.5 py-0.5 text-xs', PREVIEW_RADIUS)}>
                    3
                  </span>
                </>
              )}
              {badgeStyle === 'soft' && (
                <>
                  <span className={cn('inline-flex items-center bg-primary/20 px-2.5 py-0.5 text-xs font-medium text-primary', PREVIEW_RADIUS)}>
                    New
                  </span>
                  <span className={cn('inline-flex items-center bg-muted px-2.5 py-0.5 text-xs', PREVIEW_RADIUS)}>
                    3
                  </span>
                </>
              )}
              {badgeStyle === 'dot' && (
                <>
                  <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs', PREVIEW_RADIUS)}>
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    온라인
                  </span>
                </>
              )}
              {badgeStyle === 'count' && (
                <span className="inline-flex items-center justify-center min-w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-medium px-1.5">
                  99+
                </span>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground mb-2">토글</p>
              <div className="flex flex-wrap gap-2">
                {TOGGLE_STYLES.map((s) => (
                  <Button
                    key={s.id}
                    variant={toggleStyle === s.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setToggleStyle(s.id)}
                  >
                    {s.name}
                  </Button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              {toggleStyle === 'default' && (
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 rounded-full bg-muted peer-checked:bg-primary transition-colors" />
                  <div className="absolute left-1 top-1 w-4 h-4 rounded-full bg-background shadow transition-transform peer-checked:translate-x-5" />
                </label>
              )}
              {toggleStyle === 'pill' && (
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-14 h-7 rounded-full bg-muted peer-checked:bg-primary transition-colors" />
                  <div className="absolute left-1 top-1 w-5 h-5 rounded-full bg-background shadow transition-transform peer-checked:translate-x-7" />
                </label>
              )}
              {toggleStyle === 'compact' && (
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-9 h-5 rounded-full bg-muted peer-checked:bg-primary transition-colors" />
                  <div className="absolute left-0.5 top-0.5 w-4 h-4 rounded-full bg-background shadow transition-transform peer-checked:translate-x-4" />
                </label>
              )}
              {toggleStyle === 'large' && (
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-16 h-8 rounded-full bg-muted peer-checked:bg-primary transition-colors" />
                  <div className="absolute left-1 top-1 w-6 h-6 rounded-full bg-background shadow transition-transform peer-checked:translate-x-8" />
                </label>
              )}
              {toggleStyle === 'icon' && (
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={iconToggleChecked}
                    onChange={(e) => setIconToggleChecked(e.target.checked)}
                  />
                  <div className={cn('w-12 h-12 bg-muted peer-checked:bg-primary transition-colors flex items-center justify-center text-lg', PREVIEW_RADIUS)}>
                    {iconToggleChecked ? '☀' : '🌙'}
                  </div>
                </label>
              )}
              <span className="text-sm text-muted-foreground">다크 모드</span>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground mb-2">페이지네이션</p>
              <div className="flex flex-wrap gap-2">
                {PAGINATION_STYLES.map((s) => (
                  <Button
                    key={s.id}
                    variant={paginationStyle === s.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPaginationStyle(s.id)}
                  >
                    {s.name}
                  </Button>
                ))}
              </div>
            </div>
            <nav className="flex gap-1 flex-wrap">
              {paginationStyle === 'default' && (
                <>
                  <Button variant="outline" size="sm" className={PREVIEW_RADIUS} disabled>‹</Button>
                  <Button size="sm" className={PREVIEW_RADIUS}>1</Button>
                  <Button variant="outline" size="sm" className={PREVIEW_RADIUS}>2</Button>
                  <Button variant="outline" size="sm" className={PREVIEW_RADIUS}>›</Button>
                </>
              )}
              {paginationStyle === 'minimal' && (
                <div className="flex gap-2 text-sm">
                  <a href="#" className="text-muted-foreground">‹</a>
                  <span className="font-medium">1</span>
                  <a href="#" className="text-muted-foreground">2</a>
                  <a href="#" className="text-muted-foreground">›</a>
                </div>
              )}
              {paginationStyle === 'compact' && (
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" className={PREVIEW_RADIUS}>‹</Button>
                  <Button size="sm" className={PREVIEW_RADIUS}>1</Button>
                  <Button variant="ghost" size="sm" className={PREVIEW_RADIUS}>›</Button>
                </div>
              )}
              {paginationStyle === 'numbered' && (
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" className={PREVIEW_RADIUS}>1</Button>
                  <Button size="sm" className={PREVIEW_RADIUS}>2</Button>
                  <Button variant="outline" size="sm" className={PREVIEW_RADIUS}>3</Button>
                </div>
              )}
              {paginationStyle === 'arrows' && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className={PREVIEW_RADIUS}>← 이전</Button>
                  <Button variant="outline" size="sm" className={PREVIEW_RADIUS}>다음 →</Button>
                </div>
              )}
            </nav>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground mb-2">프로그레스</p>
              <div className="flex flex-wrap gap-2">
                {PROGRESS_STYLES.map((s) => (
                  <Button
                    key={s.id}
                    variant={progressStyle === s.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setProgressStyle(s.id)}
                  >
                    {s.name}
                  </Button>
                ))}
              </div>
            </div>
            <div className="max-w-xs">
              {progressStyle === 'default' && (
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div className="h-full w-2/3 rounded-full bg-primary" />
                </div>
              )}
              {progressStyle === 'thin' && (
                <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
                  <div className="h-full w-2/3 rounded-full bg-primary" />
                </div>
              )}
              {progressStyle === 'thick' && (
                <div className="h-4 w-full rounded-full bg-muted overflow-hidden">
                  <div className="h-full w-2/3 rounded-full bg-primary" />
                </div>
              )}
              {progressStyle === 'striped' && (
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full w-2/3 rounded-full bg-primary"
                    style={{
                      backgroundImage: 'repeating-linear-gradient(-45deg, transparent, transparent 4px, rgba(255,255,255,0.2) 4px, rgba(255,255,255,0.2) 8px)',
                    }}
                  />
                </div>
              )}
              {progressStyle === 'gradient' && (
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-primary to-primary/70" />
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground mb-2">토스트</p>
              <div className="flex flex-wrap gap-2">
                {TOAST_STYLES.map((s) => (
                  <Button
                    key={s.id}
                    variant={toastStyle === s.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setToastStyle(s.id)}
                  >
                    {s.name}
                  </Button>
                ))}
              </div>
            </div>
            <div
              className={cn(
                'px-4 py-3 max-w-sm',
                PREVIEW_RADIUS,
                toastStyle === 'default' && 'bg-card border shadow-lg',
                toastStyle === 'minimal' && 'bg-muted/80',
                toastStyle === 'bordered' && 'bg-card border-2 border-primary/30',
                toastStyle === 'floating' && 'bg-card border shadow-xl',
                toastStyle === 'inline' && 'bg-muted/50 border-l-4 border-l-primary'
              )}
            >
              <p className="text-sm">저장되었습니다.</p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground mb-2">드롭다운</p>
              <div className="flex flex-wrap gap-2">
                {DROPDOWN_STYLES.map((s) => (
                  <Button
                    key={s.id}
                    variant={dropdownStyle === s.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setDropdownStyle(s.id)}
                  >
                    {s.name}
                  </Button>
                ))}
              </div>
            </div>
            <div className="relative max-w-xs">
              <select
                className={cn(
                  'px-3 py-2 text-sm w-full',
                  PREVIEW_RADIUS,
                  dropdownStyle === 'default' && 'border border-input bg-background',
                  dropdownStyle === 'minimal' && 'border-0 bg-muted/50',
                  dropdownStyle === 'outline' && 'border-2 border-input bg-background',
                  dropdownStyle === 'filled' && 'border-0 bg-muted',
                  dropdownStyle === 'ghost' && 'border-0 bg-transparent'
                )}
              >
                <option>옵션 1</option>
                <option>옵션 2</option>
                <option>옵션 3</option>
              </select>
            </div>
          </div>
        </section>

        {/* 선택 결과 복사 */}
        <section className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
          <h2 className="text-sm font-medium">선택 결과 복사</h2>
          <p className="text-xs text-muted-foreground">
            아래 버튼을 누르면 현재 선택한 모든 항목이 마크다운 형식으로 복사됩니다. AI에게 전달해 반영하세요.
          </p>
          <Button onClick={copySelections} variant="secondary" size="sm">
            {copied ? '복사됨!' : '선택 항목 복사'}
          </Button>
        </section>

        <p className="text-xs text-muted-foreground pt-4 border-t border-border">
          결정되면 이 페이지는 삭제합니다. 선택한 값은 index.css와 컴포넌트에 반영하세요.
        </p>
      </div>
    </div>
  )
}
