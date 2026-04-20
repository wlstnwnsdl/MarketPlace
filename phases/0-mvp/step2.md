# Step 2: auth-layer

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `CLAUDE.md`
- `docs/ARCHITECTURE.md`
- `docs/ADR.md`
- `src/main/resources/application.yml`
- `src/main/java/com/marketplace/domain/User.java` (Step 1에서 생성)
- `src/main/java/com/marketplace/domain/RefreshToken.java` (Step 1에서 생성)

이전 step에서 만들어진 코드를 꼼꼼히 읽고, 설계 의도를 이해한 뒤 작업하라.

## 작업

이 step에서는 Spring Security 설정, JWT, OAuth2 관련 클래스를 모두 구현한다.
인증 흐름은 아래와 같다:

```
브라우저 → /oauth2/authorization/google
  → Google 콜백 → OAuth2UserService (User DB 생성/조회)
  → OAuth2SuccessHandler (JWT 발급, /auth/callback?accessToken=...&refreshToken=... 리다이렉트)
  → 이후 모든 API 요청: Authorization: Bearer {accessToken}
  → JwtFilter: 토큰 검증 → userId를 SecurityContext에 저장 (DB 조회 없음)
```

패키지: `com.marketplace.config`

### JwtProvider

**`com/marketplace/config/JwtProvider.java`**

`@Component`로 등록. `application.yml`의 `jwt.secret`, `jwt.access-token-expiry`, `jwt.refresh-token-expiry` 값을 `@Value`로 주입.

제공할 메서드 시그니처:
```java
public String generateAccessToken(Long userId)
public String generateRefreshToken(Long userId)
public Long extractUserId(String token)        // 유효하지 않으면 예외 발생
public boolean isExpired(String token)
```

- 알고리즘: HS256 (HMAC-SHA256)
- accessToken claim: `{"sub": userId.toString(), "type": "access"}`
- refreshToken claim: `{"sub": userId.toString(), "type": "refresh"}`
- `extractUserId()`는 type 클레임 검증을 하지 않는다. 타입 구분은 호출자가 책임진다.

### JwtFilter

**`com/marketplace/config/JwtFilter.java`**

`OncePerRequestFilter`를 상속. 아래 로직을 구현:

1. `Authorization: Bearer {token}` 헤더에서 토큰 추출
2. `JwtProvider.extractUserId(token)`로 userId 추출
3. `UsernamePasswordAuthenticationToken(userId, null, emptyList())`를 SecurityContext에 저장
4. DB 조회 없음 — userId Long 값만 SecurityContext principal로 저장

토큰이 없거나 유효하지 않으면 SecurityContext를 설정하지 않고 다음 필터로 넘긴다 (예외를 던지지 않는다).

### UserPrincipal

**`com/marketplace/config/UserPrincipal.java`**

`OAuth2User`를 구현하는 record 또는 class. OAuth2 로그인 과정에서 사용자 정보를 임시로 담는 용도.

필드: `Long userId`, `String email`, `String name`, `Map<String, Object> attributes`

### OAuth2UserService

**`com/marketplace/config/OAuth2UserService.java`**

`DefaultOAuth2UserService`를 상속하는 `@Service`.

`loadUser()` 메서드 구현:
1. 부모의 `super.loadUser()`로 Google 사용자 정보 로드
2. attributes에서 email, name 추출
3. `UserRepository`로 email 조회 → 없으면 새 User 저장, 있으면 기존 User 반환
4. `UserPrincipal` 반환

### OAuth2SuccessHandler

**`com/marketplace/config/OAuth2SuccessHandler.java`**

`SimpleUrlAuthenticationSuccessHandler`를 상속하는 `@Component`.

`onAuthenticationSuccess()` 구현:
1. `authentication.getPrincipal()`에서 `UserPrincipal` 추출
2. `JwtProvider`로 accessToken, refreshToken 생성
3. `RefreshTokenRepository`에 refreshToken 저장 (기존 토큰이 있으면 덮어씀)
4. `${frontend.url}/auth/callback?accessToken={at}&refreshToken={rt}` 로 리다이렉트

`UserRepository`와 `RefreshTokenRepository`를 생성자 주입. (이 클래스가 실행될 시점에는 리포지토리가 필요하므로 컴파일 에러가 날 수 있다. Step 3에서 리포지토리가 생성되므로, 이 step에서는 인터페이스 선언만 없는 상태라도 컴파일이 가능하도록 임시로 `@Autowired` 필드를 `Optional`로 처리하거나, 리포지토리 인터페이스를 이 step에서 함께 선언해도 된다.)

### SecurityConfig

**`com/marketplace/config/SecurityConfig.java`**

`@Configuration`, `@EnableWebSecurity`로 등록.

`SecurityFilterChain` 빈 구성:
- CSRF 비활성화 (JWT Stateless)
- 세션 정책: `STATELESS`
- CORS 설정: `cors.allowed-origins` 값을 `@Value`로 주입, `CorsConfigurationSource` 빈 등록
- 경로 권한:
  - `/oauth2/**`, `/login/**`, `/api/auth/**` → permitAll
  - `GET /api/prompts`, `GET /api/prompts/**` → permitAll (비로그인 탐색 허용)
  - 그 외 → authenticated
- OAuth2 로그인: `userInfoEndpoint`에 `OAuth2UserService` 연결, `successHandler`에 `OAuth2SuccessHandler` 연결
- `JwtFilter`를 `UsernamePasswordAuthenticationFilter` 앞에 추가

### AsyncConfig

**`com/marketplace/config/AsyncConfig.java`**

`@Configuration`, `@EnableAsync`.

`judgeExecutor` 빈 대신 `taskExecutor` 이름으로 `ThreadPoolTaskExecutor` 빈 등록:
- corePoolSize: 2
- maxPoolSize: 5
- queueCapacity: 100
- threadNamePrefix: "async-"

### 테스트

**`src/test/java/com/marketplace/config/JwtProviderTest.java`**

테스트 케이스:
- `generateAccessToken` 후 `extractUserId`로 동일한 userId 추출되는지 검증
- 만료된 토큰에 대해 `isExpired()` true 반환 검증
- 잘못된 시크릿으로 서명된 토큰에 대해 `extractUserId()` 예외 발생 검증

## Acceptance Criteria

```bash
./gradlew test --tests "com.marketplace.config.JwtProviderTest"
```

## 검증 절차

1. 위 AC 커맨드 실행.
2. 아키텍처 체크리스트:
   - `JwtFilter`가 DB 조회 없이 토큰 클레임에서 userId만 추출하는가?
   - SecurityContext principal이 `Long userId`인가? (User 엔티티 전체가 아닌)
   - CSRF가 비활성화되어 있는가?
   - 세션 정책이 STATELESS인가?
3. 결과에 따라 `phases/0-mvp/index.json`의 step 2를 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "JWT(JwtProvider, JwtFilter) + OAuth2(OAuth2UserService, OAuth2SuccessHandler) + SecurityConfig 구현 완료, JwtProviderTest 통과"`
   - 수정 3회 후 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 수동 개입 필요 → `"status": "blocked"`, `"blocked_reason": "구체적 사유"`

## 금지사항

- `JwtFilter`에서 DB(UserRepository)를 조회하지 마라. 이유: 매 요청마다 DB 조회가 발생하면 성능이 저하된다. userId는 토큰 클레임에서 직접 추출한다.
- Security 설정에서 `httpBasic()` 또는 `formLogin()`을 활성화하지 마라. 이유: JWT + OAuth2만 사용한다.
- `@EnableGlobalMethodSecurity`를 사용하지 마라. 이유: 메서드 레벨 보안은 사용하지 않으며, 복잡도를 높인다.
- 기존 테스트를 깨뜨리지 마라.
