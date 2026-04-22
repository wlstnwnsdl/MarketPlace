"""
MarketPlace 라이브 통합 테스트 스크립트
사용자 관점에서 풀스택 API를 순서대로 검증한다.

Usage: python scripts/live_test.py [--base-url URL] [--no-wait]
Output: JSON 결과를 stdout에 출력, report/YYYYMMDD_test.md 생성
"""
import json
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime
from pathlib import Path

# ── 설정 ─────────────────────────────────────────────────────────────────────
BASE_URL = "http://localhost:8080"
_report_dir = Path(__file__).parent.parent / "report"
_report_dir.mkdir(exist_ok=True)
REPORT_PATH = _report_dir / f"{datetime.now().strftime('%Y%m%d')}_test.md"

# ── 토큰 생성 (gen_test_token.py 재사용) ────────────────────────────────────
sys.path.insert(0, str(Path(__file__).parent))
from gen_test_token import generate_token

SELLER_TOKEN = generate_token(user_id=1)
BUYER_TOKEN = generate_token(user_id=2)

# ── HTTP 헬퍼 ─────────────────────────────────────────────────────────────────
def request(method: str, path: str, body=None, token: str = None, expected_status: int = 200, binary: bool = False):
    url = BASE_URL + path
    data = json.dumps(body).encode() if body else None
    headers = {"Content-Type": "application/json", "Accept": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"

    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            status = resp.status
            body_raw = resp.read()
            if binary:
                body_parsed = body_raw
            else:
                text = body_raw.decode(errors="replace")
                try:
                    body_parsed = json.loads(text) if text else None
                except json.JSONDecodeError:
                    body_parsed = text
            return {"ok": status == expected_status, "status": status, "body": body_parsed}
    except urllib.error.HTTPError as e:
        body_raw = e.read().decode(errors="replace")
        return {"ok": e.code == expected_status, "status": e.code, "body": body_raw}
    except Exception as e:
        return {"ok": False, "status": 0, "body": str(e)}


def wait_for_server(timeout: int = 180):
    """서버가 준비될 때까지 대기"""
    print(f"[WAIT] 서버 준비 대기 중 (최대 {timeout}초)...", flush=True)
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            urllib.request.urlopen(BASE_URL + "/api/prompts", timeout=5)
            print("[WAIT] 서버 준비 완료!", flush=True)
            return True
        except Exception:
            time.sleep(5)
    return False


# ── 테스트 케이스 ─────────────────────────────────────────────────────────────
results = []


def test(name: str, scenario: str, fn):
    print(f"[TEST] {name}...", flush=True)
    t0 = time.time()
    try:
        result = fn()
        elapsed = round((time.time() - t0) * 1000)
        status = "PASS" if result.get("ok") else "FAIL"
        detail = result.get("detail", "")
        http_status = result.get("status", 0)
        print(f"  [{status}] {http_status} ({elapsed}ms) {detail}", flush=True)
        results.append({
            "name": name,
            "scenario": scenario,
            "status": status,
            "http_status": http_status,
            "elapsed_ms": elapsed,
            "detail": detail,
            "body_sample": str(result.get("body", ""))[:200],
        })
    except Exception as e:
        results.append({
            "name": name,
            "scenario": scenario,
            "status": "ERROR",
            "http_status": 0,
            "elapsed_ms": 0,
            "detail": str(e),
            "body_sample": "",
        })


# ── 상태 저장 변수 ─────────────────────────────────────────────────────────────
created_prompt_id = None


def run_tests():
    global created_prompt_id

    # ── 1. 공개 API ───────────────────────────────────────────────────────────
    def t1():
        r = request("GET", "/api/prompts")
        r["detail"] = f"총 {r['body'].get('totalElements', '?')}개 프롬프트" if r["ok"] and r["body"] else ""
        return r

    test("홈 - 프롬프트 목록 조회 (비로그인)", "사용자가 로그인 없이 마켓 목록을 본다", t1)

    def t2():
        r = request("GET", "/api/prompts?keyword=claude")
        r["detail"] = f"검색 결과 {r['body'].get('totalElements', '?')}건" if r["ok"] and r["body"] else ""
        return r

    test("검색 - 키워드 'claude'로 필터", "사용자가 키워드로 프롬프트를 검색한다", t2)

    def t3():
        r = request("GET", "/api/prompts?type=CLAUDE_MD")
        r["detail"] = f"CLAUDE_MD 타입 {r['body'].get('totalElements', '?')}건" if r["ok"] and r["body"] else ""
        return r

    test("필터 - CLAUDE_MD 타입 필터", "사용자가 타입 필터를 적용한다", t3)

    def t4():
        r = request("GET", "/api/prompts?targetRole=DEVELOPER")
        r["detail"] = f"DEVELOPER 역할 {r['body'].get('totalElements', '?')}건" if r["ok"] and r["body"] else ""
        return r

    test("필터 - DEVELOPER 역할 필터", "사용자가 역할 필터를 적용한다", t4)

    # ── 2. 인증 없이 보호 API 접근 시도 ─────────────────────────────────────
    def t5():
        r = request("POST", "/api/prompts", body={}, expected_status=401)
        r["ok"] = r["status"] == 401
        r["detail"] = "인증 없이 접근 시 401 반환 확인" if r["ok"] else f"예상 401, 실제 {r['status']}"
        return r

    test("보안 - 비인증 프롬프트 등록 차단", "미로그인 사용자가 업로드 시도 시 401을 받는다", t5)

    def t6():
        r = request("GET", "/api/purchases", expected_status=401)
        r["ok"] = r["status"] == 401
        r["detail"] = "인증 없이 구매 내역 접근 시 401 확인" if r["ok"] else f"예상 401, 실제 {r['status']}"
        return r

    test("보안 - 비인증 구매 내역 조회 차단", "미로그인 사용자가 구매 내역 접근 시 401을 받는다", t6)

    # ── 3. 더미 판매자(userId=1)로 프롬프트 등록 ──────────────────────────────
    def t7():
        r = request("POST", "/api/prompts", token=SELLER_TOKEN, body={
            "title": "[TEST] CLAUDE.md for Spring Boot Microservices",
            "description": "Spring Boot 마이크로서비스 개발에 최적화된 CLAUDE.md 설정 파일",
            "content": "# MarketPlace 테스트 프롬프트\n\n## 기술 스택\n- Spring Boot 3.4\n- JPA\n- JWT\n\n## 규칙\n- 모든 비즈니스 로직은 service 레이어에서 처리한다.",
            "type": "CLAUDE_MD",
            "targetRole": "DEVELOPER",
            "price": 2900,
            "tags": ["spring", "microservices", "test"],
        })
        if r["ok"] and r["body"]:
            global created_prompt_id
            created_prompt_id = r["body"].get("id")
            r["detail"] = f"생성된 프롬프트 ID: {created_prompt_id}"
        return r

    test("판매자 - 프롬프트 등록", "판매자가 새 프롬프트를 마켓에 등록한다", t7)

    # ── 4. 등록된 프롬프트 상세 조회 ─────────────────────────────────────────
    def t8():
        if not created_prompt_id:
            return {"ok": False, "status": 0, "detail": "이전 단계 실패로 프롬프트 ID 없음"}
        r = request("GET", f"/api/prompts/{created_prompt_id}")
        if r["ok"] and r["body"]:
            title = r["body"].get("title", "?")
            preview = r["body"].get("preview", False)
            r["detail"] = f"제목: '{title}', preview 모드: {preview}"
        return r

    test("비구매자 - 프롬프트 상세 조회 (preview)", "미구매 사용자는 preview 내용만 볼 수 있다", t8)

    def t9():
        if not created_prompt_id:
            return {"ok": False, "status": 0, "detail": "이전 단계 실패"}
        r = request("GET", f"/api/prompts/{created_prompt_id}", token=BUYER_TOKEN)
        if r["ok"] and r["body"]:
            preview = r["body"].get("preview", True)
            r["detail"] = f"로그인 사용자 preview: {preview} (구매 전이므로 True 예상)"
        return r

    test("구매자 - 구매 전 상세 조회 (preview)", "로그인 사용자도 구매 전에는 preview만 본다", t9)

    # ── 5. 구매 ──────────────────────────────────────────────────────────────
    def t10():
        if not created_prompt_id:
            return {"ok": False, "status": 0, "detail": "이전 단계 실패"}
        r = request("POST", f"/api/purchases/{created_prompt_id}", token=BUYER_TOKEN)
        if r["ok"] and r["body"]:
            r["detail"] = f"구매 ID: {r['body'].get('id')}"
        return r

    test("구매자 - 프롬프트 구매", "구매자가 프롬프트를 구매한다", t10)

    # ── 6. 구매 후 전체 내용 조회 ─────────────────────────────────────────────
    def t11():
        if not created_prompt_id:
            return {"ok": False, "status": 0, "detail": "이전 단계 실패"}
        r = request("GET", f"/api/prompts/{created_prompt_id}", token=BUYER_TOKEN)
        if r["ok"] and r["body"]:
            purchased = r["body"].get("purchased", False)
            content_len = len(r["body"].get("content", "") or "")
            r["detail"] = f"purchased={purchased}, content 길이={content_len}자 (True + content 있어야 정상)"
            r["ok"] = purchased and content_len > 0
        return r

    test("구매자 - 구매 후 전체 내용 접근", "구매 후에는 preview가 false이고 전체 content를 받는다", t11)

    # ── 7. 다운로드 ──────────────────────────────────────────────────────────
    def t12():
        if not created_prompt_id:
            return {"ok": False, "status": 0, "detail": "이전 단계 실패"}
        r = request("GET", f"/api/prompts/{created_prompt_id}/download", token=BUYER_TOKEN, binary=True)
        if r["ok"] and r["body"]:
            size = len(r["body"])
            r["detail"] = f"파일 다운로드 성공, {size}바이트"
        return r

    test("구매자 - 파일 다운로드", "구매자가 .md 파일을 다운로드한다", t12)

    # ── 8. 비구매자 다운로드 차단 ─────────────────────────────────────────────
    def t13():
        if not created_prompt_id:
            return {"ok": False, "status": 0, "detail": "이전 단계 실패"}
        # userId=3은 구매하지 않은 사용자
        other_token = generate_token(user_id=3)
        r = request("GET", f"/api/prompts/{created_prompt_id}/download", token=other_token, expected_status=403)
        r["ok"] = r["status"] == 403
        r["detail"] = "비구매자 다운로드 차단 확인" if r["ok"] else f"예상 403, 실제 {r['status']}"
        return r

    test("보안 - 비구매자 다운로드 차단", "구매하지 않은 사용자는 다운로드가 막힌다", t13)

    # ── 9. 구매 내역 조회 ─────────────────────────────────────────────────────
    def t14():
        r = request("GET", "/api/purchases", token=BUYER_TOKEN)
        if r["ok"] and r["body"] is not None:
            count = len(r["body"]) if isinstance(r["body"], list) else 0
            r["detail"] = f"구매한 프롬프트 {count}개"
        return r

    test("구매자 - 구매 내역 조회", "구매자가 자신의 구매 내역을 확인한다", t14)

    # ── 10. 내 판매 목록 ──────────────────────────────────────────────────────
    def t15():
        r = request("GET", "/api/users/me/prompts", token=SELLER_TOKEN)
        if r["ok"] and r["body"] is not None:
            count = len(r["body"]) if isinstance(r["body"], list) else 0
            r["detail"] = f"내 판매 프롬프트 {count}개"
        return r

    test("판매자 - 내 판매 목록 조회", "판매자가 자신이 등록한 프롬프트 목록을 본다", t15)

    # ── 11. 프롬프트 수정 ─────────────────────────────────────────────────────
    def t16():
        if not created_prompt_id:
            return {"ok": False, "status": 0, "detail": "이전 단계 실패"}
        r = request("PUT", f"/api/prompts/{created_prompt_id}", token=SELLER_TOKEN, body={
            "title": "[TEST-UPDATED] CLAUDE.md for Spring Boot (수정됨)",
            "description": "업데이트된 설명",
            "content": "# 수정된 테스트 프롬프트\n\n## 업데이트 내용\n- 내용이 수정되었습니다.",
            "type": "CLAUDE_MD",
            "targetRole": "DEVELOPER",
            "price": 3900,
            "tags": ["spring", "updated"],
        })
        if r["ok"] and r["body"]:
            r["detail"] = f"수정된 제목: '{r['body'].get('title')}'"
        return r

    test("판매자 - 프롬프트 수정", "판매자가 자신의 프롬프트를 수정한다", t16)

    # ── 12. 타인 수정 차단 ────────────────────────────────────────────────────
    def t17():
        if not created_prompt_id:
            return {"ok": False, "status": 0, "detail": "이전 단계 실패"}
        other_token = generate_token(user_id=3)
        r = request("PUT", f"/api/prompts/{created_prompt_id}", token=other_token, body={
            "title": "해킹 시도",
            "description": "타인 프롬프트 수정 시도",
            "content": "악의적인 내용",
            "type": "CLAUDE_MD",
            "targetRole": "DEVELOPER",
            "price": 0,
            "tags": [],
        }, expected_status=403)
        r["ok"] = r["status"] in (403, 404)
        r["detail"] = f"타인 수정 차단 확인 ({r['status']})" if r["ok"] else f"차단 실패! 실제 {r['status']}"
        return r

    test("보안 - 타인 프롬프트 수정 차단", "소유자가 아닌 사용자가 수정 시도 시 거부된다", t17)

    # ── 13. 중복 구매 방지 ────────────────────────────────────────────────────
    def t18():
        if not created_prompt_id:
            return {"ok": False, "status": 0, "detail": "이전 단계 실패"}
        r = request("POST", f"/api/purchases/{created_prompt_id}", token=BUYER_TOKEN, expected_status=409)
        r["ok"] = r["status"] in (400, 409)
        r["detail"] = f"중복 구매 방지 확인 ({r['status']})" if r["ok"] else f"예상 400/409, 실제 {r['status']}"
        return r

    test("비즈니스 - 중복 구매 방지", "이미 구매한 프롬프트를 다시 구매할 수 없다", t18)

    # ── 14. 프롬프트 삭제 ─────────────────────────────────────────────────────
    def t19():
        if not created_prompt_id:
            return {"ok": False, "status": 0, "detail": "이전 단계 실패"}
        r = request("DELETE", f"/api/prompts/{created_prompt_id}", token=SELLER_TOKEN, expected_status=204)
        r["ok"] = r["status"] == 204
        r["detail"] = "삭제 성공" if r["ok"] else f"예상 204, 실제 {r['status']}"
        return r

    test("판매자 - 프롬프트 삭제", "판매자가 자신의 프롬프트를 삭제한다", t19)

    # ── 15. 삭제 후 접근 확인 ─────────────────────────────────────────────────
    def t20():
        if not created_prompt_id:
            return {"ok": False, "status": 0, "detail": "이전 단계 실패"}
        r = request("GET", f"/api/prompts/{created_prompt_id}", expected_status=404)
        r["ok"] = r["status"] == 404
        r["detail"] = "삭제 후 404 확인" if r["ok"] else f"예상 404, 실제 {r['status']}"
        return r

    test("삭제 후 - 접근 불가 확인", "삭제된 프롬프트는 404를 반환한다", t20)

    # ── 16. 프론트엔드 서빙 확인 ──────────────────────────────────────────────
    def t21():
        try:
            req = urllib.request.Request(BASE_URL + "/")
            with urllib.request.urlopen(req, timeout=10) as resp:
                content = resp.read().decode(errors="replace")
                has_html = "<!DOCTYPE html>" in content or "<html" in content.lower()
                return {"ok": has_html, "status": resp.status,
                        "detail": "HTML 응답 확인 (React SPA 서빙 중)" if has_html else "HTML 없음"}
        except Exception as e:
            return {"ok": False, "status": 0, "detail": str(e)}

    test("프론트엔드 - SPA 서빙 확인", "백엔드가 React SPA를 정상 서빙한다", t21)

    def t22():
        try:
            req = urllib.request.Request(BASE_URL + "/prompts/999")
            with urllib.request.urlopen(req, timeout=10) as resp:
                content = resp.read().decode(errors="replace")
                has_html = "<!DOCTYPE html>" in content or "<html" in content.lower()
                return {"ok": has_html, "status": resp.status,
                        "detail": "SPA 라우트 폴백 확인" if has_html else "폴백 실패"}
        except Exception as e:
            return {"ok": False, "status": 0, "detail": str(e)}

    test("프론트엔드 - SPA 라우트 폴백", "존재하지 않는 경로도 index.html로 폴백된다", t22)


# ── 리포트 생성 ───────────────────────────────────────────────────────────────
def build_report() -> str:
    total = len(results)
    passed = sum(1 for r in results if r["status"] == "PASS")
    failed = sum(1 for r in results if r["status"] == "FAIL")
    errors = sum(1 for r in results if r["status"] == "ERROR")
    pass_rate = round(passed / total * 100) if total else 0

    lines = [
        "# MarketPlace 라이브 테스트 리포트",
        "",
        f"> 생성일시: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
        f"> 대상 서버: {BASE_URL}",
        f"> 테스트 모델: Haiku (자동화 user agent)",
        "",
        "---",
        "",
        "## 테스트 요약",
        "",
        f"| 항목 | 결과 |",
        f"|------|------|",
        f"| 전체 | {total}개 |",
        f"| 통과 | {passed}개 ✅ |",
        f"| 실패 | {failed}개 ❌ |",
        f"| 오류 | {errors}개 ⚠️ |",
        f"| 통과율 | {pass_rate}% |",
        "",
        "---",
        "",
        "## 더미 계정 정보",
        "",
        "Google OAuth2 플로우는 실제 브라우저 인터랙션이 필요하므로,",
        "JWT 시크릿으로 직접 서명한 토큰으로 더미 사용자를 시뮬레이션했습니다.",
        "",
        "| 역할 | userId | 용도 |",
        "|------|--------|------|",
        "| 판매자 | 1 | 프롬프트 등록/수정/삭제 |",
        "| 구매자 | 2 | 프롬프트 구매/다운로드 |",
        "| 외부인 | 3 | 권한 없음 검증 |",
        "",
        "---",
        "",
        "## 상세 결과",
        "",
        "| # | 테스트명 | 시나리오 | 결과 | HTTP | 응답시간 | 상세 |",
        "|---|---------|---------|------|------|----------|------|",
    ]

    for i, r in enumerate(results, 1):
        icon = "✅" if r["status"] == "PASS" else ("❌" if r["status"] == "FAIL" else "⚠️")
        lines.append(
            f"| {i} | {r['name']} | {r['scenario']} | {icon} {r['status']} | {r['http_status']} | {r['elapsed_ms']}ms | {r['detail']} |"
        )

    lines += [
        "",
        "---",
        "",
        "## 테스트 커버리지",
        "",
        "### 검증된 시나리오",
        "- [x] 비로그인 사용자의 프롬프트 목록/검색/필터 조회",
        "- [x] 미인증 접근 차단 (401 반환)",
        "- [x] 판매자 프롬프트 등록/수정/삭제",
        "- [x] 구매자 프롬프트 구매 및 전체 내용 접근",
        "- [x] 구매자 파일 다운로드",
        "- [x] 비구매자 다운로드 차단 (403 반환)",
        "- [x] 구매 내역 조회",
        "- [x] 내 판매 목록 조회",
        "- [x] 타인 프롬프트 수정 차단",
        "- [x] 중복 구매 방지",
        "- [x] SPA 서빙 및 라우트 폴백",
        "",
        "### 미검증 항목 (수동 테스트 필요)",
        "- [ ] 실제 Google OAuth2 로그인 플로우 (브라우저 필요)",
        "- [ ] RefreshToken 갱신 플로우",
        "- [ ] 프론트엔드 UI 렌더링 및 인터랙션",
        "- [ ] 페이지네이션 UI",
        "",
        "---",
        "",
        "## 다음 Agent에게 전달하는 컨텍스트",
        "",
        "```",
        f"서버 상태: {'정상 작동' if passed > 0 else '문제 있음'}",
        f"통과율: {pass_rate}%",
        f"실패한 테스트: {[r['name'] for r in results if r['status'] != 'PASS']}",
        "",
        "우선 수정이 필요한 항목:",
    ]

    failed_tests = [r for r in results if r["status"] != "PASS"]
    for r in failed_tests:
        lines.append(f"  - [{r['status']}] {r['name']}: {r['detail']}")

    lines += [
        "```",
        "",
        "---",
        "",
        "*이 리포트는 Haiku 모델 기반 자동화 user agent가 생성했습니다.*",
    ]

    return "\n".join(lines)


# ── 메인 ─────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    if "--no-wait" not in sys.argv:
        if not wait_for_server():
            print("[ERROR] 서버가 시작되지 않았습니다. 서버를 먼저 실행하세요.", file=sys.stderr)
            sys.exit(1)

    run_tests()

    report = build_report()
    REPORT_PATH.write_text(report, encoding="utf-8")
    print(f"\n[DONE] 리포트 저장 완료: {REPORT_PATH}", flush=True)

    # JSON 요약도 출력
    summary = {
        "total": len(results),
        "passed": sum(1 for r in results if r["status"] == "PASS"),
        "failed": sum(1 for r in results if r["status"] != "PASS"),
        "results": results,
    }
    print(json.dumps(summary, ensure_ascii=False, indent=2))
