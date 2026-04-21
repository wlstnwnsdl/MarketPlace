# UI 디자인 가이드

## 디자인 원칙
1. **에디터처럼 보여야 한다** — 타겟이 개발자/기획자다. VS Code, GitHub, 터미널에 익숙한 사람들. 코드 블록과 monospace 텍스트가 자연스럽게 느껴져야 한다.
2. **탐색 중심** — GitHub Marketplace처럼 필터·검색·카드 목록이 핵심 UI. 마케팅 카피 최소화.
3. **라이트 고정 + 터미널 포인트** — zinc 계열 밝은 배경. 포인트는 터미널 버튼(zinc-900)과 초록 Available 배지.

> **주의**: CLAUDE.md에 구버전 스펙("다크 모드 고정, amber 포인트")이 남아 있다. **이 UI_GUIDE.md가 최신 기준**이다. CLAUDE.md의 해당 항목은 무시한다.

## AI 슬롭 안티패턴 — 하지 마라
| 금지 사항 | 이유 |
|-----------|------|
| backdrop-filter: blur() | glass morphism은 AI 템플릿의 가장 흔한 징후 |
| gradient-text (배경 그라데이션 텍스트) | AI가 만든 SaaS 랜딩의 1번 특징 |
| "Powered by AI" 배지 | 기능이 아니라 장식. 사용자에게 가치 없음 |
| box-shadow 글로우 애니메이션 | 네온 글로우 = AI 슬롭 |
| 보라/인디고 브랜드 색상 | "AI = 보라색" 클리셰 |
| 모든 카드에 동일한 rounded-2xl | 균일한 둥근 모서리는 템플릿 느낌 |
| 배경 gradient orb (blur-3xl 원형) | 모든 AI 랜딩 페이지에 있는 장식 |

## 색상 (라이트 모드 고정)

### 배경
| 용도 | 값 |
|------|------|
| 페이지 | #f4f4f5 (zinc-100) |
| 카드 | #ffffff |
| 테두리 | #e4e4e7 (zinc-200) |
| 호버 배경 | #f1f1f1 (zinc-100) |

### 텍스트
| 용도 | 값 |
|------|------|
| 주 텍스트 | #18181b (zinc-900) |
| 보조 | #71717a (zinc-500) |
| 비활성/플레이스홀더 | #a1a1aa (zinc-400) |
| 코드/monospace | #18181b font-mono |

### 시맨틱 색상
| 용도 | 값 |
|------|------|
| Available/무료 배지 bg | #f0fdf4 (green-50) |
| Available/무료 배지 text | #15803d (green-700) |
| Available/무료 배지 border | #bbf7d0 (green-200) |
| 유료 배지 bg | #f4f4f5 (zinc-100) |
| 유료 배지 text | #52525b (zinc-600) |
| 터미널 버튼 bg | #18181b (zinc-900) |
| 터미널 버튼 text | #ffffff |
| 에러 | #ef4444 |

## 타입 배지 색상
프롬프트 타입별로 구분되는 배지:
| 타입 | 배지 스타일 |
|------|------------|
| CLAUDE.md | bg-amber-50 text-amber-700 border-amber-200 |
| Agent | bg-blue-50 text-blue-700 border-blue-200 |
| Skill | bg-green-50 text-green-700 border-green-200 |
| Settings | bg-zinc-100 text-zinc-600 border-zinc-200 |
| Bundle | bg-purple-50 text-purple-700 border-purple-200 |

(purple은 타입 구분 목적으로만 사용. 브랜드 색상 사용 금지)

## 컴포넌트
### 프롬프트 카드 (.mp-card)
```
bg-white border border-zinc-200 rounded-xl shadow-sm
hover:shadow-md transition-shadow cursor-pointer
```
카드 내부 구성: 타입 배지 + 제목 + 설명 2줄 clamp + 태그 + 가격/다운로드수

### 터미널 CTA 버튼 (.mp-btn-terminal)
```
bg-zinc-900 text-white text-xs font-mono px-4 py-2 rounded-lg
hover:bg-zinc-700 transition-colors flex items-center gap-2
```
버튼 내부: `>_` 프리픽스 + 커맨드 텍스트 (예: `aistaff hire startup-pm`)

### 버튼 (일반)
```
Primary: rounded-lg bg-zinc-900 text-white font-medium hover:bg-zinc-700 px-4 py-2 transition-colors
Secondary: rounded-lg border border-zinc-200 text-zinc-700 hover:bg-zinc-50 px-4 py-2 transition-colors
Text: text-zinc-500 hover:text-zinc-900 transition-colors text-sm
```

### 입력/검색 필드
```
rounded-lg bg-white border border-zinc-200 px-4 py-2.5 text-sm text-zinc-900
placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400 transition-colors
```

### 필터 탭 (타입/역할 선택)
```
선택됨 (.mp-tab-active): bg-zinc-900 text-white text-sm font-medium px-4 py-1.5 rounded-full
미선택 (.mp-tab-inactive): text-zinc-500 text-sm hover:text-zinc-900 px-4 py-1.5 rounded-full hover:bg-zinc-100 transition-colors
```

## 레이아웃
- 전체 너비: max-w-6xl mx-auto px-4
- 프롬프트 그리드: grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4
- 사이드 필터 + 메인 콘텐츠: flex gap-6 (필터 w-48 고정, 콘텐츠 flex-1)
- 섹션 간격: space-y-6

## 타이포그래피
| 용도 | 스타일 |
|------|--------|
| 페이지 제목 | text-2xl font-semibold text-zinc-900 |
| 카드 제목 | text-sm font-medium text-zinc-900 leading-snug |
| 카드 설명 | text-xs text-zinc-500 line-clamp-2 |
| 역할 레이블 | text-xs text-zinc-400 font-mono |
| 코드/파일명 | font-mono text-sm |
| 섹션 라벨 | text-xs font-medium text-zinc-400 uppercase tracking-wider |

## 애니메이션
- 카드 hover: shadow transition 150ms ease-out
- 버튼 hover: background-color transition 150ms ease-out
- 페이지 진입: opacity 0 → 1, 200ms ease-out
- 그 외 모든 애니메이션 금지 (slide, bounce, pulse, spin 등)

## 아이콘
- SVG 인라인 사용, strokeWidth 1.5
- 아이콘 컨테이너(둥근 배경 박스)로 감싸지 않는다
- 크기: w-4 h-4 (인라인), w-4 h-4 (버튼 내부 아이콘)
- 터미널 `>_` 프롬프트 아이콘을 CTA 버튼 prefix로 사용
