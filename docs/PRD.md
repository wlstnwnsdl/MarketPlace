# PRD: MarketPlace (Claude Code Prompt 마켓)

## 목표
개발자·기획자가 자신의 작업 스타일에 맞는 Claude Code 프롬프트(CLAUDE.md, agents, skills, commands 등)를 사고팔 수 있는 마켓플레이스를 제공한다.

## 사용자
- **구매자 (개발자/기획자)**: 자신의 작업 스타일과 기술 스택에 맞는 Claude Code 설정 파일을 찾아 바로 적용하고 싶은 사람
- **판매자 (프롬프트 크리에이터)**: 검증된 Claude Code 프롬프트를 공유하고 수익화하려는 숙련된 개발자 또는 기획자

## 핵심 기능
1. **회원 인증** — Google OAuth2 로그인, 판매자/구매자 역할 전환 가능
2. **프롬프트 등록** — 파일 타입별 업로드 (CLAUDE.md, agents/*.md, skills/*.md, commands/*.md), 제목·설명·태그·가격 설정
3. **프롬프트 탐색** — 타입별 필터(CLAUDE.md / agents / skills / commands), 역할별 필터(개발자 / 기획자 / 디자이너), 기술 스택 태그 검색
4. **상세 페이지** — 프롬프트 미리보기(일부 내용 공개), 사용 예시, 판매자 정보
5. **구매 및 다운로드** — 결제(MVP는 무료 티어만) 후 원본 파일 다운로드

## 프롬프트 타입 정의

| 타입 | 설명 | 예시 파일명 |
|------|------|------------|
| CLAUDE.md | 프로젝트 루트 지침 파일 | CLAUDE.md |
| Agent | 역할별 서브에이전트 지침 | agents/architect.md, agents/developer.md |
| Skill | 커스텀 슬래시 커맨드 | .claude/commands/harness.md, review.md |
| Settings | Claude Code 설정 | .claude/settings.json |
| Bundle | 위 타입들의 묶음 패키지 | 전체 .claude/ 디렉토리 구성 |

## MVP 제외 사항
- 실결제 (PG사 연동). MVP는 무료 다운로드 + 유료 등록만 구현, 실제 결제 처리 없음
- 리뷰·평점 시스템
- 실시간 팔로우/알림
- 프롬프트 버전 관리 (v2.0 업데이트 등)
- 판매자 정산/수수료 정산

## 디자인
- 다크 모드 고정 — 개발자 타겟, 터미널·에디터 친화적
- 무채색 베이스 + amber 포인트 1가지 (코드 에디터의 syntax highlight 색감 참조)
- 도구적 UI — GitHub Marketplace 느낌. 마케팅 랜딩이 아닌 탐색/검색 중심 대시보드
- 프롬프트 미리보기는 코드 블록 스타일로 표시 (monospace font)
