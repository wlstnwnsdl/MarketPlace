# 프로젝트: MarketPlace

## 기술 스택

### 백엔드
- Spring Boot 3.4.x (JDK 17)
- Spring Security 6.x + JWT (JJWT 0.12.6) + OAuth2 (Google)
- Spring Data JPA + Hibernate 6.x
- H2 (개발) / PostgreSQL (운영)
- Jakarta Bean Validation
- Spring RestClient (외부 API 호출)
- @Async + @TransactionalEventListener (비동기 처리)

### 프론트엔드
- React 18 + TypeScript (strict mode)
- Vite 5.x (빌드 도구, 개발 서버 프록시 포함)
- Tailwind CSS 3.x
- React Router DOM 6.x
- Axios (JWT 인터셉터 포함)

## 아키텍처 규칙

- CRITICAL: 모든 비즈니스 로직은 service/ 레이어에서만 처리한다. Controller는 요청/응답 변환만 담당한다.
- CRITICAL: 외부 API(AI, 결제 등) 호출은 반드시 infrastructure/ 레이어에서만 한다. Service에서 직접 호출 금지.
- CRITICAL: JPA 엔티티에 @Data 사용 금지. 순환 참조와 hashCode 문제를 유발한다. @Getter + 필요한 메서드만 정의한다.
- CRITICAL: Controller에서 엔티티를 직접 반환하지 마라. 반드시 DTO(record)로 변환한다.
- JwtFilter에서 DB 조회 금지. userId를 토큰 클레임에서 추출하고 SecurityContext에 저장한다.
- 프론트엔드에서 백엔드 API를 직접 호출할 때 /api 경로 프리픽스를 사용한다. (Vite 프록시 설정)
- 타입 정의는 frontend/src/types/index.ts에 집중 관리한다.
- 패키지 구조: api/ → config/ → domain/ → infrastructure/ → repository/ → service/

## 개발 프로세스

- CRITICAL: 새 기능 구현 시 반드시 테스트를 먼저 작성하고 (TDD), 테스트가 통과하는 구현을 작성할 것
- 커밋 메시지는 conventional commits 형식을 따를 것 (feat:, fix:, docs:, refactor:, chore:)
- 사용자 승인 없이 git commit/push 금지

## 명령어

```bash
# 백엔드
./gradlew bootRun          # 개발 서버 (프론트엔드 빌드 포함)
./gradlew test             # 전체 테스트
./gradlew build            # 프로덕션 빌드

# 프론트엔드 (개발 시 별도 실행)
cd frontend
npm run dev                # Vite 개발 서버 (http://localhost:5173)
npm run build              # 프로덕션 빌드
```

## 환경 변수

```
JAVA_HOME          JDK 17 경로
GOOGLE_CLIENT_ID   Google OAuth2 클라이언트 ID
GOOGLE_CLIENT_SECRET Google OAuth2 클라이언트 시크릿
JWT_SECRET         32자 이상 랜덤 문자열
DB_URL             PostgreSQL JDBC URL (운영 환경)
DB_USERNAME        DB 사용자명
DB_PASSWORD        DB 비밀번호
```

## 에이전트 컨텍스트 파일

에이전트 시스템은 아래 공유 파일을 사용한다. 각 에이전트 파일은 이 파일들을 참조하도록 간소화되어 있다.

| 파일 | 용도 |
|------|------|
| `.claude/agents/CLAUDE.md` | 프로젝트 컨텍스트 — 스택, 도메인 모델, CRITICAL 규칙, API 목록 |
| `.claude/agents/SKILL.md` | 공통 절차 — 빌드/테스트 명령, 서버 실행, 작업 로그 규칙, 커밋 컨벤션 |

에이전트 파일 목록: `architect.md`, `developer.md`, `qa.md`, `user.md`

## 테스트 파일

테스트 항목은 `tests/` 폴더에서 별도 관리한다. 에이전트가 검증 시 이 파일을 읽어 실행한다.
**기능 추가·수정·삭제 시 해당 파일을 반드시 함께 갱신한다.**

| 파일 | 용도 | 사용 에이전트 |
|------|------|-------------|
| `tests/qa-checklist.md` | UI/UX·보안·데이터 무결성 체크리스트 | qa |
| `tests/live-scenarios.md` | API 라이브 테스트 시나리오 (22개) | user |

---

## 아키텍처 개요

### 인증 흐름
```
브라우저 → /oauth2/authorization/google
  → Google OAuth2 콜백 → OAuth2UserService (User 생성/조회)
  → OAuth2SuccessHandler (JWT 발급)
  → /auth/callback?accessToken=...&refreshToken=...
  → 프론트엔드 localStorage 저장
  → 이후 모든 요청: Authorization: Bearer {accessToken}
  → JwtFilter: 토큰 검증 → userId SecurityContext 저장 (DB 조회 없음)
```

### 패키지 구조
```
src/main/java/com/marketplace/
├── api/              # REST 컨트롤러, DTO (record), 글로벌 예외 핸들러
├── config/           # Spring Security, JWT, OAuth2, RestClient, Async 설정
├── domain/           # JPA 엔티티, 도메인 열거형
├── infrastructure/   # 외부 서비스 통합 (AI, 결제, 이메일 등)
├── repository/       # Spring Data JPA 인터페이스
└── service/          # 비즈니스 로직, 이벤트 핸들러
```

### 프론트엔드 구조
```
frontend/src/
├── api/              # Axios 클라이언트 + API 함수 모음
├── pages/            # 페이지 컴포넌트 (라우트 단위)
├── components/       # 재사용 UI 컴포넌트
└── types/            # TypeScript 인터페이스 정의
```

### 빌드 통합
Gradle이 프론트엔드 빌드를 자동으로 실행하고 결과물을 `src/main/resources/static/`에 복사한다.
Spring Boot가 SPA를 서빙하고, SpaController가 모든 비-API 경로를 index.html로 포워딩한다.
