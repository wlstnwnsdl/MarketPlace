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
