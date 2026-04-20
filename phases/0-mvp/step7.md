# Step 7: frontend-foundation

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `CLAUDE.md`
- `docs/ARCHITECTURE.md`
- `docs/UI_GUIDE.md`
- `frontend/package.json` (Step 0에서 생성)
- `frontend/vite.config.ts` (Step 0에서 생성)
- `frontend/tsconfig.json` (Step 0에서 생성)

이전 step에서 백엔드 API 구조를 파악하려면 `docs/ARCHITECTURE.md`의 API 엔드포인트 표를 참고하라.

## 작업

이 step에서는 프론트엔드의 **기반 레이어**만 구현한다: TypeScript 타입, Axios 클라이언트, API 함수, React Router 라우팅. 페이지 컴포넌트 구현은 Step 8에서 한다.

### TypeScript 타입

**`frontend/src/types/index.ts`**

백엔드 API 응답에 대응하는 타입 정의:

```typescript
export type PromptType = 'CLAUDE_MD' | 'AGENT' | 'SKILL' | 'SETTINGS' | 'BUNDLE'
export type TargetRole = 'DEVELOPER' | 'PLANNER' | 'DESIGNER'

export interface PromptSummary {
  id: number
  title: string
  description: string
  previewContent: string
  type: PromptType
  targetRole: TargetRole | null
  price: number
  downloadCount: number
  tags: string[]
  sellerId: number
  createdAt: string
}

export interface PromptDetail extends PromptSummary {
  content: string | null   // 미구매 시 null
  purchased: boolean
}

export interface PageResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export interface PurchaseResponse {
  purchaseId: number
  promptId: number
  purchasedAt: string
}

export interface AuthTokenResponse {
  accessToken: string
  refreshToken: string
}
```

### Axios 클라이언트

**`frontend/src/api/client.ts`**

아래 동작을 구현한다:

1. `axios.create({ baseURL: '/api' })` 인스턴스 생성
2. **요청 인터셉터**: localStorage에서 `accessToken`을 읽어 `Authorization: Bearer {token}` 헤더 추가
3. **응답 인터셉터 — 401 처리**:
   - 401 응답 수신 시 `POST /api/auth/refresh` 호출 (localStorage의 refreshToken 사용)
   - 재발급 성공 시 새 토큰을 localStorage에 저장하고 원본 요청 재시도
   - 재발급 실패(refreshToken도 만료) 시 localStorage 토큰 삭제 후 `/login`으로 리다이렉트
4. refresh 요청 자체가 401이면 무한 루프 방지를 위해 재시도하지 않는다

### API 함수

**`frontend/src/api/prompts.ts`**

```typescript
export async function listPrompts(params: {
  type?: PromptType
  targetRole?: TargetRole
  keyword?: string
  page?: number
  size?: number
}): Promise<PageResponse<PromptSummary>>

export async function getPrompt(id: number): Promise<PromptDetail>

export async function createPrompt(data: {
  title: string
  description: string
  content: string
  type: PromptType
  targetRole?: TargetRole
  price: number
  tags: string[]
}): Promise<PromptSummary>

export async function updatePrompt(id: number, data: {
  title: string
  description: string
  content: string
  targetRole?: TargetRole
  price: number
  tags: string[]
}): Promise<PromptSummary>

export async function deletePrompt(id: number): Promise<void>

export async function downloadPrompt(id: number): Promise<Blob>
// 반환된 Blob을 URL.createObjectURL()로 처리해 파일 다운로드 트리거
```

**`frontend/src/api/purchases.ts`**

```typescript
export async function purchasePrompt(promptId: number): Promise<PurchaseResponse>
export async function getMyPurchases(): Promise<number[]>
export async function getMyPrompts(): Promise<PromptSummary[]>
```

### React Router 라우팅

**`frontend/src/App.tsx`** (Step 0의 placeholder를 교체):

```typescript
// 라우트 구성
// / → HomePage
// /prompts/:id → PromptDetailPage
// /upload → UploadPage (로그인 필요)
// /edit/:id → PromptFormPage (로그인 필요)
// /mypage → MyPage (로그인 필요)
// /login → LoginPage
// /auth/callback → CallbackPage
```

각 페이지 컴포넌트는 Step 8에서 구현하므로, 이 step에서는 placeholder 컴포넌트(`<div>페이지명</div>`)로 임시 등록한다.

**인증 가드**: `/upload`, `/edit/:id`, `/mypage`는 localStorage에 `accessToken`이 없으면 `/login`으로 리다이렉트하는 `PrivateRoute` 래퍼 컴포넌트를 구현한다.

```typescript
// frontend/src/components/PrivateRoute.tsx
// accessToken이 없으면 <Navigate to="/login" /> 반환
```

## Acceptance Criteria

```bash
cd frontend && npm run build
```

타입 에러 없이 빌드 성공해야 한다.

## 검증 절차

1. `cd frontend && npm run build` 실행.
2. 아키텍처 체크리스트:
   - `types/index.ts`에 모든 API 응답 타입이 정의되어 있는가?
   - `api/client.ts`의 401 인터셉터가 무한 루프 방지 로직을 포함하는가?
   - `PrivateRoute`가 `accessToken` 없을 때 `/login`으로 리다이렉트하는가?
   - `downloadPrompt()`가 Blob을 반환하고 파일 다운로드를 트리거하는가?
3. 결과에 따라 `phases/0-mvp/index.json`의 step 7을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "TypeScript 타입 정의, Axios 클라이언트(JWT 인터셉터+401 재발급), API 함수(prompts.ts, purchases.ts), React Router 라우팅 + PrivateRoute 구현 완료"`
   - 수정 3회 후 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 수동 개입 필요 → `"status": "blocked"`, `"blocked_reason": "구체적 사유"`

## 금지사항

- `any` 타입을 사용하지 마라. 이유: TypeScript strict 모드에서 타입 안전성을 보장해야 한다.
- Axios 인스턴스 없이 `fetch()` 또는 `axios` 전역을 직접 사용하지 마라. 이유: 모든 API 호출이 `client.ts`의 인터셉터를 통과해야 토큰 갱신이 일관되게 동작한다.
- 이 step에서 실제 페이지 UI를 구현하지 마라. placeholder 컴포넌트로만 등록한다.
- 기존 테스트를 깨뜨리지 마라.
