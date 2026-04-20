# Step 4: form-pages

## 읽어야 할 파일

먼저 아래 파일들을 읽고 설계 의도를 파악하라:

- `concept.jpg` — 프로젝트 루트. Read 도구로 열어 색상 시스템을 재확인하라.
- `docs/UI_GUIDE.md`
- `docs/PRD.md`
- `frontend/src/index.css` (Step 0 CSS 클래스)
- `frontend/src/types/index.ts`
- `frontend/src/api/prompts.ts`
- `frontend/src/api/purchases.ts`
- `frontend/src/components/Header.tsx` (Step 3에서 분리된 공통 헤더)
- `frontend/src/pages/LoginPage.tsx` (기존 코드 확인 후 재설계)
- `frontend/src/pages/CallbackPage.tsx` (로직 유지, 스타일만 변경)
- `frontend/src/pages/UploadPage.tsx` (기존 코드 확인 후 재설계)
- `frontend/src/pages/MyPage.tsx` (기존 코드 확인 후 재설계)

## 작업

나머지 페이지들을 concept.jpg 색상 시스템에 맞게 재설계한다.

---

### LoginPage.tsx 재설계

라이트 모드 중앙 정렬 레이아웃.

```
┌─────────────────────────────────────┐
│         (흰 배경, 전체 화면)         │
│                                     │
│   🏪 Marketplace                    │
│   Claude Code 프롬프트 마켓         │
│                                     │
│   ┌─────────────────────────────┐   │
│   │  [G] Google로 시작하기      │   │
│   └─────────────────────────────┘   │
│                                     │
│   개발자를 위한 Claude Code 설정    │
│   파일을 사고파는 마켓플레이스       │
└─────────────────────────────────────┘
```

- 배경: `min-h-screen bg-surface flex items-center justify-center`
- 카드: `.mp-card p-10 w-full max-w-sm`
- 로고: 아이콘 + "Marketplace" (Step 2 헤더와 동일 스타일)
- 설명: `text-sm text-zinc-500 text-center mt-2 mb-8`
- Google 버튼: `w-full border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-900 text-sm font-medium py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm`
- Google 아이콘: SVG 인라인 (G 로고, 18x18)
- 클릭 시: `window.location.href = '/oauth2/authorization/google'`

---

### CallbackPage.tsx 수정

로직은 변경하지 않는다. 스타일만 라이트 모드로 변경:
- 로딩 텍스트: `text-zinc-500` 색상 적용
- 배경: `bg-surface`

---

### UploadPage.tsx 재설계

판매자 프롬프트 등록 폼.

```
┌──────────────────────────────────────────────────────────┐
│  HEADER                                                  │
├──────────────────────────────────────────────────────────┤
│  프롬프트 등록                                           │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │  제목 *                                            │  │
│  │  [입력 필드]                                       │  │
│  │                                                    │  │
│  │  타입 *          역할                 가격         │  │
│  │  [탭 선택]       [탭 선택]            [0 = 무료]   │  │
│  │                                                    │  │
│  │  설명                                              │  │
│  │  [textarea, 3줄]                                   │  │
│  │                                                    │  │
│  │  프롬프트 내용 * (50KB 이하)         12,345 bytes  │  │
│  │  [textarea, 16줄, monospace]                       │  │
│  │  [████████████████░░░░] 24% 사용                  │  │
│  │                                                    │  │
│  │  태그 (엔터로 추가)                                │  │
│  │  [입력] [tag1 ×] [tag2 ×]                         │  │
│  │                                                    │  │
│  │          [취소]   [> marketplace publish]          │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

#### 주요 스타일

- 페이지: `min-h-screen bg-surface`
- 폼 컨테이너: `max-w-3xl mx-auto px-6 py-8`
- 폼 카드: `.mp-card p-8`
- 제목: `text-xl font-semibold text-zinc-900 mb-6`
- 라벨: `text-sm font-medium text-zinc-700 mb-1.5 block`
- 입력 필드: `w-full border border-zinc-200 rounded-xl px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-400 bg-white`
- content textarea: 위 스타일 + `font-mono resize-none h-64`
- 타입 선택: `.mp-tab-active` / `.mp-tab-inactive` 버튼 그룹 (radio 스타일)
- 가격 입력: `type="number" min="0"` + "₩" prefix

#### content 바이트 카운터 + 프로그레스 바

```tsx
const MAX_BYTES = 51200  // 50KB
const contentBytes = new TextEncoder().encode(content).length
const usagePercent = Math.min((contentBytes / MAX_BYTES) * 100, 100)

// 프로그레스 바
<div className="w-full bg-zinc-100 rounded-full h-1.5 mt-2">
  <div
    className={`h-1.5 rounded-full transition-all ${usagePercent > 90 ? 'bg-red-500' : 'bg-zinc-900'}`}
    style={{ width: `${usagePercent}%` }}
  />
</div>
<span className="text-xs text-zinc-400">
  {contentBytes.toLocaleString()} / {MAX_BYTES.toLocaleString()} bytes
</span>
```

#### 태그 입력

- Enter 또는 쉼표(,)로 태그 추가
- 태그 표시: `bg-zinc-100 text-zinc-600 text-xs px-2 py-0.5 rounded-full flex items-center gap-1`
- × 버튼: `text-zinc-400 hover:text-zinc-600 ml-1`

#### 제출 버튼

```tsx
<button
  disabled={!title || !content || contentBytes > MAX_BYTES || !type || submitting}
  className="mp-btn-terminal px-8 disabled:opacity-40 disabled:cursor-not-allowed"
>
  {submitting ? '등록 중...' : '> marketplace publish'}
</button>
```

---

### MyPage.tsx 재설계

```
┌──────────────────────────────────────────────────────────┐
│  HEADER                                                  │
├──────────────────────────────────────────────────────────┤
│  마이페이지                                              │
│                                                          │
│  [구매한 프롬프트] [내가 등록한 프롬프트]  ← 탭          │
│                                                          │
│  그리드 (구매 또는 판매 프롬프트 카드)                  │
│  각 카드는 PromptCard 재사용                             │
│  판매 탭에서는 카드 하단에 [수정] [삭제] 버튼 추가       │
└──────────────────────────────────────────────────────────┘
```

- 탭: `.mp-tab-active` / `.mp-tab-inactive`
- 그리드: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4`
- 판매 탭 카드 오버레이 버튼:
  ```tsx
  <div className="flex gap-2 mt-3 pt-3 border-t border-zinc-100">
    <button onClick={() => navigate(`/edit/${p.id}`)} className="text-xs text-zinc-500 hover:text-zinc-900">수정</button>
    <button onClick={() => handleDelete(p.id)} className="text-xs text-red-400 hover:text-red-600">삭제</button>
  </div>
  ```
- 삭제 확인: `window.confirm('이 프롬프트를 삭제하시겠습니까?')` 사용
- 빈 상태: "아직 {구매한/등록한} 프롬프트가 없습니다" + 홈으로 가기 링크

---

## Acceptance Criteria

```bash
cd frontend && npm run build
```

## 검증 절차

1. `cd frontend && npm run build` 실행.
2. 체크리스트:
   - `LoginPage`가 라이트 모드 중앙 정렬 카드 레이아웃인가?
   - `UploadPage`에서 50KB 초과 시 제출 버튼이 비활성화되는가?
   - `UploadPage` content textarea가 `font-mono`인가?
   - `MyPage`의 탭 전환이 동작하는가?
   - 판매 탭에서 삭제 시 `window.confirm`이 표시되는가?
   - 다크 모드 색상(`#0a0a0a`, `neutral-*`)이 신규 코드에 없는가?
3. 결과에 따라 `phases/1-frontend-redesign/index.json`의 step 4를 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "LoginPage(라이트모드 중앙카드) + CallbackPage(스타일) + UploadPage(바이트카운터+프로그레스바+태그입력) + MyPage(탭+그리드) 재설계 완료"`
   - 수정 3회 후 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 수동 개입 필요 → `"status": "blocked"`, `"blocked_reason": "구체적 사유"`

## 금지사항

- 다크 모드 색상(`bg-[#0a0a0a]`, `text-neutral-*`, `border-neutral-*`)을 신규 코드에 사용하지 마라.
- `window.confirm` 외의 커스텀 모달을 이 step에서 구현하지 마라. 이유: MVP 범위를 벗어난다.
- `CallbackPage`의 토큰 파싱·저장 로직을 변경하지 마라. 이유: 인증 흐름이 깨질 수 있다.
- 기존 테스트를 깨뜨리지 마라.
