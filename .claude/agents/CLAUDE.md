# MarketPlace — 에이전트 공유 컨텍스트

모든 에이전트는 작업 시작 전 이 파일을 읽는다.

---

## 프로젝트 개요

**MarketPlace**는 Claude Code 프롬프트(CLAUDE.md, agents, skills, commands 등)를 사고파는 마켓플레이스다.

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| 백엔드 | Java 17, Spring Boot 3.4.x, Gradle |
| 인증 | Spring Security 6, Google OAuth2, JWT Stateless (JJWT 0.12.6) |
| 데이터 | Spring Data JPA, H2(개발) / PostgreSQL(운영) |
| 비동기 | `@Async` + `@TransactionalEventListener(AFTER_COMMIT)` |
| 프론트엔드 | React 18, TypeScript strict, Vite 5, Tailwind CSS 3, React Router DOM 6, Axios |

---

## 패키지 구조

```
src/main/java/com/marketplace/
├── api/              # Controller, DTO(record), GlobalExceptionHandler, SpaController
│   ├── dto/          # Java record 기반 요청/응답 DTO
│   └── exception/    # 도메인 예외 (PromptNotFoundException 등)
├── config/           # SecurityConfig, JwtProvider, JwtFilter, OAuth2*, AsyncConfig
├── domain/           # JPA 엔티티 (@Getter만), 열거형 (enums/)
├── infrastructure/   # 외부 서비스 클라이언트 (AI, 결제 등)
├── repository/       # Spring Data JPA 인터페이스
└── service/          # 비즈니스 로직, 이벤트 핸들러

frontend/src/
├── api/              # client.ts (Axios+JWT 인터셉터), prompts.ts, purchases.ts, user.ts
├── components/       # 재사용 UI 컴포넌트
├── pages/            # 페이지 컴포넌트 (라우트 단위)
└── types/            # index.ts — 모든 타입 집중 관리 (분산 금지)
```

---

## 핵심 도메인 모델

```
Prompt   : id, sellerId(Long), title, description, content(TEXT), previewContent(TEXT),
           type(PromptType), targetRole(TargetRole), price, downloadCount, tags, status(PromptStatus), createdAt
Purchase : id, buyerId(Long), promptId(Long), purchasedAt   [unique: (buyerId, promptId)]
User     : id, email, name, provider, providerId, createdAt
RefreshToken : userId(PK), token, expiryDate

PromptType   : CLAUDE_MD | AGENT | SKILL | SETTINGS | BUNDLE
TargetRole   : DEVELOPER | PLANNER | DESIGNER | PM | MARKETER | SALES
PromptStatus : PENDING(대기) | PUBLIC(공개) | PRIVATE(미공개)
```

---

## 핵심 아키텍처 패턴

### 인증 흐름
```
브라우저 → Google OAuth2 → OAuth2SuccessHandler (JWT 발급)
  → /auth/callback?accessToken=...
  → 프론트엔드 localStorage 저장
  → 이후 모든 요청: Authorization: Bearer {accessToken}
  → JwtFilter: 토큰 검증 → userId SecurityContext 저장 (DB 조회 없음)
```

### 콘텐츠 접근 제어
```
GET /api/prompts/{id}
  → 소유자(sellerId == requesterId)         → purchased=true, content 전체
  → 비소유자 + PENDING/PRIVATE              → 404
  → 비소유자 + PUBLIC + 구매완료(Purchase 존재) → purchased=true, content 전체
  → 비소유자 + PUBLIC + 미구매              → purchased=false, previewContent만
```

### 구매 후처리 (비동기)
```
POST /api/purchases/{id} → PurchaseService → Purchase 저장 → 트랜잭션 커밋
  → @TransactionalEventListener(AFTER_COMMIT) → downloadCount 증가 (@Async)
```

---

## CRITICAL 규칙

- **비즈니스 로직**: 반드시 `service/`에서만 처리. Controller는 요청/응답 변환만 담당
- **외부 API 호출**: 반드시 `infrastructure/`에서만. Service에서 직접 호출 금지
- **JPA 엔티티**: `@Data` 금지 → `@Getter` + 필요한 메서드만 정의
- **Controller 반환**: 엔티티 직접 반환 금지 → 반드시 DTO(record)로 변환
- **JwtFilter**: DB 조회 금지 — userId를 클레임에서 추출만 수행
- **엔티티 관계**: `@ManyToOne`/`@OneToMany` 양방향 관계 금지 → Long ID 직접 참조
- **타입 정의**: `frontend/src/types/index.ts`에 집중 관리 — 다른 파일에 분산 금지
- **API 경로**: 프론트엔드 → 백엔드는 `/api` 프리픽스 사용 (Vite 프록시)
- **TDD**: 새 기능 구현 시 테스트 먼저 작성 후 구현
- **커밋**: 사용자 승인 없이 `git commit / git push` 금지

---

## API 엔드포인트 목록

| Method | Path | 설명 | 인증 |
|--------|------|------|------|
| POST | /oauth2/authorization/google | Google 로그인 | - |
| POST | /api/auth/refresh | 토큰 재발급 | refreshToken |
| GET | /api/prompts | 목록 (PUBLIC만, 필터/검색) | 선택 |
| POST | /api/prompts | 등록 | 필수 |
| GET | /api/prompts/{id} | 상세 (접근 제어 적용) | 선택 |
| PUT | /api/prompts/{id} | 수정 | 필수(본인) |
| DELETE | /api/prompts/{id} | 삭제 | 필수(본인) |
| GET | /api/prompts/{id}/download | 원본 다운로드 | 필수(소유자·구매자) |
| POST | /api/purchases/{promptId} | 구매 | 필수 |
| GET | /api/purchases | 내 구매 내역 | 필수 |
| GET | /api/users/me | 내 프로필 | 필수 |
| GET | /api/users/me/prompts | 내 판매 목록 | 필수 |

---

## 환경 변수

`.env` 파일에서 로드 (`./gradlew bootRun` 시 자동 적용):

```
JAVA_HOME           D:/_eclipse_setting 2022/jdk-17.0.17+10
GOOGLE_CLIENT_ID    Google OAuth2 클라이언트 ID
GOOGLE_CLIENT_SECRET Google OAuth2 클라이언트 시크릿
JWT_SECRET          32자 이상 랜덤 문자열
```

> `./gradlew test`는 `.env`를 자동 로드하지 않는다. 빌드 전 수동 export 필요.
