# Step 2: home-page

## 읽어야 할 파일

먼저 아래 파일들을 읽고 설계 의도를 파악하라:

- `concept.jpg` — 프로젝트 루트. Read 도구로 열어 헤더·검색·통계·그리드 레이아웃을 직접 확인하라.
- `docs/UI_GUIDE.md`
- `frontend/src/index.css` (Step 0 CSS 클래스)
- `frontend/src/types/index.ts`
- `frontend/src/api/prompts.ts`
- `frontend/src/api/purchases.ts`
- `frontend/src/components/PromptCard.tsx` (Step 1에서 재설계된 버전)
- `frontend/src/components/FilterBar.tsx` (Step 1에서 재설계된 버전)
- `frontend/src/pages/HomePage.tsx` (기존 코드 확인 후 전면 교체)
- `frontend/src/App.tsx` (라우트 구조 확인)

## 작업

concept.jpg의 레이아웃을 기반으로 HomePage를 전면 재설계한다.

### concept.jpg 헤더 구조 분석

concept.jpg 상단에는 다음 요소가 있다:
1. **로고 영역**: 아이콘 + "Marketplace" 텍스트
2. **통계 카운터**: "8 AVAILABLE EXPERTS", "0 CURRENTLY HIRED" 형태의 숫자+라벨 카드
3. **검색 바**: 전체 너비에 가까운 입력 필드 ("Search by name, role, or skill...")
4. **필터 탭**: 수평으로 나열 (All Roles / PM / BackendDev / ...)
5. **카드 그리드**: 4열 (large), 2열 (mobile)

MarketPlace에 맞게 변환:
- 통계: "N개 프롬프트", "N건 구매됨" 숫자 카운터
- 검색: "프롬프트 제목, 태그로 검색..."
- 필터 탭: All / CLAUDE.md / Agent / Skill / Settings / Bundle

### HomePage.tsx 전면 교체

**`frontend/src/pages/HomePage.tsx`**

```
┌─────────────────────────────────────────────────────────┐
│  HEADER                                                  │
│  [🏪 Marketplace]              [N 프롬프트] [N 구매됨]  │
├─────────────────────────────────────────────────────────┤
│  [🔍 프롬프트 제목, 태그로 검색...]    [+ 등록하기]      │
│                                                          │
│  [All] [CLAUDE.md] [Agent] [Skill] [Settings] [Bundle]  │
│  [All Roles] [Developer] [Planner] [Designer]           │
├─────────────────────────────────────────────────────────┤
│  GRID (4열)                                             │
│  [Card] [Card] [Card] [Card]                            │
│  [Card] [Card] [Card] [Card]                            │
├─────────────────────────────────────────────────────────┤
│  페이지네이션 [이전] 1/N [다음]                          │
└─────────────────────────────────────────────────────────┘
```

#### 헤더 섹션

```tsx
<header className="bg-white border-b border-zinc-200 px-6 py-4">
  <div className="max-w-7xl mx-auto flex items-center justify-between">
    {/* 로고 */}
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center">
        {/* 상점 SVG 아이콘 */}
      </div>
      <span className="font-semibold text-zinc-900 text-lg">Marketplace</span>
    </div>
    {/* 통계 카운터 */}
    <div className="flex items-center gap-6">
      <StatCard label="AVAILABLE" value={totalCount} />
      <StatCard label="PURCHASED" value={purchasedCount} />
      {isLoggedIn && <UserMenu />}
    </div>
  </div>
</header>
```

StatCard 내부 컴포넌트 (HomePage.tsx 내부에 정의):
```tsx
// concept.jpg의 숫자+라벨 카드 형태
// value: 큰 숫자, label: 작은 대문자 라벨
```

#### 검색 + 등록 버튼

```tsx
<div className="flex items-center gap-3">
  <div className="relative flex-1">
    {/* 돋보기 아이콘 + input */}
    <input placeholder="프롬프트 제목, 태그, 설명으로 검색..." />
  </div>
  {isLoggedIn && (
    <button onClick={() => navigate('/upload')}>
      + 등록하기
    </button>
  )}
</div>
```

검색 input 스타일: `w-full bg-white border border-zinc-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400 shadow-sm`

debounce 300ms 적용 (useEffect + setTimeout으로 구현, 외부 라이브러리 금지).

#### 카드 그리드

```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
  {prompts.map(p => <PromptCard key={p.id} prompt={p} onClick={() => navigate(`/prompts/${p.id}`)} />)}
</div>
```

로딩 중: 스켈레톤 카드 8개 표시 (`animate-pulse bg-zinc-100 rounded-xl h-48`)

결과 없음: `"검색 결과가 없습니다"` 문구 + 필터 초기화 버튼

#### 페이지네이션

```tsx
<div className="flex items-center justify-center gap-2 mt-8">
  <button disabled={page === 0}>← 이전</button>
  <span>{page + 1} / {totalPages}</span>
  <button disabled={page >= totalPages - 1}>다음 →</button>
</div>
```

페이지 버튼 스타일: `px-4 py-2 text-sm border border-zinc-200 rounded-lg hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed`

#### 상태 관리

```typescript
const [type, setType] = useState<PromptType | undefined>(undefined)
const [targetRole, setTargetRole] = useState<TargetRole | undefined>(undefined)
const [keyword, setKeyword] = useState('')
const [debouncedKeyword, setDebouncedKeyword] = useState('')
const [page, setPage] = useState(0)
const [data, setData] = useState<PageResponse<PromptSummary> | null>(null)
const [loading, setLoading] = useState(true)
```

로그인 상태 판단: `localStorage.getItem('accessToken') !== null`

type 또는 targetRole 변경 시 page를 0으로 리셋.

#### 페이지 레이아웃 전체 구조

```tsx
<div className="min-h-screen bg-surface">
  <Header />                          {/* 흰 배경, 하단 border */}
  <main className="max-w-7xl mx-auto px-6 py-6 space-y-4">
    <SearchBar />
    <FilterBar ... />
    <Grid />
    <Pagination />
  </main>
</div>
```

## Acceptance Criteria

```bash
cd frontend && npm run build
```

## 검증 절차

1. `cd frontend && npm run build` 실행.
2. 체크리스트:
   - 헤더에 로고와 통계 카운터가 있는가?
   - 검색 입력에 debounce 300ms가 적용되었는가?
   - 타입/역할 필터 변경 시 page가 0으로 리셋되는가?
   - 로딩 중 스켈레톤이 표시되는가?
   - 그리드가 xl:grid-cols-4 반응형인가?
3. 결과에 따라 `phases/1-frontend-redesign/index.json`의 step 2를 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "HomePage 재설계 완료 — 헤더(로고+통계), 검색(debounce), 수평필터탭, 4열그리드, 페이지네이션"`
   - 수정 3회 후 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 수동 개입 필요 → `"status": "blocked"`, `"blocked_reason": "구체적 사유"`

## 금지사항

- 다크 모드 색상(`bg-[#0a0a0a]`, `text-neutral-*`)을 사용하지 마라.
- debounce 구현에 lodash 등 외부 라이브러리를 설치하지 마라. 이유: `useEffect + setTimeout`으로 충분하다.
- 통계 카운터(totalCount)를 별도 API 없이 `listPrompts()` 응답의 `totalElements`로 채워라. 이유: 추가 API 엔드포인트 없이 구현한다.
- 기존 테스트를 깨뜨리지 마라.
