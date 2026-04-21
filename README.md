# MarketPlace

Claude Code 프롬프트 마켓플레이스. CLAUDE.md, Agent, Skill, Settings, Bundle 등 개발자 워크플로우에 맞는 프롬프트를 사고팔 수 있는 플랫폼입니다.

## 기술 스택

| 레이어 | 기술 |
|--------|------|
| 백엔드 | Spring Boot 3.4.x · JDK 17 · Spring Security 6 · JWT · Google OAuth2 |
| 데이터 | Spring Data JPA · H2 (개발) · PostgreSQL (운영) |
| 프론트엔드 | React 18 · TypeScript · Vite 5 · Tailwind CSS 3 |
| 빌드 | Gradle 8 (프론트엔드 빌드 포함) |

---

## 사전 요구사항

| 도구 | 최소 버전 | 확인 방법 |
|------|-----------|-----------|
| JDK | 17 | `java -version` |
| Node.js | 18 | `node -v` |
| Python | 3.x | `python --version` (Harness 실행 시) |
| Google Cloud 프로젝트 | — | OAuth2 자격증명 발급 필요 |

---

## 환경 설정

### 1. `.env` 파일 생성

**macOS / Linux / Git Bash:**
```bash
cp .env.example .env
```

**Windows (PowerShell):**
```powershell
Copy-Item .env.example .env
```

**Windows (CMD):**
```cmd
copy .env.example .env
```

---

### 2. Google OAuth2 자격증명 발급

1. [Google Cloud Console](https://console.cloud.google.com/apis/credentials) 접속
2. 사용자 인증 정보 만들기 → **OAuth 2.0 클라이언트 ID**
3. 애플리케이션 유형: **웹 애플리케이션**
4. 승인된 리디렉션 URI 추가:
   ```
   http://localhost:8080/login/oauth2/code/google
   ```
5. 생성된 클라이언트 ID와 시크릿을 `.env`에 입력

---

### 3. JWT 시크릿 생성

**macOS / Linux / Git Bash:**
```bash
openssl rand -base64 32
```

**Windows (PowerShell — openssl 없을 때):**
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { [byte](Get-Random -Max 256) }))
```

생성된 값을 `.env`의 `JWT_SECRET`에 입력합니다.

---

### 4. `.env` 파일 작성

```env
# JAVA_HOME — JDK 17+ 경로
# Windows 예: C:\Program Files\Java\jdk-17
# macOS 예:   /Library/Java/JavaVirtualMachines/jdk-17.jdk/Contents/Home
# Linux 예:   /usr/lib/jvm/java-17-openjdk
JAVA_HOME=여기에_JDK_경로_입력

# Google OAuth2
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret

# JWT 시크릿 (32자 이상)
JWT_SECRET=생성된_랜덤_문자열

# 운영 환경 DB (개발 시 불필요, H2 자동 사용)
# DB_URL=jdbc:postgresql://localhost:5432/marketplace
# DB_USERNAME=postgres
# DB_PASSWORD=your-db-password
```

---

### 5. 환경 변수 로드

백엔드 실행 전 셸에 환경 변수를 로드합니다.

**macOS / Linux / Git Bash:**
```bash
export $(grep -v '^#' .env | xargs)
```

**Windows (PowerShell):**
```powershell
Get-Content .env | Where-Object { $_ -notmatch '^#' -and $_ -ne '' } | ForEach-Object {
    $key, $val = $_ -split '=', 2
    [System.Environment]::SetEnvironmentVariable($key, $val, 'Process')
}
```

> 매번 로드하기 번거롭다면, IntelliJ IDEA의 **Run Configuration → Environment variables**에 `.env` 내용을 직접 입력해도 됩니다.

---

## 실행 방법

### 풀스택 실행 (백엔드 + 프론트엔드 통합)

백엔드가 프론트엔드를 빌드하고 함께 서빙합니다.

**Windows (PowerShell) — 권장:**
```powershell
.\run.ps1
```
> `run.ps1`이 `.env`를 읽어 `JAVA_HOME`을 자동 설정하고 `gradlew.bat bootRun`을 실행합니다.  
> PowerShell에서 `.\gradlew.bat bootRun`을 직접 실행하면 `JAVA_HOME`이 설정되지 않아 Java 8로 실행되며 빌드가 실패합니다.

**macOS / Linux / Git Bash:**
```bash
export $(grep -v '^#' .env | xargs)
./gradlew bootRun
```

**Windows (Git Bash):**
```bash
export $(grep -v '^#' .env | xargs)
./gradlew bootRun
```

접속: http://localhost:8080

> 첫 실행 시 `npm install` + `npm run build`가 자동으로 수행됩니다 (수 분 소요).

---

### 개발 서버 분리 실행 (핫 리로드)

백엔드와 프론트엔드를 독립적으로 실행합니다. 프론트엔드 변경 시 즉시 반영됩니다.

**터미널 1 — 백엔드:**

macOS / Linux / Git Bash:
```bash
export $(grep -v '^#' .env | xargs)
./gradlew bootRun -x copyFrontend
```

Windows (PowerShell):
```powershell
# run.ps1 내용을 수정하거나 아래처럼 직접 실행
$env:JAVA_HOME = (Get-Content .env | Select-String 'JAVA_HOME' | ForEach-Object { ($_ -split '=',2)[1].Trim() -replace "`r",'' })
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"
.\gradlew.bat bootRun -x copyFrontend
```

**터미널 2 — 프론트엔드:**

macOS / Linux:
```bash
cd frontend
npm install        # 최초 1회 또는 package.json 변경 시
npm run dev
```

Windows (PowerShell / CMD):
```powershell
cd frontend
npm install
npm run dev
```

> Windows에서 `&&`로 명령을 연결하면 오류가 날 수 있습니다. 각 명령을 줄 단위로 실행하세요.

접속: http://localhost:5173 (Vite가 API 요청을 8080으로 프록시)

---

## 테스트

### 백엔드 전체 테스트

**macOS / Linux / Git Bash:**
```bash
export $(grep -v '^#' .env | xargs)
./gradlew test
```

**Windows (PowerShell):**
```powershell
.\gradlew.bat test
```

테스트 리포트: `build/reports/tests/test/index.html`

### 프론트엔드 타입 체크

```bash
cd frontend
npx tsc --noEmit
```

### 프론트엔드 빌드 검증

```bash
cd frontend
npm run build
```

---

## 운영 환경 (PostgreSQL)

`.env`에 DB 설정을 추가합니다:

```env
DB_URL=jdbc:postgresql://localhost:5432/marketplace
DB_USERNAME=postgres
DB_PASSWORD=your-db-password
```

Spring profile을 지정해 실행:

**macOS / Linux / Git Bash:**
```bash
export $(grep -v '^#' .env | xargs)
./gradlew bootRun --args='--spring.profiles.active=prod'
```

**Windows (PowerShell):**
```powershell
.\gradlew.bat bootRun --args='--spring.profiles.active=prod'
```

---

## Harness (자동화 개발 실행기)

`phases/` 디렉토리에 정의된 개발 단계를 `scripts/execute.py`로 순차 실행합니다.

```bash
# 단계 실행
python scripts/execute.py {phase-name}

# 실행 후 자동 push
python scripts/execute.py {phase-name} --push
```

각 단계 상태는 `phases/{phase-name}/index.json`에서 확인할 수 있습니다.

| 상태 | 의미 |
|------|------|
| `pending` | 미실행 |
| `completed` | 완료 |
| `error` | 실패 — `error_message` 확인 후 `status`를 `pending`으로 되돌려 재실행 |
| `blocked` | 수동 개입 필요 — `blocked_reason` 확인 후 해결 |

---

## 프로젝트 구조

```
marketplace/
├── src/main/java/com/marketplace/
│   ├── api/            # REST 컨트롤러, DTO
│   ├── config/         # Security, JWT, OAuth2 설정
│   ├── domain/         # JPA 엔티티
│   ├── infrastructure/ # 외부 서비스 통합
│   ├── repository/     # Spring Data JPA
│   └── service/        # 비즈니스 로직
├── frontend/src/
│   ├── api/            # Axios 클라이언트 (JWT 인터셉터 포함)
│   ├── components/     # 재사용 UI 컴포넌트
│   ├── pages/          # 페이지 컴포넌트
│   └── types/          # TypeScript 타입 정의
├── docs/               # PRD, ARCHITECTURE, ADR, UI_GUIDE
├── phases/             # Harness 개발 단계 정의
└── scripts/            # execute.py (Harness 실행기)
```

---

## 주요 엔드포인트

| 메서드 | 경로 | 설명 | 인증 |
|--------|------|------|------|
| GET | `/api/prompts` | 프롬프트 목록 (페이지네이션, 필터) | 선택 |
| GET | `/api/prompts/{id}` | 프롬프트 상세 (미구매자는 preview만) | 선택 |
| POST | `/api/prompts` | 프롬프트 업로드 | 필요 |
| PUT | `/api/prompts/{id}` | 프롬프트 수정 | 필요 (본인) |
| DELETE | `/api/prompts/{id}` | 프롬프트 삭제 | 필요 (본인) |
| GET | `/api/prompts/{id}/download` | 원본 파일 다운로드 | 필요 (구매자) |
| POST | `/api/purchases/{promptId}` | 구매 | 필요 |
| GET | `/api/purchases` | 내 구매 내역 | 필요 |
| GET | `/api/users/me/prompts` | 내 판매 목록 | 필요 |
| GET | `/oauth2/authorization/google` | Google 로그인 시작 | — |
| POST | `/api/auth/refresh` | 액세스 토큰 재발급 | refresh token |

---

## 인증 흐름

```
브라우저 → /oauth2/authorization/google
  → Google OAuth2 콜백
  → JWT 발급 (accessToken 1시간 / refreshToken 14일)
  → /auth/callback?accessToken=...&refreshToken=...
  → localStorage 저장
  → 이후 모든 요청: Authorization: Bearer {accessToken}
  → 401 응답 시 refreshToken으로 자동 재발급 후 재시도
```

---

## 트러블슈팅

**`JAVA_HOME` 오류 — `gradlew: JAVA_HOME is not set`**

`.env`의 `JAVA_HOME` 값이 올바른지 확인하고, 환경 변수 로드 명령을 다시 실행하세요.

**프론트엔드 빌드가 안 됨 — `node: command not found`**

Node.js 18+ 설치 여부를 확인하세요: `node -v`

**Google 로그인 후 리디렉션 오류**

Google Cloud Console에서 승인된 리디렉션 URI가 정확히 `http://localhost:8080/login/oauth2/code/google`로 등록됐는지 확인하세요.

**Windows PowerShell에서 `Dependency requires at least JVM runtime version 17` 오류**

`.\gradlew.bat bootRun` 대신 `.\run.ps1`을 사용하세요. `run.ps1`이 `.env`의 `JAVA_HOME`을 실행 전에 자동으로 설정합니다.

**Windows에서 `./gradlew` 실행 안 됨**

Git Bash를 사용하거나 PowerShell에서 `.\run.ps1`을 사용하세요.
