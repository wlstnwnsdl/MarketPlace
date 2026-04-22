# 아키텍처

## 디렉토리 구조

### 백엔드
```
src/main/java/com/marketplace/
├── api/
│   ├── AuthController.java
│   ├── PromptController.java       # 프롬프트 CRUD, 다운로드
│   ├── PurchaseController.java     # 구매/다운로드 처리
│   ├── GlobalExceptionHandler.java
│   ├── SpaController.java
│   ├── dto/                        # Java record 기반 요청/응답 DTO
│   │   ├── PromptRequest.java
│   │   ├── PromptResponse.java
│   │   ├── PromptDetailResponse.java  # 소유자·구매자: 전체 content, 미구매: previewContent만
│   │   ├── PurchaseResponse.java
│   │   └── UserResponse.java          # id, email, name
│   └── exception/
│       ├── PromptNotFoundException.java
│       ├── AlreadyPurchasedException.java
│       └── UserNotFoundException.java
├── config/
│   ├── SecurityConfig.java
│   ├── JwtProvider.java
│   ├── JwtFilter.java
│   ├── OAuth2UserService.java
│   ├── OAuth2SuccessHandler.java
│   └── AsyncConfig.java
├── domain/
│   ├── User.java                   # id, email, name, provider, role
│   ├── Prompt.java                 # id, seller_id, title, description, content, previewContent, type, status, price, tags, downloadCount
│   ├── Purchase.java               # id, buyer_id, prompt_id, purchased_at
│   ├── RefreshToken.java
│   └── enums/
│       ├── PromptType.java         # CLAUDE_MD, AGENT, SKILL, SETTINGS, BUNDLE
│       ├── TargetRole.java         # DEVELOPER, PLANNER, DESIGNER, PM, MARKETER, SALES
│       └── PromptStatus.java       # PENDING(대기), PUBLIC(공개), PRIVATE(미공개)
├── repository/
│   ├── UserRepository.java
│   ├── PromptRepository.java       # 타입/태그/역할 필터 쿼리 포함
│   └── PurchaseRepository.java
└── service/
    ├── PromptService.java
    ├── PurchaseService.java
    └── UserService.java              # getById(Long) — Controller가 User 엔티티 조회 시 사용
```

### 프론트엔드
```
frontend/src/
├── api/
│   ├── client.ts                   # Axios 인스턴스 (JWT 인터셉터, 401 자동 재발급)
│   ├── prompts.ts                  # 프롬프트 관련 API 함수
│   ├── purchases.ts                # 구매/다운로드 API 함수
│   └── user.ts                     # getMe() — 로그인 사용자 프로필 조회
├── pages/
│   ├── LoginPage.tsx
│   ├── CallbackPage.tsx            # OAuth2 토큰 파싱, localStorage 저장
│   ├── HomePage.tsx                # 프롬프트 목록 + 필터/검색
│   ├── PromptDetailPage.tsx        # 미리보기, 구매, 다운로드
│   ├── UploadPage.tsx              # 프롬프트 등록 (판매자)
│   └── MyPage.tsx                  # 구매 내역, 판매 내역
├── components/
│   ├── PromptCard.tsx              # 카드: 타입 배지, 제목, 가격, 다운로드수
│   ├── PromptPreview.tsx           # 코드 블록 스타일 미리보기
│   ├── FilterBar.tsx               # 타입/역할/태그 필터
│   └── TagBadge.tsx
└── types/
    └── index.ts
```

## 패턴

- **백엔드**: Layered Architecture (Controller → Service → Repository)
- **인증**: Stateless JWT. JwtFilter가 매 요청마다 토큰을 검증하고 userId를 SecurityContext에 주입 (DB 조회 없음)
- **보안 전략**: `/api/**`만 Spring Security 인증 강제. SPA 프론트엔드 라우트(`/`, `/login`, `/auth/callback`, `/mypage` 등)는 `anyRequest().permitAll()`로 통과 — React가 클라이언트에서 인증 처리 (ADR-006 참고)
- **콘텐츠 접근 제어**: 프롬프트 상세 조회 시 Service 레이어에서 소유자(sellerId 일치) 여부를 먼저 확인한다. 소유자는 status·구매 여부와 무관하게 전체 content를 반환한다. 비소유자는 Purchase 레코드 유무로 content 범위를 결정한다. 다운로드 API도 동일 규칙 적용
- **비동기**: @TransactionalEventListener(AFTER_COMMIT) + @Async — 구매 완료 후 다운로드 카운트 증가 등 후처리
- **환경 변수**: `build.gradle`의 `bootRun` 태스크가 `.env` 파일을 자동 로드. `./gradlew bootRun`만으로 실행 가능 (ADR-007 참고)

## 데이터 흐름

### 프롬프트 탐색
```
HomePage → GET /api/prompts?type=AGENT&role=DEVELOPER&tag=spring-boot
  → PromptController → PromptService → PromptRepository (필터 쿼리)
  → List<PromptResponse> (previewContent만 포함) → PromptCard 렌더링
```

### 프롬프트 상세 + 접근 제어
```
PromptDetailPage → GET /api/prompts/{id}
  → PromptService: sellerId == requesterId? → 소유자 → content 전체 반환 (purchased=true)
  → 비소유자 + PENDING/PRIVATE → 404
  → 비소유자 + PUBLIC + 구매완료 → content 전체 반환
  → 비소유자 + PUBLIC + 미구매 → previewContent만 반환
```

### 구매 및 다운로드
```
PromptDetailPage → POST /api/purchases/{promptId}
  → PurchaseService: 중복 구매 방지 검증 → Purchase 생성 저장
  → 트랜잭션 커밋
  → @TransactionalEventListener: downloadCount 증가 (비동기)
  → GET /api/prompts/{id}/download → content를 .md 파일로 응답 (Content-Disposition)
```

### 토큰 재발급
```
Axios 인터셉터 → 401 응답 감지
  → POST /api/auth/refresh (refreshToken)
  → 새 accessToken + refreshToken 발급 (rotation)
  → localStorage 갱신 → 원본 요청 재시도
```

## 상태 관리

- 서버 상태: Axios 직접 호출 (React Query 미사용, MVP 범위 최소화)
- 클라이언트 상태: useState/useReducer
- 인증 상태: localStorage (accessToken, refreshToken)

## DB 스키마

| 테이블 | 주요 컬럼 |
|--------|-----------|
| users | id, email, name, provider, provider_id, created_at |
| prompts | id, seller_id(FK), title, description, content(TEXT), preview_content(TEXT), type(enum), target_role(enum), price, tags(collection), download_count, created_at |
| prompt_tags | prompt_id(FK), tag (컬렉션 테이블) |
| purchases | id, buyer_id(FK), prompt_id(FK), purchased_at |
| refresh_tokens | user_id(PK), token, expiry_date |

## API 엔드포인트

| Method | Path | 설명 | 인증 |
|--------|------|------|------|
| POST | /oauth2/authorization/google | Google 로그인 | - |
| POST | /api/auth/refresh | 토큰 재발급 | refreshToken |
| GET | /api/prompts | 프롬프트 목록 (필터/검색, PUBLIC만 노출) | 선택 |
| POST | /api/prompts | 프롬프트 등록 (status: PENDING\|PUBLIC\|PRIVATE) | 필수 |
| GET | /api/prompts/{id} | 프롬프트 상세 (PENDING/PRIVATE는 소유자만, PUBLIC은 구매 여부에 따라 content 범위 다름) | 선택 |
| PUT | /api/prompts/{id} | 프롬프트 수정 (status 변경 포함) | 필수 (본인) |
| DELETE | /api/prompts/{id} | 프롬프트 삭제 | 필수 (본인) |
| GET | /api/prompts/{id}/download | 원본 파일 다운로드 | 필수 (소유자 또는 구매자) |
| POST | /api/purchases/{promptId} | 구매 (무료/유료) | 필수 |
| GET | /api/purchases | 내 구매 내역 | 필수 |
| GET | /api/users/me | 로그인 사용자 프로필 (email, name) | 필수 |
| GET | /api/users/me/prompts | 내 판매 목록 | 필수 |
