# 02. request.md 5가지 버그 수정 및 기능 추가
**날짜**: 2026-04-22
**작업 유형**: fix, feat

## 작업 내용
request.md에 명시된 5가지 항목을 순서대로 처리했다.
① 수정 폼 내용란의 font-mono 제거로 설명란과 폰트 통일, ② previewContent null 시 content 폴백 + 소유자에게 "구매 후..." 텍스트 미표시, ③ 소유자 다운로드는 이전 세션에서 이미 수정 완료(확인), ④ 터미널 스타일 영문 버튼 전면 한글화, ⑤ GET /api/users/me 엔드포인트 신설 후 헤더에 프로필 원형 버튼과 이메일 드롭다운 추가.

## 변경 파일
- `src/main/java/com/marketplace/api/dto/UserResponse.java` — 신규: {id, email, name} 레코드
- `src/main/java/com/marketplace/api/PurchaseController.java` — GET /api/users/me 추가, UserRepository 주입
- `frontend/src/api/user.ts` — 신규: getMe() 함수
- `frontend/src/components/Header.tsx` — 프로필 버튼 + 이메일 드롭다운, 클릭 외부 닫기(mousedown 이벤트)
- `frontend/src/components/PromptPreview.tsx` — content 타입 string | null | undefined 허용
- `frontend/src/pages/HomePage.tsx` — 프로필 버튼 동일하게 추가, getMe() 호출
- `frontend/src/pages/UploadPage.tsx` — font-mono 제거, 버튼 텍스트 배포하기/수정 저장
- `frontend/src/pages/PromptDetailPage.tsx` — previewContent 폴백, purchased prop 전달, 버튼 한글화

## 핵심 결정 / 주의사항
- JWT 토큰 클레임에 email이 없어 /api/users/me DB 조회가 필요함. 헤더 마운트마다 1회 호출하므로 부하가 크지 않으나, 향후 email을 JWT claim에 포함시키면 DB 조회 제거 가능.
- previewContent가 null인 기존 데이터는 소유자/구매자 조회 시 content로 폴백 표시. 신규 등록분은 buildPreviewContent로 정상 생성됨.
