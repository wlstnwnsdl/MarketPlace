# Step 6: api-layer

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `CLAUDE.md`
- `docs/ARCHITECTURE.md`
- `src/main/java/com/marketplace/service/PromptService.java` (Step 4에서 생성)
- `src/main/java/com/marketplace/service/PurchaseService.java` (Step 5에서 생성)
- `src/main/java/com/marketplace/api/exception/PromptNotFoundException.java`
- `src/main/java/com/marketplace/api/exception/AlreadyPurchasedException.java`
- `src/main/java/com/marketplace/api/exception/UnauthorizedException.java`
- `src/main/java/com/marketplace/domain/enums/PromptType.java`
- `src/main/java/com/marketplace/domain/enums/TargetRole.java`

이전 step에서 만들어진 서비스 코드를 꼼꼼히 읽고, 메서드 시그니처와 반환 타입을 확인한 뒤 작업하라.

## 작업

이 step에서는 컨트롤러, DTO, 예외 처리를 구현한다. 모든 API는 JSON을 반환한다.

SecurityContext에서 userId 추출: `(Long) SecurityContextHolder.getContext().getAuthentication().getPrincipal()`

### DTO (Java record)

패키지: `com.marketplace.api.dto`

**`PromptRequest.java`** (등록/수정 요청):
```java
record PromptRequest(
    @NotBlank @Size(max = 200) String title,
    @Size(max = 2000) String description,
    @NotBlank String content,
    @NotNull PromptType type,
    TargetRole targetRole,
    int price,
    List<String> tags
) {}
```

**`PromptSummaryResponse.java`** (목록용 — content 미포함):
```java
record PromptSummaryResponse(
    Long id, String title, String description, String previewContent,
    PromptType type, TargetRole targetRole, int price, int downloadCount,
    List<String> tags, Long sellerId, LocalDateTime createdAt
) {}
```

**`PromptDetailResponse.java`** (상세용 — 구매 여부에 따라 content 포함 여부 다름):
```java
record PromptDetailResponse(
    Long id, String title, String description, String previewContent,
    String content,        // 미구매 시 null
    boolean purchased,
    PromptType type, TargetRole targetRole, int price, int downloadCount,
    List<String> tags, Long sellerId, LocalDateTime createdAt
) {}
```

**`PurchaseResponse.java`**:
```java
record PurchaseResponse(Long purchaseId, Long promptId, LocalDateTime purchasedAt) {}
```

**`PageResponse<T>.java`** (페이지네이션 래퍼):
```java
record PageResponse<T>(List<T> content, int page, int size, long totalElements, int totalPages) {}
```

**`AuthTokenResponse.java`** (토큰 재발급 응답):
```java
record AuthTokenResponse(String accessToken, String refreshToken) {}
```

**`RefreshRequest.java`** (토큰 재발급 요청):
```java
record RefreshRequest(@NotBlank String refreshToken) {}
```

### AuthController

**`com/marketplace/api/AuthController.java`**

`@RestController`, `@RequestMapping("/api/auth")`

메서드:
```java
// POST /api/auth/refresh
// RefreshToken 검증 → 새 accessToken + refreshToken 발급 (rotation)
// 유효하지 않은 refreshToken → 401 응답
@PostMapping("/refresh")
ResponseEntity<AuthTokenResponse> refresh(@RequestBody @Valid RefreshRequest request)
```

내부 로직:
1. `RefreshTokenRepository.findByToken(token)` 조회
2. 없거나 만료된 경우 401 반환
3. `JwtProvider.generateAccessToken()`, `generateRefreshToken()`으로 새 토큰 생성
4. `RefreshTokenRepository`에 새 refreshToken 저장 (기존 삭제 후 저장 = rotation)
5. `AuthTokenResponse` 반환

### PromptController

**`com/marketplace/api/PromptController.java`**

`@RestController`, `@RequestMapping("/api/prompts")`

메서드:
```java
// GET /api/prompts?type=&targetRole=&keyword=&page=0&size=20
// 비로그인 허용
@GetMapping
ResponseEntity<PageResponse<PromptSummaryResponse>> listPrompts(
    @RequestParam(required = false) PromptType type,
    @RequestParam(required = false) TargetRole targetRole,
    @RequestParam(required = false) String keyword,
    @RequestParam(defaultValue = "0") int page,
    @RequestParam(defaultValue = "20") int size
)

// GET /api/prompts/{id}
// 비로그인: purchased=false, content=null
// 로그인+구매: purchased=true, content 포함
@GetMapping("/{id}")
ResponseEntity<PromptDetailResponse> getPrompt(
    @PathVariable Long id,
    Authentication authentication   // null 허용 (비로그인)
)

// POST /api/prompts
// 로그인 필요
@PostMapping
ResponseEntity<PromptSummaryResponse> createPrompt(
    @RequestBody @Valid PromptRequest request,
    Authentication authentication
)

// PUT /api/prompts/{id}
// 로그인 + 본인만
@PutMapping("/{id}")
ResponseEntity<PromptSummaryResponse> updatePrompt(
    @PathVariable Long id,
    @RequestBody @Valid PromptRequest request,
    Authentication authentication
)

// DELETE /api/prompts/{id}
// 로그인 + 본인만
@DeleteMapping("/{id}")
ResponseEntity<Void> deletePrompt(
    @PathVariable Long id,
    Authentication authentication
)

// GET /api/prompts/{id}/download
// 로그인 + 구매자만
// Content-Disposition: attachment; filename="{title}.md" 헤더 추가
@GetMapping("/{id}/download")
ResponseEntity<byte[]> downloadPrompt(
    @PathVariable Long id,
    Authentication authentication
)
```

### PurchaseController

**`com/marketplace/api/PurchaseController.java`**

`@RestController`, `@RequestMapping("/api")`

메서드:
```java
// POST /api/purchases/{promptId}
@PostMapping("/purchases/{promptId}")
ResponseEntity<PurchaseResponse> purchase(
    @PathVariable Long promptId,
    Authentication authentication
)

// GET /api/purchases
// 내 구매 내역 (promptId 목록)
@GetMapping("/purchases")
ResponseEntity<List<Long>> myPurchases(Authentication authentication)

// GET /api/users/me/prompts
// 내 판매 목록
@GetMapping("/users/me/prompts")
ResponseEntity<List<PromptSummaryResponse>> myPrompts(Authentication authentication)
```

### GlobalExceptionHandler

**`com/marketplace/api/GlobalExceptionHandler.java`**

`@RestControllerAdvice`. 아래 예외를 HTTP 응답으로 매핑:

| 예외 | HTTP 상태 |
|------|----------|
| `PromptNotFoundException` | 404 |
| `AlreadyPurchasedException` | 409 |
| `UnauthorizedException` | 403 |
| `IllegalArgumentException` | 400 |
| `MethodArgumentNotValidException` | 400 (validation 에러 상세 포함) |

응답 형식:
```java
record ErrorResponse(String message, String code) {}
```

### SpaController

**`com/marketplace/api/SpaController.java`**

`@Controller`. `/api/**`, `/oauth2/**`, `/login/**` 이외의 모든 GET 요청을 `forward:/index.html`로 포워딩한다.

```java
@GetMapping(value = {"/{path:[^\\.]*}", "/{path:^(?!api|oauth2|login).*$}/**"})
public String forward() { return "forward:/index.html"; }
```

### 테스트

**`src/test/java/com/marketplace/api/PromptControllerTest.java`**

`@WebMvcTest(PromptController.class)` 사용. `PromptService`를 `@MockBean`.

테스트 케이스:
- `GET /api/prompts` — 200 응답, `PageResponse` 구조 확인
- `POST /api/prompts` — 인증 없이 요청 시 401 응답
- `DELETE /api/prompts/{id}` — 서비스에서 `UnauthorizedException` 발생 시 403 응답 확인

## Acceptance Criteria

```bash
./gradlew test --tests "com.marketplace.api.PromptControllerTest"
./gradlew build -x test   # 전체 컴파일 확인
```

## 검증 절차

1. 위 AC 커맨드 실행.
2. 아키텍처 체크리스트:
   - 컨트롤러가 엔티티를 직접 반환하지 않고 반드시 DTO로 변환하는가?
   - `downloadPrompt()`가 `Content-Disposition: attachment` 헤더를 포함하는가?
   - `GET /api/prompts`와 `GET /api/prompts/{id}`가 비로그인(Authentication=null)에서도 200을 반환하는가?
   - `GlobalExceptionHandler`가 등록되어 있는가?
3. 결과에 따라 `phases/0-mvp/index.json`의 step 6을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "AuthController, PromptController, PurchaseController, GlobalExceptionHandler, SpaController 구현 완료, PromptControllerTest 통과"`
   - 수정 3회 후 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 수동 개입 필요 → `"status": "blocked"`, `"blocked_reason": "구체적 사유"`

## 금지사항

- 컨트롤러에서 엔티티(`Prompt`, `Purchase`, `User`)를 `@ResponseBody`로 직접 반환하지 마라. 이유: 엔티티 변경이 API 응답 스키마에 즉시 영향을 주고, 순환 참조 및 불필요한 필드 노출 위험이 있다.
- 비즈니스 로직(구매 여부 검증, 소유권 검증 등)을 컨트롤러에 넣지 마라. 이유: 반드시 서비스 레이어에서 처리한다.
- `downloadPrompt()`에서 구매 여부 검증을 컨트롤러에서 직접 하지 마라. 이유: `PromptService.getContentForDownload()`에 위임한다.
- 기존 테스트를 깨뜨리지 마라.
