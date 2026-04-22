# 라이브 테스트 시나리오

> **관리 규칙**: 기능 추가·수정·삭제 시 이 파일을 반드시 갱신한다.
> - 새 API 추가 → 해당 그룹에 시나리오 추가, 총 시나리오 수 헤더 갱신
> - 동작 변경 → 해당 시나리오의 검증 조건 수정
> - API 제거 → 해당 시나리오 삭제, 이후 번호 재정렬
>
> 각 시나리오 뒤 `[기능태그]`는 어떤 기능에 속하는지 나타낸다.

---

## 더미 계정

| 역할 | userId | 용도 |
|------|--------|------|
| 판매자 | 1 | 프롬프트 등록/수정/삭제 |
| 구매자 | 2 | 프롬프트 구매/다운로드 |
| 외부인 | 3 | 권한 없음 검증 |

```bash
python scripts/gen_test_token.py [userId]
```

---

## 검증 원칙

상태코드 확인만으로는 부족하다. 모든 시나리오에서 반드시 검증:

1. **필드 존재 여부** — 명세된 필드가 실제로 있는가
2. **필드 값 정합성** — 요청 값이 응답에 그대로 반영됐는가
3. **비즈니스 규칙** — 접근 제어·상태 변화가 올바르게 나타나는가
4. **null 여부** — content, previewContent 등 조건부 필드의 null 여부
5. **리스트 항목** — 배열 응답은 길이뿐 아니라 첫 항목 주요 필드까지 확인

실패 기준: 상태코드 불일치 **또는** 데이터 검증 실패 중 하나라도 해당.

---

## 시나리오 목록 (총 22개)

### 그룹 A — 공개 API (비로그인) `[프롬프트목록][검색][필터]`

**A-1. 홈 - 프롬프트 목록 조회** `[프롬프트목록]`
- `GET /api/prompts` → 200
- 검증: `content[]` 배열 존재, `totalElements >= 0`, `totalPages >= 0`
- 검증: items[0]에 `id(number)`, `title(string)`, `type(string)`, `price(number)`, `status == "PUBLIC"` 존재
- 검증: items[0]에 `content` 필드 **없음** (SummaryResponse는 content 미포함)

**A-2. 검색 - 키워드 필터** `[검색]`
- `GET /api/prompts?keyword=test` → 200
- 검증: 응답 items의 `title` 또는 `description` 또는 `tags` 중 하나에 keyword 포함

**A-3. 필터 - CLAUDE_MD 타입** `[필터]`
- `GET /api/prompts?type=CLAUDE_MD` → 200
- 검증: 응답 items 전체의 `type == "CLAUDE_MD"` (이종 타입 혼입 없음)

**A-4. 필터 - DEVELOPER 역할** `[필터]`
- `GET /api/prompts?targetRole=DEVELOPER` → 200
- 검증: 응답 items 전체의 `targetRole == "DEVELOPER"`

---

### 그룹 B — 보안 (비인증 차단) `[인증]`

**B-1. 프롬프트 등록 시도 (비로그인)** `[인증][프롬프트등록]`
- `POST /api/prompts` (토큰 없음) → 401
- 검증: 응답 body에 오류 정보 존재 (비어있지 않음)

**B-2. 구매 내역 조회 시도 (비로그인)** `[인증][구매]`
- `GET /api/purchases` (토큰 없음) → 401
- 검증: 응답 body에 오류 정보 존재

---

### 그룹 C — 판매자 플로우 (userId=1) `[프롬프트등록][프롬프트수정][프롬프트삭제][소유자]`

**C-1. 프롬프트 등록** `[프롬프트등록]`
- `POST /api/prompts` (title="테스트프롬프트", content="본문내용", type="CLAUDE_MD", status="PUBLIC") → 200
- 검증: 응답에 `id(number)` 존재 → 이후 시나리오에서 사용할 `{id}` 저장
- 검증: `title == "테스트프롬프트"`, `type == "CLAUDE_MD"`
- 검증: `content` 필드 **없음** (SummaryResponse는 content 미반환)
- 검증: `previewContent` 존재 (본문 첫 5줄 기반)

**C-2. 소유자 - 프롬프트 상세 조회** `[프롬프트상세][소유자][접근제어]`
- `GET /api/prompts/{id}` (userId=1) → 200
- 검증: `purchased == true` (소유자는 Purchase 없이도 true 반환)
- 검증: `content == "본문내용"` (전체 내용 반환)
- 검증: `previewContent` non-null
- 검증: `sellerId == 1`

**C-3. 내 판매 목록** `[마이페이지]`
- `GET /api/users/me/prompts` (userId=1) → 200
- 검증: 배열 응답, 방금 등록한 `{id}` 포함
- 검증: 항목에 `title`, `type`, `status` 존재

**C-4. 프롬프트 수정** `[프롬프트수정]`
- `PUT /api/prompts/{id}` (title="수정된제목") (userId=1) → 200
- 검증: 응답 `title == "수정된제목"` (변경값 반영 확인)
- 검증: `id` 동일, `type` 불변

**C-5. 타인 수정 차단** `[프롬프트수정][접근제어]`
- `PUT /api/prompts/{id}` (userId=3) → 403
- 검증: 응답 body에 오류 정보 존재

---

### 그룹 D — 구매자 플로우 (userId=2) `[구매][다운로드][접근제어]`

**D-1. 구매 전 상세 조회** `[프롬프트상세][접근제어]`
- `GET /api/prompts/{id}` (userId=2) → 200
- 검증: `purchased == false`
- 검증: `content == null` (미구매자에게 content 미반환)
- 검증: `previewContent` non-null (미리보기는 공개)

**D-2. 프롬프트 구매** `[구매]`
- `POST /api/purchases/{id}` (userId=2) → 200
- 검증: 응답에 `purchaseId(number)` 존재 (`id` 필드명 아님)
- 검증: `promptId == {id}` (구매한 프롬프트 ID 일치)
- 검증: `purchasedAt` 존재 (타임스탬프)

**D-3. 구매 후 상세 조회** `[프롬프트상세][접근제어]`
- `GET /api/prompts/{id}` (userId=2) → 200
- 검증: `purchased == true` (D-1과 동일 endpoint, 상태 변화 확인)
- 검증: `content` non-null

**D-4. 파일 다운로드** `[다운로드]`
- `GET /api/prompts/{id}/download` (userId=2) → 200
- 검증: `Content-Type: text/plain` 헤더 존재
- 검증: 응답 body가 등록 시 입력한 content와 **정확히 일치**
- 검증: body가 비어있지 않음

**D-5. 비구매자 다운로드 차단** `[다운로드][접근제어]`
- `GET /api/prompts/{id}/download` (userId=3) → 403
- 검증: 응답 body에 오류 정보 존재

**D-6. 구매 내역 조회** `[구매][마이페이지]`
- `GET /api/purchases` (userId=2) → 200
- 검증: 배열 응답, `{id}` 포함
- 검증: 배열 원소가 number 타입 (promptId 목록)

**D-7. 중복 구매 방지** `[구매]`
- `POST /api/purchases/{id}` (userId=2) 재시도 → 409
- 검증: 응답 body에 오류 정보 존재

---

### 그룹 E — 판매자 삭제 `[프롬프트삭제]`

**E-1. 프롬프트 삭제** `[프롬프트삭제]`
- `DELETE /api/prompts/{id}` (userId=1) → 204
- 검증: 응답 body 없음 (No Content)

**E-2. 삭제 후 접근** `[프롬프트삭제][프롬프트상세]`
- `GET /api/prompts/{id}` → 404
- 검증: 응답 body에 오류 정보 존재

---

### 그룹 F — 프론트엔드 서빙 `[SPA]`

**F-1. SPA 서빙** `[SPA]`
- `GET /` → 200
- 검증: `Content-Type: text/html` 포함
- 검증: 응답 body에 `<!DOCTYPE html>` 포함

**F-2. SPA 라우트 폴백** `[SPA]`
- `GET /any/nonexistent/path` → 200
- 검증: 응답 body에 `<!DOCTYPE html>` 포함 (404 HTML이 아닌 index.html)

---

## 미검증 항목 (수동 테스트 필요)

- 실제 Google OAuth2 브라우저 로그인 플로우 `[인증]`
- `POST /api/auth/refresh` — RefreshToken 갱신 `[토큰]`
- 프론트엔드 UI 렌더링 및 인터랙션 `[UI]`
- 페이지네이션 (page, size 파라미터) `[프롬프트목록]`
