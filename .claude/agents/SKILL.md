# MarketPlace — 에이전트 공통 절차

모든 에이전트는 필요한 절차를 이 파일에서 참조한다.

---

## 빌드 / 테스트

`./gradlew` 실행 시 `JAVA_HOME`을 명시해야 한다 (셸 기본값이 Java 8일 수 있음).

```bash
# .env에서 JAVA_HOME 값 확인 후:
JAVA_HOME="D:/_eclipse_setting 2022/jdk-17.0.17+10" \
  PATH="D:/_eclipse_setting 2022/jdk-17.0.17+10/bin:$PATH" \
  ./gradlew <task>

# 자주 쓰는 태스크
./gradlew compileTestJava   # 테스트 컴파일만 (빠른 오류 확인)
./gradlew test              # 전체 테스트
./gradlew build -x test     # 테스트 제외 빌드
./gradlew bootRun           # 개발 서버 기동 (.env 자동 로드)

# 프론트엔드
cd frontend && npm run build   # 타입 체크 + Vite 빌드
cd frontend && npm run dev     # Vite 개발 서버 (포트 5173)
```

---

## 서버 라이프사이클

### 시작

```bash
# bash (Git Bash / WSL) — .env 수동 로드 후 실행
export $(grep -v '^#' .env | xargs)
./gradlew bootRun           # 백엔드 포트 8080

# Windows PowerShell (권장)
.\run.ps1

# 프론트엔드 개발 서버 (선택)
cd frontend && npm run dev  # 포트 5173, /api/* → 8080 프록시
```

### 검증

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/api/prompts
```

### 종료

```bash
Ctrl+C

# 포트 점유 시 (Windows)
netstat -ano | findstr :8080
taskkill /PID {PID} /F

# 포트 점유 시 (macOS/Linux)
lsof -ti:8080 | xargs kill -9
```

---

## 테스트 파일 위치

| 파일 | 용도 | 관리 주체 |
|------|------|----------|
| `tests/qa-checklist.md` | UI/UX·보안·데이터 무결성 체크리스트 | qa 에이전트 + developer 에이전트 |
| `tests/live-scenarios.md` | API 라이브 테스트 시나리오 22개 | user 에이전트 + developer 에이전트 |

기능 변경 시 developer 에이전트가 해당 파일을 갱신한다 (developer.md의 테스트 파일 갱신 규칙 참고).

---

## 작업 로그 (works/)

구현 완료 후 반드시 `works/` 폴더에 로그를 작성한다. **생략 불가.**

### 경로 규칙

```
works/{기능명}/{NN}_{설명}.md
```

- `{기능명}`: 작업 대상 한두 단어 (예: `로그인구현`, `프롬프트검색`, `보안패치`)
- `{NN}`: 폴더 내 기존 파일 수 + 1 (01, 02, …)
- `{설명}`: 이번 작업의 핵심 한 줄 (예: `JWT재발급버그수정`)

순번 확인:
```bash
ls works/{기능명}/ 2>/dev/null | wc -l   # 결과 + 1 = 다음 순번
```

### 로그 파일 형식

```markdown
# {NN}. {설명}

**날짜**: YYYY-MM-DD
**작업 유형**: feat / fix / refactor / chore

## 작업 내용

{무엇을 왜 했는지. 2-5줄}

## 변경 파일

- `경로/파일.java` — 변경 내용 한 줄

## 핵심 결정 / 주의사항

{비자명한 결정이나 제약. 없으면 생략}
```

---

## 커밋 컨벤션

```
feat:     새 기능
fix:      버그 수정
refactor: 동작 변경 없는 코드 개선
chore:    빌드, 설정, 문서
docs:     문서만 변경
test:     테스트만 변경
```

사용자 승인 없이 `git commit / git push` 금지.

---

## 코딩 컨벤션 요약

### 백엔드
- DTO: Java record 사용
- 엔티티: `@Data` 금지 → `@Getter` + 필요한 메서드만
- 예외: `RuntimeException` 상속, `api/exception/` 위치
- 서비스 메서드: `@Transactional` 명시
- 로깅: `System.out.println` 금지 → SLF4J 사용

### 프론트엔드
- `any` 타입 금지 — TypeScript strict 준수
- API 호출: `api/client.ts` Axios 인스턴스만 사용 (fetch 직접 호출 금지)
- 타입: `types/index.ts`에만 정의
- 스타일: Tailwind만 사용, inline style 금지
