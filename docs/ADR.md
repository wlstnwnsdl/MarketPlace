# Architecture Decision Records

## 철학
MVP 속도 최우선. 외부 의존성 최소화. 작동하는 최소 구현을 선택. 추후 교체 가능한 구조를 유지하되, 지금 필요하지 않은 복잡도는 추가하지 않는다.

---

### ADR-001: Spring Boot 백엔드 + React/Vite 프론트엔드 분리 구조
**결정**: 백엔드(Spring Boot)와 프론트엔드(React + Vite)를 별도 프로젝트로 개발하되, 프로덕션에서는 Gradle 빌드가 프론트엔드 결과물을 Spring Boot static 리소스로 통합한다.

**이유**: 개발 시 Vite HMR과 프록시를 활용해 생산성을 높인다. 배포는 단일 JAR로 단순하게 유지한다. 개발자 타겟 제품이므로 SSR이 없어도 SEO 불이익이 적다.

**트레이드오프**: SEO 최적화 어려움. 초기 로딩 시 SPA 특성상 빈 화면 노출 가능.

---

### ADR-002: Google OAuth2 + JWT Stateless 인증
**결정**: 사용자 인증은 Google OAuth2만 지원한다. 세션 대신 JWT(accessToken 1시간, refreshToken 14일)를 사용하고, 매 요청마다 DB 조회 없이 토큰 클레임에서 userId를 추출한다. refreshToken rotation 적용.

**이유**: 개발자/기획자 타겟 제품이므로 Google 계정 보유율이 매우 높다. 자체 비밀번호 관리 없이 MVP를 빠르게 출시한다. Stateless JWT는 수평 확장에 유리하다.

**트레이드오프**: 토큰 강제 만료 불가 (블랙리스트 없음). 로그아웃은 클라이언트 측 토큰 삭제로만 처리.

---

### ADR-003: 콘텐츠 접근 제어 — DB에서 구매 여부 검증
**결정**: 프롬프트 전체 content는 Purchase 레코드가 존재하는 사용자에게만 반환한다. 미리보기(previewContent)는 누구에나 공개. 다운로드 API도 동일한 검증 적용.

**이유**: 핵심 비즈니스 로직이므로 프론트엔드 렌더링 로직이 아닌 서버 레이어에서 강제한다. 클라이언트 조작으로 콘텐츠를 탈취할 수 없게 한다.

**트레이드오프**: 상세 조회 API가 인증 여부에 따라 다른 응답을 반환하므로 클라이언트 처리가 다소 복잡해진다. PromptDetailResponse에 `purchased: boolean` 필드를 포함해 UI 분기를 명확히 한다.

---

### ADR-004: 프롬프트 파일을 DB TEXT 컬럼에 저장
**결정**: 업로드된 .md / .json 파일의 내용을 파일 스토리지(S3 등) 없이 DB의 TEXT 컬럼(content, previewContent)에 직접 저장한다.

**이유**: MVP 범위에서 인프라 의존성 최소화. Claude Code 프롬프트 파일은 수 KB 이내의 텍스트이므로 DB 저장으로 충분하다. 추후 파일이 커지거나 첨부파일이 필요해지면 S3로 마이그레이션 가능한 구조를 유지한다.

**트레이드오프**: 대용량 파일이나 바이너리 파일 지원 불가. 파일 크기 제한을 API 레이어에서 명시적으로 강제해야 함 (최대 50KB).

---

### ADR-005: H2 인메모리 DB (개발) + PostgreSQL (운영)
**결정**: 개발 환경은 H2 인메모리 DB(`MODE=PostgreSQL`)를 사용하고, 운영 환경은 PostgreSQL을 사용한다. JPA DDL은 개발 시 `create-drop`, 운영 시 `validate`로 설정한다.

**이유**: 개발 환경 셋업을 최소화한다. H2의 PostgreSQL 호환 모드로 운영과 유사한 환경을 유지한다.

**트레이드오프**: H2와 PostgreSQL의 미묘한 차이로 인한 운영 배포 버그 가능성. TEXT 타입 컬럼을 H2에서는 CLOB으로 처리하는 방식 차이 주의.

---

### ADR-006: Spring Security — SPA 라우트 전체 허용, API만 인증 강제
**결정**: `SecurityConfig`에서 `/api/**` 경로만 인증을 요구하고, 나머지 모든 경로(`anyRequest().permitAll()`)는 Spring Security가 통과시킨다. SPA 프론트엔드 라우트의 인증 처리는 React 클라이언트가 담당한다.

**이유**: 초기 구현의 `anyRequest().authenticated()`는 `/auth/callback`, `/login`, `/mypage` 등 SPA 라우트까지 차단해 OAuth2 로그인 후 무한 리디렉트 루프를 유발했다. SPA 구조에서 프론트엔드 라우트는 전부 `index.html`로 포워딩되고, 실제 인증 검증은 API 호출 시점에 서버에서, 화면 전환 시점에 클라이언트에서 이중으로 수행된다.

**트레이드오프**: Spring Security가 SPA 라우트를 보호하지 않으므로 미인증 사용자가 `/mypage` URL을 직접 입력해도 서버는 200을 반환한다. 단, 실제 데이터를 요청하는 `/api/**` 호출은 서버에서 차단되므로 보안상 문제없다.

---

### ADR-007: Gradle `bootRun` 시 `.env` 자동 로드
**결정**: `build.gradle`의 `bootRun` 태스크에서 `.env` 파일을 읽어 환경 변수를 JVM 프로세스에 자동 주입한다. 추가 라이브러리(spring-dotenv 등) 없이 Groovy 파일 파싱으로 구현한다.

**이유**: `application.yml`이 `${GOOGLE_CLIENT_ID}`, `${GOOGLE_CLIENT_SECRET}`, `${JWT_SECRET}`를 환경 변수로 참조하는데, 개발자가 매번 `export $(grep -v '^#' .env | xargs)`를 실행하지 않으면 Spring Boot가 `Could not resolve placeholder` 오류로 시작에 실패한다. 이 단계를 생략하는 것이 "연결 안됨"의 주요 원인이었다.

**트레이드오프**: `.env`가 없으면 조용히 빈 맵으로 실행되므로, 환경 변수 누락 오류는 Gradle이 아닌 Spring Boot 시작 시점에 발생한다. `./gradlew test`는 자동 로드 대상이 아니므로 테스트 실행 시에는 여전히 수동 로드가 필요하다.
