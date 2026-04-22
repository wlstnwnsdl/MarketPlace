"""
JWT 토큰 생성 유틸리티 (외부 의존성 없음)
테스트용 더미 사용자 JWT 액세스 토큰을 생성한다.

Usage: python scripts/gen_test_token.py [userId]
"""
import base64
import hashlib
import hmac
import json
import sys
import time

SECRET = "test-secret-key-for-junit-minimum-32chars"
DEFAULT_USER_ID = 1
EXPIRY_SECONDS = 3600  # 1시간


def b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


def generate_token(user_id: int = DEFAULT_USER_ID) -> str:
    header = {"alg": "HS256", "typ": "JWT"}
    now = int(time.time())
    payload = {
        "sub": str(user_id),
        "type": "access",
        "iat": now,
        "exp": now + EXPIRY_SECONDS,
    }

    header_b64 = b64url_encode(json.dumps(header, separators=(",", ":")).encode())
    payload_b64 = b64url_encode(json.dumps(payload, separators=(",", ":")).encode())
    signing_input = f"{header_b64}.{payload_b64}".encode()

    sig = hmac.new(SECRET.encode(), signing_input, hashlib.sha256).digest()
    sig_b64 = b64url_encode(sig)

    return f"{header_b64}.{payload_b64}.{sig_b64}"


if __name__ == "__main__":
    uid = int(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_USER_ID
    token = generate_token(uid)
    print(token)
