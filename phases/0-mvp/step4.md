# Step 4: prompt-service

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `CLAUDE.md`
- `docs/ARCHITECTURE.md`
- `docs/ADR.md` (ADR-003: 콘텐츠 접근 제어, ADR-004: 파일을 DB TEXT에 저장)
- `src/main/java/com/marketplace/domain/Prompt.java`
- `src/main/java/com/marketplace/domain/enums/PromptType.java`
- `src/main/java/com/marketplace/domain/enums/TargetRole.java`
- `src/main/java/com/marketplace/repository/PromptRepository.java`
- `src/main/java/com/marketplace/repository/PurchaseRepository.java`

이전 step에서 만들어진 코드를 꼼꼼히 읽고, 엔티티 필드명과 리포지토리 메서드를 확인한 뒤 작업하라.

## 작업

이 step에서는 `PromptService`만 구현한다. 컨트롤러 DTO는 다음 step에서 정의하므로, 이 step에서 서비스 메서드는 엔티티 또는 내부 결과 객체를 반환해도 된다. (Step 6에서 컨트롤러와 DTO가 생성되면 서비스 반환 타입을 DTO로 교체하거나 컨트롤러에서 변환한다.)

패키지: `com.marketplace.service`

### 예외 클래스

**`com/marketplace/api/exception/PromptNotFoundException.java`**

`RuntimeException`을 상속. 생성자: `PromptNotFoundException(Long id)` — "Prompt not found: {id}" 메시지.

**`com/marketplace/api/exception/UnauthorizedException.java`**

`RuntimeException`을 상속. 생성자: `UnauthorizedException(String message)`.

### PromptService

**`com/marketplace/service/PromptService.java`**

`@Service`, `@Transactional` 적용.

구현할 메서드:

```java
// 프롬프트 목록 조회 (필터/검색, 페이지네이션)
// buyerId가 null이면 비로그인 상태 — previewContent만 포함한 결과 반환
Page<Prompt> findPrompts(PromptType type, TargetRole targetRole, String keyword, int page, int size)

// 프롬프트 상세 조회
// buyerId != null이고 해당 사용자가 구매한 경우 → content 전체 반환
// buyerId == null 또는 미구매 → previewContent만 반환, content는 null 처리
// 반환 타입에 'purchased: boolean' 여부를 담기 위해 내부 record 사용 가능
PromptDetail findPromptDetail(Long promptId, Long buyerId)

// 프롬프트 등록
// content 크기 50KB(51200 bytes) 초과 시 IllegalArgumentException 발생
// previewContent는 content의 앞 500자를 자동 생성 (파라미터로 전달받지 않음)
Prompt createPrompt(Long sellerId, String title, String description, String content,
                    PromptType type, TargetRole targetRole, int price, List<String> tags)

// 프롬프트 수정
// sellerId != prompt.sellerId 이면 UnauthorizedException 발생
Prompt updatePrompt(Long promptId, Long sellerId, String title, String description,
                    String content, TargetRole targetRole, int price, List<String> tags)

// 프롬프트 삭제
// sellerId != prompt.sellerId 이면 UnauthorizedException 발생
void deletePrompt(Long promptId, Long sellerId)

// 다운로드용 content 반환
// buyerId가 구매하지 않은 경우 UnauthorizedException 발생
String getContentForDownload(Long promptId, Long buyerId)
```

**내부 record `PromptDetail`** (PromptService 내부 또는 별도 파일):
```java
record PromptDetail(Prompt prompt, boolean purchased) {}
```

### 핵심 규칙

- **콘텐츠 접근 제어는 서버에서 강제한다** — `findPromptDetail()`과 `getContentForDownload()`에서 `PurchaseRepository.existsByBuyerIdAndPromptId()`로 구매 여부를 반드시 검증한다. 프론트엔드 렌더링 조건만으로는 부족하다.
- **previewContent 자동 생성** — `createPrompt()`에서 `content.substring(0, Math.min(500, content.length()))`로 생성. 판매자가 직접 입력하지 않는다.
- **가격 검증** — `price < 0`이면 `IllegalArgumentException` 발생.

### 테스트

**`src/test/java/com/marketplace/service/PromptServiceTest.java`**

`@ExtendWith(MockitoExtension.class)` 사용. `PromptRepository`, `PurchaseRepository`를 Mock.

테스트 케이스:
- `findPromptDetail` — 구매한 사용자에게 `purchased: true`, content 포함 결과 반환 검증
- `findPromptDetail` — 미구매 사용자에게 `purchased: false`, content null 반환 검증
- `createPrompt` — 50KB 초과 content 입력 시 `IllegalArgumentException` 발생 검증
- `createPrompt` — previewContent가 content 앞 500자로 자동 생성되는지 검증
- `deletePrompt` — 본인이 아닌 sellerId로 삭제 시도 시 `UnauthorizedException` 발생 검증

## Acceptance Criteria

```bash
./gradlew test --tests "com.marketplace.service.PromptServiceTest"
```

## 검증 절차

1. 위 AC 커맨드 실행.
2. 아키텍처 체크리스트:
   - `getContentForDownload()`가 구매 여부를 DB에서 검증하는가?
   - `createPrompt()`가 previewContent를 자동 생성하는가?
   - content 50KB 초과 검증이 서비스 레이어에 있는가?
3. 결과에 따라 `phases/0-mvp/index.json`의 step 4를 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "PromptService 구현 완료 (콘텐츠 접근 제어, previewContent 자동 생성, 50KB 제한), PromptServiceTest 통과"`
   - 수정 3회 후 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 수동 개입 필요 → `"status": "blocked"`, `"blocked_reason": "구체적 사유"`

## 금지사항

- 컨트롤러나 DTO를 이 step에서 작성하지 마라.
- `getContentForDownload()`에서 구매 여부 검증을 생략하지 마라. 이유: 구매하지 않은 사용자가 직접 API를 호출해 콘텐츠를 탈취할 수 있다.
- previewContent를 판매자 입력 파라미터로 받지 마라. 이유: 자동 생성으로 일관성을 보장한다.
- 기존 테스트를 깨뜨리지 마라.
