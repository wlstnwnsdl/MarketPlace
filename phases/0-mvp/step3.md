# Step 3: repository-layer

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `CLAUDE.md`
- `docs/ARCHITECTURE.md`
- `src/main/java/com/marketplace/domain/User.java`
- `src/main/java/com/marketplace/domain/Prompt.java`
- `src/main/java/com/marketplace/domain/Purchase.java`
- `src/main/java/com/marketplace/domain/RefreshToken.java`
- `src/main/java/com/marketplace/domain/enums/PromptType.java`
- `src/main/java/com/marketplace/domain/enums/TargetRole.java`

이전 step에서 만들어진 엔티티 코드를 꼼꼼히 읽고, 필드명과 타입을 확인한 뒤 작업하라.

## 작업

이 step에서는 Spring Data JPA 리포지토리 인터페이스만 작성한다.

패키지: `com.marketplace.repository`

### UserRepository

**`com/marketplace/repository/UserRepository.java`**

`JpaRepository<User, Long>` 상속.

메서드:
```java
Optional<User> findByEmail(String email);
```

### PromptRepository

**`com/marketplace/repository/PromptRepository.java`**

`JpaRepository<Prompt, Long>` 상속.

메서드:
```java
// 타입, 역할, 키워드(제목+설명) 복합 필터 — null 값은 조건에서 제외
@Query("""
    SELECT p FROM Prompt p
    WHERE (:type IS NULL OR p.type = :type)
    AND (:targetRole IS NULL OR p.targetRole = :targetRole)
    AND (:keyword IS NULL OR p.title LIKE %:keyword% OR p.description LIKE %:keyword%)
    ORDER BY p.createdAt DESC
    """)
Page<Prompt> findWithFilters(
    @Param("type") PromptType type,
    @Param("targetRole") TargetRole targetRole,
    @Param("keyword") String keyword,
    Pageable pageable
);

// 판매자의 등록 프롬프트 목록
List<Prompt> findBySellerIdOrderByCreatedAtDesc(Long sellerId);
```

### PurchaseRepository

**`com/marketplace/repository/PurchaseRepository.java`**

`JpaRepository<Purchase, Long>` 상속.

메서드:
```java
// 구매 여부 확인 (중복 구매 방지에 사용)
boolean existsByBuyerIdAndPromptId(Long buyerId, Long promptId);

// 구매자의 구매 내역 (promptId 목록)
List<Purchase> findByBuyerIdOrderByPurchasedAtDesc(Long buyerId);
```

### RefreshTokenRepository

**`com/marketplace/repository/RefreshTokenRepository.java`**

`JpaRepository<RefreshToken, Long>` 상속.

메서드:
```java
Optional<RefreshToken> findByToken(String token);
void deleteByUserId(Long userId);
```

### 리포지토리 테스트

**`src/test/java/com/marketplace/repository/PromptRepositoryTest.java`**

`@DataJpaTest`로 H2 인메모리 DB 사용.

테스트 케이스:
- `findWithFilters` — type 필터만 지정 시 해당 type만 반환되는지 검증
- `findWithFilters` — keyword 필터로 제목 포함 검색 동작 검증
- `findWithFilters` — 모든 파라미터 null 시 전체 반환 검증

## Acceptance Criteria

```bash
./gradlew test --tests "com.marketplace.repository.PromptRepositoryTest"
```

## 검증 절차

1. 위 AC 커맨드 실행.
2. 아키텍처 체크리스트:
   - 리포지토리가 `com/marketplace/repository/` 패키지에 있는가?
   - `@Query`에서 엔티티 필드명(Java 필드명)을 사용했는가? (컬럼명 아님)
   - `findWithFilters`가 null 파라미터를 조건에서 올바르게 제외하는가?
3. 결과에 따라 `phases/0-mvp/index.json`의 step 3을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "4개 JPA 리포지토리(UserRepository, PromptRepository, PurchaseRepository, RefreshTokenRepository) + PromptRepositoryTest 구현 완료"`
   - 수정 3회 후 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 수동 개입 필요 → `"status": "blocked"`, `"blocked_reason": "구체적 사유"`

## 금지사항

- 리포지토리에 구현 클래스를 작성하지 마라. Spring Data JPA 인터페이스만 사용한다.
- `@Query`에서 네이티브 SQL(`nativeQuery = true`)을 사용하지 마라. 이유: 엔티티 필드명 변경 시 쿼리가 자동으로 갱신되지 않아 런타임 에러를 유발한다.
- 서비스나 컨트롤러 코드를 이 step에서 작성하지 마라.
- 기존 테스트를 깨뜨리지 마라.
