# Step 3: detail-page

## 읽어야 할 파일

먼저 아래 파일들을 읽고 설계 의도를 파악하라:

- `concept.jpg` — 프로젝트 루트. Read 도구로 열어 카드 스타일·색상·버튼을 재확인하라.
- `docs/UI_GUIDE.md`
- `docs/ARCHITECTURE.md` (콘텐츠 접근 제어 흐름 확인)
- `frontend/src/index.css` (Step 0 CSS 클래스)
- `frontend/src/types/index.ts`
- `frontend/src/api/prompts.ts`
- `frontend/src/api/purchases.ts`
- `frontend/src/components/PromptPreview.tsx` (Step 1에서 재설계된 버전)
- `frontend/src/components/TagBadge.tsx` (Step 1에서 재설계된 버전)
- `frontend/src/pages/PromptDetailPage.tsx` (기존 코드 확인 후 전면 교체)
- `frontend/src/pages/HomePage.tsx` (Step 2의 헤더 패턴 참고)

## 작업

PromptDetailPage를 concept.jpg 색상 시스템에 맞게 전면 재설계한다.

### 레이아웃 구조

```
┌─────────────────────────────────────────────────────────┐
│  HEADER (Step 2와 동일한 공통 헤더)                     │
├─────────────────────────────────────────────────────────┤
│  ← 뒤로가기                                             │
│                                                          │
│  [아이콘+타입배지]  제목                  [Free / ₩가격] │
│                    TargetRole · 다운로드수               │
│                    태그 목록                             │
├────────────────────────────────┬────────────────────────┤
│  LEFT (flex-1)                 │  RIGHT (w-80 고정)     │
│                                │                        │
│  설명 섹션                     │  구매 패널             │
│  ─────────                     │  ┌──────────────────┐ │
│  미리보기                      │  │ 가격              │ │
│  [PromptPreview]               │  │ [구매하기 버튼]   │ │
│                                │  │  또는              │ │
│  (구매 후) 전체 내용           │  │ [다운로드 버튼]   │ │
│  [PromptPreview - full]        │  └──────────────────┘ │
└────────────────────────────────┴────────────────────────┘
```

### PromptDetailPage.tsx 전면 교체

**`frontend/src/pages/PromptDetailPage.tsx`**

#### 뒤로가기

```tsx
<button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 mb-6">
  ← 목록으로
</button>
```

#### 프롬프트 헤더 섹션

```tsx
<div className="flex items-start justify-between mb-6">
  <div className="flex items-start gap-4">
    {/* PromptType 아이콘 박스 (Step 1 PromptCard와 동일 스타일) */}
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${typeConfig.bg}`}>
      {typeConfig.icon}
    </div>
    <div>
      <h1 className="text-2xl font-semibold text-zinc-900">{prompt.title}</h1>
      <p className="text-sm text-zinc-400 mt-1">
        {typeLabel} {prompt.targetRole && `· ${roleLabel}`} · {prompt.downloadCount}회 다운로드
      </p>
      <div className="flex flex-wrap gap-1 mt-2">
        {prompt.tags.map(tag => <TagBadge key={tag} tag={tag} />)}
      </div>
    </div>
  </div>
  {/* 가격 배지 */}
  <span className={prompt.price === 0 ? 'mp-badge-free' : 'mp-badge-paid'}>
    {prompt.price === 0 ? 'Free' : `₩${prompt.price.toLocaleString()}`}
  </span>
</div>
```

#### 좌측 — 설명 + 미리보기

- 설명: `<p className="text-sm text-zinc-600 leading-relaxed">{prompt.description}</p>`
- 미리보기 제목: `<h2 className="text-sm font-medium text-zinc-500 uppercase tracking-wider mt-6 mb-3">미리보기</h2>`
- `<PromptPreview content={prompt.previewContent ?? ''} />`
- 구매 완료 후 전체 내용: 미리보기 아래에 구분선과 함께 `<PromptPreview content={prompt.content ?? ''} />` 추가 표시

#### 우측 — 구매 패널

```tsx
<div className="w-80 shrink-0">
  <div className="mp-card p-6 sticky top-6">
    <div className="text-2xl font-bold text-zinc-900 mb-1">
      {prompt.price === 0 ? '무료' : `₩${prompt.price.toLocaleString()}`}
    </div>
    <p className="text-xs text-zinc-400 mb-4">
      {prompt.price === 0 ? '로그인 후 바로 다운로드' : '구매 후 영구 이용 가능'}
    </p>

    {/* 미구매 + 비로그인 */}
    {!isLoggedIn && (
      <button onClick={() => navigate('/login')} className="mp-btn-terminal w-full justify-center">
        로그인하고 받기
      </button>
    )}

    {/* 미구매 + 로그인 + 타인 프롬프트 */}
    {isLoggedIn && !prompt.purchased && !isOwner && (
      <button onClick={handlePurchase} disabled={purchasing} className="mp-btn-terminal w-full justify-center">
        {purchasing ? '처리 중...' : (prompt.price === 0 ? '> marketplace get' : '> marketplace buy')}
      </button>
    )}

    {/* 구매 완료 */}
    {prompt.purchased && (
      <button onClick={handleDownload} className="mp-btn-terminal w-full justify-center bg-green-800 hover:bg-green-700">
        > marketplace download
      </button>
    )}

    {/* 내 프롬프트 */}
    {isOwner && (
      <button onClick={() => navigate(`/edit/${prompt.id}`)} className="...">
        수정하기
      </button>
    )}
  </div>
</div>
```

#### 구매/다운로드 처리 로직

```typescript
const handlePurchase = async () => {
  // purchasePrompt(id) 호출 → 성공 시 getPrompt(id) 재조회 (purchased: true로 갱신)
}

const handleDownload = async () => {
  // downloadPrompt(id) → Blob → URL.createObjectURL → <a> click → URL.revokeObjectURL
  // 파일명: `${prompt.title.replace(/\s+/g, '-')}.md`
}
```

#### 소유자 판단

```typescript
// localStorage에서 userId를 직접 얻을 수 없으므로,
// GET /api/users/me/prompts 결과에 해당 id가 있으면 isOwner = true
// 또는 /api/prompts/{id} 응답에 sellerId가 있으면 활용
```

#### 페이지 전체 레이아웃

```tsx
<div className="min-h-screen bg-surface">
  <Header />   {/* Step 2와 동일한 공통 헤더 컴포넌트로 분리 권장 */}
  <main className="max-w-7xl mx-auto px-6 py-6">
    <BackButton />
    <PromptHeader />
    <div className="flex gap-8 mt-6">
      <div className="flex-1 min-w-0">
        <Description />
        <Preview />
      </div>
      <PurchasePanel />
    </div>
  </main>
</div>
```

**공통 Header 컴포넌트 분리 권장**: `frontend/src/components/Header.tsx`로 분리해 HomePage와 DetailPage 모두에서 재사용. (로고 + 통계 없이 로고 + 네비게이션만 표시해도 무방)

## Acceptance Criteria

```bash
cd frontend && npm run build
```

## 검증 절차

1. `cd frontend && npm run build` 실행.
2. 체크리스트:
   - `purchased: false` 상태에서 `> marketplace get/buy` 버튼이 표시되는가?
   - `purchased: true` 상태에서 `> marketplace download` 버튼과 전체 content가 표시되는가?
   - 비로그인 상태에서 "로그인하고 받기" 버튼이 표시되는가?
   - 다운로드 후 `URL.revokeObjectURL()`이 호출되는가?
   - 구매 패널이 `sticky top-6`으로 스크롤 시 고정되는가?
3. 결과에 따라 `phases/1-frontend-redesign/index.json`의 step 3을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "PromptDetailPage 재설계 완료 — 라이트모드, 좌우 패널, 터미널버튼(get/buy/download), 구매패널 sticky, Header 컴포넌트 분리"`
   - 수정 3회 후 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 수동 개입 필요 → `"status": "blocked"`, `"blocked_reason": "구체적 사유"`

## 금지사항

- `getContentForDownload`를 프론트엔드에서 직접 조건으로 판단하지 마라. 이유: `purchased` 필드는 서버 응답(`PromptDetailResponse.purchased`)을 신뢰한다.
- 다운로드 후 `URL.revokeObjectURL()` 정리를 생략하지 마라. 이유: 메모리 누수를 유발한다.
- 다크 모드 색상을 사용하지 마라.
- 기존 테스트를 깨뜨리지 마라.
