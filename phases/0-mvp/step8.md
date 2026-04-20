# Step 8: frontend-pages

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `CLAUDE.md`
- `docs/UI_GUIDE.md` (색상, 컴포넌트 스펙, 타이포그래피, 안티패턴 모두 숙지)
- `docs/PRD.md` (핵심 기능, MVP 제외 사항)
- `frontend/src/types/index.ts` (Step 7에서 생성)
- `frontend/src/api/prompts.ts` (Step 7에서 생성)
- `frontend/src/api/purchases.ts` (Step 7에서 생성)
- `frontend/src/App.tsx` (Step 7에서 생성 — 라우트 구조 확인)

이전 step에서 만들어진 API 함수와 타입을 그대로 사용하라. 새로운 API 함수를 추가하지 마라.

## 작업

이 step에서는 모든 페이지 컴포넌트와 공통 UI 컴포넌트를 구현한다.

**디자인 원칙 (UI_GUIDE.md에서):**
- 다크 모드 고정. 배경 `#0a0a0a`, 카드 `#141414`
- amber 포인트 1색 (`text-amber-500`)
- 도구적 UI — 장식 최소화, 정보 밀도 중심
- AI 슬롭 안티패턴 전면 금지 (backdrop-blur, gradient-text, glow, 보라색 등)

---

### 공통 컴포넌트

**`frontend/src/components/PromptCard.tsx`**

프롬프트 목록 카드. props: `prompt: PromptSummary`, `onClick: () => void`

레이아웃:
- 카드: `rounded-lg bg-[#141414] border border-neutral-800 p-4 hover:border-neutral-700 transition-colors cursor-pointer`
- 상단: 타입 배지(UI_GUIDE의 타입별 색상) + 무료/가격 표시 (우측 정렬)
- 중단: 제목 (`text-sm font-medium text-white`), 설명 2줄 clamp (`text-xs text-neutral-400 line-clamp-2`)
- 하단: 태그 목록 + 다운로드 수 (`text-xs text-neutral-500`)

**`frontend/src/components/TagBadge.tsx`**

props: `tag: string`
스타일: `rounded-full bg-neutral-800 text-neutral-400 px-2 py-0.5 text-xs`

**`frontend/src/components/PromptPreview.tsx`**

코드 블록 스타일 미리보기. props: `content: string`

스타일:
- `rounded-md bg-[#0d0d0d] border border-neutral-800 p-4 font-mono text-sm text-neutral-300 leading-relaxed`
- 최대 높이 `max-h-64 overflow-hidden` + 하단 페이드 아웃 (`after` 가상 요소)
- 하단에 "구매 후 전체 내용을 확인할 수 있습니다" 문구 표시

**`frontend/src/components/FilterBar.tsx`**

타입 + 역할 필터. props: `type: PromptType | undefined`, `targetRole: TargetRole | undefined`, `onTypeChange`, `onRoleChange`

타입 버튼: 전체 / CLAUDE_MD / AGENT / SKILL / SETTINGS / BUNDLE
역할 버튼: 전체 / 개발자 / 기획자 / 디자이너

선택된 항목: `rounded-md bg-neutral-800 text-white px-3 py-1.5 text-sm font-medium`
미선택: `text-neutral-500 hover:text-neutral-300 px-3 py-1.5 text-sm transition-colors`

**`frontend/src/components/PrivateRoute.tsx`** (Step 7에서 placeholder 생성, 이 step에서 완성)

---

### 페이지

**`frontend/src/pages/LoginPage.tsx`**

- 화면 중앙 정렬 (로그인 페이지는 중앙 정렬 허용)
- 프로젝트명 + 한 줄 설명 ("Claude Code 프롬프트를 사고파는 곳")
- "Google로 시작하기" 버튼 → `window.location.href = '/oauth2/authorization/google'`
- 버튼 스타일: `Primary` (UI_GUIDE 참조)

**`frontend/src/pages/CallbackPage.tsx`**

- URL 쿼리스트링에서 `accessToken`, `refreshToken` 파싱
- localStorage에 저장 후 `/`로 `navigate()` 리다이렉트
- 토큰이 없으면 `/login`으로 리다이렉트
- 로딩 중 빈 화면 또는 짧은 텍스트("인증 중...") 표시

**`frontend/src/pages/HomePage.tsx`**

레이아웃: 좌측 필터바 (`w-48 shrink-0`) + 우측 콘텐츠 (`flex-1`)

기능:
- `FilterBar`로 type, targetRole 상태 관리
- 키워드 검색 입력 필드 (debounce 300ms 권장)
- `listPrompts()` 호출 → `PromptCard` 그리드 렌더링
  - 그리드: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4`
- 페이지네이션: "이전" / "다음" 버튼 (page 상태 관리)
- 카드 클릭 시 `/prompts/{id}`로 이동
- 로딩 중 스켈레톤 또는 "로딩 중..." 텍스트 표시

우상단: 로그인 상태면 "프롬프트 등록" 버튼 + "마이페이지" 링크, 비로그인이면 "로그인" 링크

**`frontend/src/pages/PromptDetailPage.tsx`**

URL 파라미터: `:id`

기능:
- `getPrompt(id)` 호출
- 좌측: 프롬프트 정보 (제목, 타입 배지, 설명, 태그, 판매자 정보, 가격/무료 표시)
- 우측 패널:
  - 미구매 상태 (`purchased: false`): `PromptPreview`(previewContent 표시) + "구매하기" 버튼
  - 구매 완료 상태 (`purchased: true`): `PromptPreview`(content 전체 표시) + "다운로드" 버튼
- "구매하기" 버튼 클릭 → `purchasePrompt(id)` 호출 → 성공 시 페이지 재조회
- "다운로드" 버튼 클릭 → `downloadPrompt(id)` 호출 → Blob URL로 파일 다운로드
  - `URL.createObjectURL(blob)` → `<a>` 태그 클릭 → `URL.revokeObjectURL()` 정리
- 비로그인 상태에서 "구매하기" 클릭 시 `/login`으로 리다이렉트
- 자기 자신의 프롬프트인 경우 (`prompt.sellerId === 내 userId`) 구매 버튼 대신 "수정" 버튼 표시

**`frontend/src/pages/UploadPage.tsx`**

로그인 필요 (PrivateRoute로 보호됨)

기능:
- 제목, 설명, content(textarea), 타입 선택, 역할 선택, 가격(0=무료), 태그 입력 폼
- content 입력 시 실시간 바이트 수 표시 ("12,345 / 51,200 bytes")
- 50KB 초과 시 버튼 비활성화 + 경고 텍스트
- 제출 → `createPrompt()` 호출 → 성공 시 `/prompts/{id}`로 이동
- 태그 입력: 엔터 또는 쉼표로 태그 추가, x 버튼으로 삭제

**`frontend/src/pages/MyPage.tsx`**

로그인 필요.

탭 2개: "구매 내역" | "판매 목록"
- 구매 내역: `getMyPurchases()`로 promptId 목록 조회 → 각 id로 `getPrompt()` 조회 → `PromptCard` 목록 표시
- 판매 목록: `getMyPrompts()` → `PromptCard` 목록 + 각 카드에 "수정" / "삭제" 버튼

---

## Acceptance Criteria

```bash
cd frontend && npm run build
```

타입 에러 없이 빌드 성공해야 한다.

## 검증 절차

1. `cd frontend && npm run build` 실행.
2. UI_GUIDE 안티패턴 체크리스트:
   - `backdrop-filter: blur()` 미사용?
   - `gradient-text` 미사용?
   - 보라/인디고 색상 미사용? (PromptType 배지는 예외)
   - glow 애니메이션 미사용?
3. 기능 체크리스트:
   - `CallbackPage`가 토큰을 localStorage에 저장하고 리다이렉트하는가?
   - `PromptDetailPage`에서 `purchased` 값에 따라 UI가 분기되는가?
   - `downloadPrompt()` 후 `URL.revokeObjectURL()` 정리가 이루어지는가?
   - content 50KB 초과 시 업로드 버튼이 비활성화되는가?
4. 결과에 따라 `phases/0-mvp/index.json`의 step 8을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "전체 페이지(Login, Callback, Home, PromptDetail, Upload, MyPage) + 공통 컴포넌트(PromptCard, FilterBar, PromptPreview, TagBadge) 구현 완료, 빌드 성공"`
   - 수정 3회 후 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 수동 개입 필요 → `"status": "blocked"`, `"blocked_reason": "구체적 사유"`

## 금지사항

- `backdrop-filter: blur()` 사용 금지. 이유: UI_GUIDE의 AI 슬롭 안티패턴.
- `gradient` 텍스트 효과 사용 금지. 이유: 동일.
- 보라/인디고를 브랜드 색상으로 사용 금지. PromptType AGENT 배지처럼 구분 목적이라면 허용.
- `fetch()` 직접 호출 금지. 이유: 반드시 `api/client.ts`의 Axios 인스턴스를 사용해야 토큰 인터셉터가 동작한다.
- 다운로드 후 `URL.revokeObjectURL()` 정리를 생략하지 마라. 이유: 메모리 누수를 유발한다.
- 새로운 API 엔드포인트를 이 step에서 임의로 추가하지 마라. 이유: Step 6에서 정의한 API만 사용한다.
- 기존 테스트를 깨뜨리지 마라.
