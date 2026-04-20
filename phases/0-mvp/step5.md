# Step 5: purchase-service

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `CLAUDE.md`
- `docs/ARCHITECTURE.md`
- `docs/ADR.md`
- `src/main/java/com/marketplace/domain/Prompt.java`
- `src/main/java/com/marketplace/domain/Purchase.java`
- `src/main/java/com/marketplace/repository/PromptRepository.java`
- `src/main/java/com/marketplace/repository/PurchaseRepository.java`
- `src/main/java/com/marketplace/api/exception/PromptNotFoundException.java`
- `src/main/java/com/marketplace/service/PromptService.java` (Step 4에서 생성)

이전 step에서 만들어진 코드를 꼼꼼히 읽고, 예외 클래스와 리포지토리 메서드를 확인한 뒤 작업하라.

## 작업

이 step에서는 `PurchaseService`만 구현한다.

패키지: `com.marketplace.service`

### 예외 클래스 (없으면 생성)

**`com/marketplace/api/exception/AlreadyPurchasedException.java`**

`RuntimeException`을 상속. 생성자: `AlreadyPurchasedException(Long promptId)` — "Already purchased: {promptId}" 메시지.

### PurchaseService

**`com/marketplace/service/PurchaseService.java`**

`@Service`, `@Transactional` 적용.

구현할 메서드:

```java
// 구매 처리
// 1. PromptRepository로 프롬프트 존재 여부 확인 (없으면 PromptNotFoundException)
// 2. PurchaseRepository.existsByBuyerIdAndPromptId()로 중복 구매 방지 (이미 구매한 경우 AlreadyPurchasedException)
// 3. 자기 자신의 프롬프트를 구매하려는 경우 IllegalArgumentException 발생
// 4. Purchase 엔티티 생성 후 저장
// 5. 구매 완료 후 ApplicationEventPublisher로 PurchaseCompletedEvent 발행
// 반환: 저장된 Purchase
Purchase createPurchase(Long buyerId, Long promptId)

// 구매 내역 조회
// 구매한 promptId 목록을 반환
List<Long> getPurchasedPromptIds(Long buyerId)
```

### 이벤트 클래스

**`com/marketplace/service/event/PurchaseCompletedEvent.java`**

```java
public record PurchaseCompletedEvent(Long promptId, Long buyerId) {}
```

### 이벤트 핸들러

**`com/marketplace/service/PurchaseEventHandler.java`**

`@Component`. `@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)` + `@Async` 적용.

`handlePurchaseCompleted(PurchaseCompletedEvent event)` 메서드:
- `PromptRepository`로 프롬프트를 조회해 `downloadCount`를 1 증가시키고 저장한다.
- 이 메서드는 별도 트랜잭션에서 실행된다 (`@Transactional(propagation = Propagation.REQUIRES_NEW)`).

### 테스트

**`src/test/java/com/marketplace/service/PurchaseServiceTest.java`**

`@ExtendWith(MockitoExtension.class)` 사용.

테스트 케이스:
- `createPurchase` — 정상 구매 시 Purchase가 저장되고 이벤트가 발행되는지 검증
- `createPurchase` — 중복 구매 시 `AlreadyPurchasedException` 발생 검증
- `createPurchase` — 존재하지 않는 promptId로 구매 시 `PromptNotFoundException` 발생 검증
- `createPurchase` — sellerId == buyerId (자기 자신의 프롬프트 구매) 시 `IllegalArgumentException` 발생 검증

## Acceptance Criteria

```bash
./gradlew test --tests "com.marketplace.service.PurchaseServiceTest"
```

## 검증 절차

1. 위 AC 커맨드 실행.
2. 아키텍처 체크리스트:
   - 중복 구매 방지가 DB 레벨(PurchaseRepository) 검증으로 처리되는가?
   - 자기 자신의 프롬프트 구매 방지 로직이 있는가?
   - `PurchaseEventHandler`가 `@Async` + `@TransactionalEventListener(AFTER_COMMIT)`으로 실행되는가?
   - 이벤트 핸들러가 `REQUIRES_NEW` 트랜잭션을 사용하는가?
3. 결과에 따라 `phases/0-mvp/index.json`의 step 5를 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "PurchaseService + PurchaseEventHandler(downloadCount 비동기 증가) 구현 완료, PurchaseServiceTest 통과"`
   - 수정 3회 후 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 수동 개입 필요 → `"status": "blocked"`, `"blocked_reason": "구체적 사유"`

## 금지사항

- `createPurchase()` 에서 중복 구매 검증을 생략하지 마라. 이유: DB의 유니크 제약만으로는 DataIntegrityViolationException이 발생해 사용자에게 명확한 에러 메시지를 전달할 수 없다.
- `downloadCount` 증가를 메인 트랜잭션 안에서 처리하지 마라. 이유: 구매 트랜잭션이 롤백되어도 카운트가 증가하는 문제가 생긴다. 반드시 AFTER_COMMIT 이벤트로 처리한다.
- 컨트롤러나 DTO를 이 step에서 작성하지 마라.
- 기존 테스트를 깨뜨리지 마라.
