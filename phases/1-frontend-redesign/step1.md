# Step 1: shared-components

## 읽어야 할 파일

먼저 아래 파일들을 읽고 설계 의도를 파악하라:

- `concept.jpg` — 프로젝트 루트. Read 도구로 열어 카드·배지·버튼 디자인을 직접 확인하라.
- `docs/UI_GUIDE.md`
- `docs/PRD.md` (PromptType 5종 확인)
- `frontend/src/index.css` (Step 0에서 추가된 CSS 컴포넌트 클래스 확인)
- `frontend/tailwind.config.js` (Step 0에서 추가된 색상 토큰 확인)
- `frontend/src/types/index.ts`
- `frontend/src/components/PromptCard.tsx` (기존 코드 확인 후 전면 교체)
- `frontend/src/components/FilterBar.tsx` (기존 코드 확인 후 전면 교체)
- `frontend/src/components/PromptPreview.tsx`
- `frontend/src/components/TagBadge.tsx`

이전 step에서 만들어진 CSS 클래스(`.mp-card`, `.mp-btn-terminal`, `.mp-tab-active` 등)를 적극 활용하라.

## 작업

concept.jpg의 카드 레이아웃을 분석해 공통 컴포넌트를 재설계한다.

### concept.jpg 카드 구조 분석

concept.jpg의 각 카드는 다음 구조를 가진다:
1. **우상단**: "Available" 배지 (초록색)
2. **좌상단**: 아이콘 (카테고리별 색상, 작은 정사각형 border 있음)
3. **제목**: 크고 굵은 텍스트
4. **서브타이틀**: `카테고리 · Lv. 1 Start` 형태 (작은 회색 텍스트)
5. **설명**: 2줄 이내 본문 텍스트
6. **하단 CTA**: 터미널 스타일 버튼 (`> aistaff hire {slug}` 형태)

MarketPlace에 맞게 변환:
- "Available" → 무료면 "Free", 유료면 가격 표시
- 카테고리 → PromptType (CLAUDE_MD / AGENT / SKILL / SETTINGS / BUNDLE)
- "Lv. 1 Start" → TargetRole (DEVELOPER / PLANNER / DESIGNER)
- CTA → `> marketplace buy {promptId}` (터미널 스타일)

### PromptCard.tsx 전면 교체

**`frontend/src/components/PromptCard.tsx`**

props: `prompt: PromptSummary`, `onClick: () => void`

레이아웃 구조:
```
┌─────────────────────────────┐
│ [아이콘]          [Free/₩가격] │  ← 상단 행
│                              │
│ 제목 (font-semibold, 1줄)    │
│ PromptType · TargetRole     │  ← 작은 회색
│                              │
│ 설명 (2줄 clamp)             │
│                              │
│ ───────────────────────────  │
│ [> marketplace buy {id}]    │  ← 터미널 버튼 (전체 너비)
└─────────────────────────────┘
```

- 카드 전체: `.mp-card p-5 cursor-pointer`
- 아이콘: PromptType별 SVG 아이콘 (인라인, 24x24, strokeWidth 1.5). 아이콘 배경 박스(`rounded-lg w-10 h-10 flex items-center justify-center`) — type별 색상:
  - CLAUDE_MD: `bg-amber-50` 배경, `text-amber-600` 아이콘
  - AGENT: `bg-blue-50` 배경, `text-blue-600` 아이콘
  - SKILL: `bg-green-50` 배경, `text-green-600` 아이콘
  - SETTINGS: `bg-zinc-100` 배경, `text-zinc-500` 아이콘
  - BUNDLE: `bg-purple-50` 배경, `text-purple-600` 아이콘
- 가격 배지: `price === 0` → `.mp-badge-free` ("Free"), 유료 → `.mp-badge-paid` ("₩{price}")
- 제목: `text-base font-semibold text-zinc-900 mt-3 leading-snug`
- 서브: `text-xs text-zinc-400 mt-0.5` — `{PromptType 한글} · {TargetRole 한글}` (null이면 생략)
- 설명: `text-sm text-zinc-500 mt-2 line-clamp-2 leading-relaxed`
- 구분선: `border-t border-zinc-100 mt-4 pt-4`
- CTA 버튼: `.mp-btn-terminal w-full justify-center` — 텍스트: `> marketplace get {prompt.id}`

PromptType 한글 매핑: `{ CLAUDE_MD: 'CLAUDE.md', AGENT: 'Agent', SKILL: 'Skill', SETTINGS: 'Settings', BUNDLE: 'Bundle' }`
TargetRole 한글 매핑: `{ DEVELOPER: 'Developer', PLANNER: 'Planner', DESIGNER: 'Designer' }`

### FilterBar.tsx 전면 교체

**`frontend/src/components/FilterBar.tsx`**

concept.jpg의 수평 탭 형태로 변경. 사이드바 레이아웃 완전 제거.

props:
```typescript
interface FilterBarProps {
  type: PromptType | undefined
  targetRole: TargetRole | undefined
  keyword: string
  onTypeChange: (type: PromptType | undefined) => void
  onRoleChange: (role: TargetRole | undefined) => void
  onKeywordChange: (keyword: string) => void
}
```

레이아웃:
```
[All] [CLAUDE.md] [Agent] [Skill] [Settings] [Bundle]    (타입 탭)
[All Roles] [Developer] [Planner] [Designer]              (역할 탭)
```

- 탭 컨테이너: `flex items-center gap-1 flex-wrap`
- 활성 탭: `.mp-tab-active`
- 비활성 탭: `.mp-tab-inactive`
- 두 행은 `space-y-2`로 구분

### TagBadge.tsx 수정

**`frontend/src/components/TagBadge.tsx`**

라이트 모드에 맞게 스타일 변경:
```
@apply bg-zinc-100 text-zinc-500 text-xs px-2 py-0.5 rounded-full
```

### PromptPreview.tsx 수정

**`frontend/src/components/PromptPreview.tsx`**

라이트 모드 코드 블록 스타일로 변경:
- 컨테이너: `rounded-lg bg-zinc-50 border border-zinc-200 p-4`
- 텍스트: `font-mono text-sm text-zinc-700 leading-relaxed`
- 최대 높이: `max-h-60 overflow-hidden relative`
- 하단 페이드: `after:absolute after:bottom-0 after:inset-x-0 after:h-12 after:bg-gradient-to-t after:from-zinc-50`

## Acceptance Criteria

```bash
cd frontend && npm run build
```

## 검증 절차

1. `cd frontend && npm run build` 실행.
2. 체크리스트:
   - `PromptCard`가 `.mp-card` + `.mp-btn-terminal` 클래스를 사용하는가?
   - PromptType별 아이콘 색상이 각각 다른가?
   - `FilterBar`가 수평 탭 구조인가? (사이드바 아님)
   - `price === 0`일 때 "Free" 배지가 표시되는가?
3. 결과에 따라 `phases/1-frontend-redesign/index.json`의 step 1을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "PromptCard(터미널CTA+타입별아이콘+Free배지) + FilterBar(수평탭) + PromptPreview(라이트모드) + TagBadge 재설계 완료"`
   - 수정 3회 후 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 수동 개입 필요 → `"status": "blocked"`, `"blocked_reason": "구체적 사유"`

## 금지사항

- `bg-[#0a0a0a]`, `bg-[#141414]`, `text-neutral-*` 등 이전 다크 모드 색상을 사용하지 마라. 이유: concept.jpg는 라이트 모드 기반이다.
- 아이콘을 외부 라이브러리(lucide-react, heroicons 패키지 등)로 설치하지 마라. 이유: 의존성 추가는 승인이 필요하다. SVG 인라인으로 작성한다.
- 페이지 컴포넌트(HomePage 등)를 이 step에서 수정하지 마라.
- 기존 테스트를 깨뜨리지 마라.
