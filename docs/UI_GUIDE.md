# UI 디자인 가이드

## 디자인 원칙
1. **에디터처럼 보여야 한다** — 타겟이 개발자/기획자다. VS Code, GitHub, 터미널에 익숙한 사람들. 코드 블록과 monospace 텍스트가 자연스럽게 느껴져야 한다.
2. **탐색 중심** — GitHub Marketplace처럼 필터·검색·카드 목록이 핵심 UI. 마케팅 카피 최소화.
3. **다크 고정 + amber 포인트** — 터미널·에디터 느낌의 다크 배경. 포인트는 amber 1색만.

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

## 색상
### 배경
| 용도 | 값 |
|------|------|
| 페이지 | #0a0a0a |
| 카드/패널 | #141414 |
| 코드 블록 미리보기 | #0d0d0d |
| 호버 | #1a1a1a |

### 텍스트
| 용도 | 값 |
|------|------|
| 주 텍스트 | text-white |
| 본문 | text-neutral-300 |
| 보조 | text-neutral-400 |
| 비활성/플레이스홀더 | text-neutral-500 |
| 코드/monospace | text-neutral-200 font-mono |

### 시맨틱 색상
| 용도 | 값 |
|------|------|
| 가격/포인트/다운로드수 | #f59e0b (amber-500) |
| 무료 배지 | #22c55e |
| 에러 | #ef4444 |
| 타입 배지 배경 | neutral-800 |

## 타입 배지 색상
프롬프트 타입별로 구분되는 배지:
| 타입 | 배지 스타일 |
|------|------------|
| CLAUDE.md | bg-amber-900/20 text-amber-400 border-amber-900 |
| Agent | bg-blue-900/20 text-blue-400 border-blue-900 |
| Skill | bg-green-900/20 text-green-400 border-green-900 |
| Settings | bg-neutral-800 text-neutral-400 border-neutral-700 |
| Bundle | bg-purple-900/20 text-purple-400 border-purple-900 |

(purple은 타입 구분 목적으로만 사용. 브랜드 색상 사용 금지)

## 컴포넌트
### 프롬프트 카드
```
rounded-lg bg-[#141414] border border-neutral-800 p-4
hover:border-neutral-700 transition-colors cursor-pointer
```
카드 내부 구성: 타입 배지 + 제목 + 설명 2줄 clamp + 태그 + 가격/다운로드수

### 코드 블록 미리보기 (PromptPreview)
```
rounded-md bg-[#0d0d0d] border border-neutral-800 p-4
font-mono text-sm text-neutral-300 leading-relaxed
overflow-hidden max-h-64 relative
```
하단 페이드 아웃 처리: `after:absolute after:bottom-0 after:inset-x-0 after:h-16 after:bg-gradient-to-t after:from-[#0d0d0d]`

### 버튼
```
Primary (구매/다운로드): rounded-lg bg-white text-black font-medium hover:bg-neutral-200 px-4 py-2 transition-colors
Amber (강조 CTA):        rounded-lg bg-amber-500 text-black font-medium hover:bg-amber-400 px-4 py-2 transition-colors
Text:                    text-neutral-500 hover:text-neutral-300 transition-colors text-sm
```

### 입력/검색 필드
```
rounded-lg bg-neutral-900 border border-neutral-800 px-4 py-2.5 text-sm text-white
placeholder:text-neutral-600 focus:outline-none focus:border-neutral-600 transition-colors
```

### 필터 탭 (타입/역할 선택)
```
선택됨: rounded-md bg-neutral-800 text-white px-3 py-1.5 text-sm font-medium
미선택: text-neutral-500 hover:text-neutral-300 px-3 py-1.5 text-sm transition-colors
```

## 레이아웃
- 전체 너비: max-w-6xl mx-auto px-4
- 프롬프트 그리드: grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4
- 사이드 필터 + 메인 콘텐츠: flex gap-6 (필터 w-48 고정, 콘텐츠 flex-1)
- 섹션 간격: space-y-6

## 타이포그래피
| 용도 | 스타일 |
|------|--------|
| 페이지 제목 | text-2xl font-semibold text-white |
| 카드 제목 | text-sm font-medium text-white leading-snug |
| 카드 설명 | text-xs text-neutral-400 line-clamp-2 |
| 가격 | text-sm font-semibold text-amber-500 |
| 다운로드수 | text-xs text-neutral-500 |
| 코드/파일명 | font-mono text-sm |
| 섹션 라벨 | text-xs font-medium text-neutral-500 uppercase tracking-wider |

## 애니메이션
- 카드 hover: border-color transition 150ms ease-out
- 버튼 hover: background-color transition 150ms ease-out
- 페이지 진입: opacity 0 → 1, 200ms ease-out
- 그 외 모든 애니메이션 금지 (slide, bounce, pulse, spin 등)

## 아이콘
- SVG 인라인 사용, strokeWidth 1.5
- 아이콘 컨테이너(둥근 배경 박스)로 감싸지 않는다
- 크기: w-4 h-4 (인라인), w-4 h-4 (버튼 내부 아이콘)
- 다운로드 아이콘, 파일 아이콘, 태그 아이콘 정도만 사용
