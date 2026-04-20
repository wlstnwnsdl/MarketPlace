# Step 0: project-setup

## 읽어야 할 파일

먼저 아래 파일들을 읽고 프로젝트의 아키텍처와 설계 의도를 파악하라:

- `CLAUDE.md`
- `docs/ARCHITECTURE.md`
- `docs/ADR.md`

## 작업

이 프로젝트는 **Spring Boot 3.4.x 백엔드 + React 18 + TypeScript + Vite 5.x 프론트엔드** 구조다.
Gradle이 프론트엔드를 빌드하고 결과물을 `src/main/resources/static/`에 복사해 단일 JAR로 배포한다.
프로젝트 루트에 백엔드(Gradle), `frontend/` 하위에 프론트엔드(Node.js)가 위치한다.

### 1. Gradle 빌드 파일

**`settings.gradle`** — 프로젝트명 `marketplace` 설정

**`build.gradle`** — 아래 의존성과 태스크를 포함한다:

의존성:
- `spring-boot-starter-web`
- `spring-boot-starter-security`
- `spring-boot-starter-oauth2-client`
- `spring-boot-starter-data-jpa`
- `spring-boot-starter-validation`
- `io.jsonwebtoken:jjwt-api:0.12.6`, `jjwt-impl:0.12.6`, `jjwt-jackson:0.12.6`
- `com.h2database:h2` (runtimeOnly)
- `org.projectlombok:lombok` (compileOnly + annotationProcessor)
- `spring-boot-starter-test`, `spring-security-test` (testImplementation)

Gradle 태스크 (순서대로 의존 관계 설정):
```
installFrontend  → npm install (frontend/ 디렉토리)
buildFrontend    → npm run build (frontend/ 디렉토리, installFrontend에 의존)
copyFrontend     → frontend/dist 전체를 src/main/resources/static/ 에 복사 (buildFrontend에 의존)
processResources → copyFrontend에 의존
```

Java toolchain: JDK 17

### 2. Spring Boot 엔트리포인트

**`src/main/java/com/marketplace/MarketplaceApplication.java`**
- `@SpringBootApplication` 애노테이션
- `main()` 메서드로 애플리케이션 실행

### 3. application.yml

**`src/main/resources/application.yml`**:
```yaml
spring:
  datasource:
    url: jdbc:h2:mem:marketplace;MODE=PostgreSQL;DB_CLOSE_DELAY=-1
    driver-class-name: org.h2.Driver
  jpa:
    hibernate:
      ddl-auto: create-drop
    show-sql: true
    properties:
      hibernate.format_sql: true
  security:
    oauth2:
      client:
        registration:
          google:
            client-id: ${GOOGLE_CLIENT_ID}
            client-secret: ${GOOGLE_CLIENT_SECRET}
            scope: email,profile

jwt:
  secret: ${JWT_SECRET}
  access-token-expiry: 3600000
  refresh-token-expiry: 1209600000

cors:
  allowed-origins: http://localhost:3000,http://localhost:5173

frontend:
  url: http://localhost:8080

logging:
  level:
    com.marketplace: DEBUG
    org.springframework.security: INFO
```

**`src/test/resources/application.yml`**:
- 동일 구조, JWT_SECRET은 테스트용 고정값(`test-secret-key-for-junit-minimum-32chars`)으로 직접 기입
- GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET은 `test-client-id`, `test-client-secret`으로 고정

### 4. 프론트엔드 초기화

**`frontend/package.json`**:
```json
{
  "name": "marketplace-frontend",
  "private": true,
  "version": "0.0.1",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "axios": "^1.7.2",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.24.1"
  },
  "devDependencies": {
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "autoprefixer": "^10.4.19",
    "postcss": "^8.4.39",
    "tailwindcss": "^3.4.6",
    "typescript": "^5.4.5",
    "vite": "^5.3.4"
  }
}
```

**`frontend/vite.config.ts`**:
- 포트 5173
- `/api`, `/oauth2`, `/login` 경로를 `http://localhost:8080`으로 프록시

**`frontend/tsconfig.json`**:
- strict: true
- target: ES2020
- lib: ["ES2020", "DOM", "DOM.Iterable"]
- moduleResolution: bundler

**`frontend/tailwind.config.js`**:
- content: `["./index.html", "./src/**/*.{js,ts,jsx,tsx}"]`

**`frontend/postcss.config.js`**:
- tailwindcss + autoprefixer 플러그인

**`frontend/index.html`**:
- `<div id="root"></div>` + `/src/main.tsx` 스크립트 참조

**`frontend/src/main.tsx`**:
- `ReactDOM.createRoot(document.getElementById('root')!).render(<App />)`

**`frontend/src/index.css`**:
- `@tailwind base; @tailwind components; @tailwind utilities;`

**`frontend/src/App.tsx`**:
- 임시 placeholder: `<div>MarketPlace</div>` 반환 (Step 7에서 라우터로 교체)

### 5. .gitignore 업데이트

루트 `.gitignore`에 아래 항목이 없으면 추가:
```
.gradle/
build/
frontend/node_modules/
frontend/dist/
src/main/resources/static/
*.jar
```

## Acceptance Criteria

```bash
# 백엔드 컴파일 확인 (프론트엔드 빌드 제외)
./gradlew compileJava

# 프론트엔드 타입 체크
cd frontend && npm install && npm run build
```

## 검증 절차

1. 위 AC 커맨드를 순서대로 실행한다.
2. 아키텍처 체크리스트:
   - 패키지 루트가 `com.marketplace`인가?
   - `frontend/` 디렉토리가 프로젝트 루트 하위에 있는가?
   - `application.yml`에 환경변수 참조(`${...}`)가 올바르게 사용되었는가?
3. 결과에 따라 `phases/0-mvp/index.json`의 step 0을 업데이트한다:
   - 성공 → `"status": "completed"`, `"summary": "Gradle 빌드 설정 완료, Spring Boot 스켈레톤 및 React/Vite 프론트엔드 초기화 완료"`
   - 수정 3회 후 실패 → `"status": "error"`, `"error_message": "구체적 에러 내용"`
   - 수동 개입 필요 → `"status": "blocked"`, `"blocked_reason": "구체적 사유"`

## 금지사항

- `src/main/resources/static/` 디렉토리를 수동으로 만들지 마라. Gradle copyFrontend 태스크가 자동 생성한다.
- `frontend/node_modules/`를 git에 커밋하지 마라.
- `application.yml`에 실제 시크릿 값을 하드코딩하지 마라. 반드시 `${ENV_VAR}` 형식을 사용한다. (테스트용 yml 제외)
- 기존 테스트를 깨뜨리지 마라.
