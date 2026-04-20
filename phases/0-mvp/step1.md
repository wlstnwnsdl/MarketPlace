# Step 1: domain-layer

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `CLAUDE.md`
- `docs/ARCHITECTURE.md`
- `docs/ADR.md`
- `src/main/java/com/marketplace/MarketplaceApplication.java` (Step 0에서 생성)
- `src/main/resources/application.yml` (Step 0에서 생성)

이전 step에서 만들어진 코드를 꼼꼼히 읽고, 패키지 구조와 설정을 이해한 뒤 작업하라.

## 작업

이 step에서는 JPA 엔티티와 열거형만 작성한다. 리포지토리, 서비스, 컨트롤러는 이후 step에서 작성한다.

패키지 루트: `com.marketplace`

### 열거형

**`com/marketplace/domain/enums/PromptType.java`**
```java
public enum PromptType {
    CLAUDE_MD, AGENT, SKILL, SETTINGS, BUNDLE
}
```

**`com/marketplace/domain/enums/TargetRole.java`**
```java
public enum TargetRole {
    DEVELOPER, PLANNER, DESIGNER
}
```

### 엔티티

**`com/marketplace/domain/User.java`**

필드:
- `Long id` (PK, @GeneratedValue IDENTITY)
- `String email` (unique, not null)
- `String name` (not null)
- `String provider` (not null) — "google"
- `String providerId` (not null)
- `LocalDateTime createdAt` (@CreationTimestamp)

관계: 없음 (단방향 참조만 사용)

**`com/marketplace/domain/Prompt.java`**

필드:
- `Long id` (PK, @GeneratedValue IDENTITY)
- `Long sellerId` (not null) — User ID 직접 저장, @ManyToOne 없이 FK만 관리
- `String title` (not null, @Size max=200)
- `String description` (@Size max=2000)
- `String content` (@Column columnDefinition="TEXT", not null) — 구매 후 공개
- `String previewContent` (@Column columnDefinition="TEXT") — 미리보기 (앞부분 일부)
- `PromptType type` (@Enumerated EnumType.STRING, not null)
- `TargetRole targetRole` (@Enumerated EnumType.STRING)
- `int price` (default 0) — 0이면 무료
- `int downloadCount` (default 0)
- `LocalDateTime createdAt` (@CreationTimestamp)

컬렉션:
- `List<String> tags` (@ElementCollection, @CollectionTable name="prompt_tags") — 태그 목록

**`com/marketplace/domain/Purchase.java`**

필드:
- `Long id` (PK, @GeneratedValue IDENTITY)
- `Long buyerId` (not null) — User ID
- `Long promptId` (not null) — Prompt ID
- `LocalDateTime purchasedAt` (@CreationTimestamp)

유니크 제약: `(buyerId, promptId)` 조합 중복 불가 — `@Table(uniqueConstraints = @UniqueConstraint(columnNames = {"buyer_id", "prompt_id"}))`

**`com/marketplace/domain/RefreshToken.java`**

필드:
- `Long userId` (@Id) — User ID를 PK로 사용 (1 user = 1 refresh token)
- `String token` (unique, not null)
- `LocalDateTime expiryDate` (not null)

### 공통 규칙

- 엔티티에 `@Data` 사용 금지. `@Getter`만 사용하고 setter는 필요한 경우에만 명시적으로 작성한다.
- `@NoArgsConstructor(access = AccessLevel.PROTECTED)` + 필요한 정적 팩토리 메서드 또는 `@Builder` 패턴 사용.
- 엔티티 간 `@ManyToOne` / `@OneToMany` 양방향 관계 설정 금지. sellerId, buyerId, promptId를 Long 타입으로 직접 저장한다. 이유: N+1 문제와 순환 참조를 원천 차단한다.
- `toString()` 오버라이드 시 컬렉션 필드(`tags`) 포함 금지. 이유: LazyInitializationException 유발.

## Acceptance Criteria

```bash
./gradlew compileJava
```

컴파일 에러 없이 통과해야 한다.

## 검증 절차

1. `./gradlew compileJava` 실행.
2. 아키텍처 체크리스트:
   - 엔티티 파일이 `com/marketplace/domain/` 패키지에 있는가?
   - 열거형이 `com/marketplace/domain/enums/` 패키지에 있는가?
   - 어떤 엔티티에도 `@Data`가 없는가?
   - 엔티티 간 `@ManyToOne` / `@OneToMany`가 없는가?
   - `Purchase` 테이블에 `(buyerId, promptId)` 유니크 제약이 있는가?
3. 결과에 따라 `phases/0-mvp/index.json`의 step 1을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "JPA 엔티티 5종(User, Prompt, Purchase, RefreshToken) + 열거형 2종(PromptType, TargetRole) 생성 완료"`
   - 수정 3회 후 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 수동 개입 필요 → `"status": "blocked"`, `"blocked_reason": "구체적 사유"`

## 금지사항

- 엔티티에 `@Data` 사용 금지. 이유: `hashCode()`가 컬렉션 필드를 포함하면 LazyInitializationException을 유발하고, `toString()`이 순환 참조를 일으킨다.
- 엔티티 간 `@ManyToOne` / `@OneToMany` 양방향 관계 설정 금지. 이유: N+1 쿼리와 순환 참조의 원인이 된다.
- 리포지토리, 서비스, 컨트롤러 코드를 이 step에서 작성하지 마라. 이유: step 범위를 도메인 레이어로만 한정한다.
- 기존 테스트를 깨뜨리지 마라.
