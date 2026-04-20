package com.marketplace.config;

import io.jsonwebtoken.JwtException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.*;

class JwtProviderTest {

    private JwtProvider jwtProvider;
    private static final String SECRET = "test-secret-key-that-is-at-least-32-characters-long";

    @BeforeEach
    void setUp() {
        jwtProvider = new JwtProvider(SECRET, 3600000L, 1209600000L);
    }

    @Test
    void generateAccessToken_extractUserId_returnsOriginalUserId() {
        Long userId = 42L;
        String token = jwtProvider.generateAccessToken(userId);
        assertThat(jwtProvider.extractUserId(token)).isEqualTo(userId);
    }

    @Test
    void generateRefreshToken_extractUserId_returnsOriginalUserId() {
        Long userId = 99L;
        String token = jwtProvider.generateRefreshToken(userId);
        assertThat(jwtProvider.extractUserId(token)).isEqualTo(userId);
    }

    @Test
    void isExpired_expiredToken_returnsTrue() {
        // expiry = 1ms → immediately expired
        JwtProvider shortLivedProvider = new JwtProvider(SECRET, 1L, 1L);
        String token = shortLivedProvider.generateAccessToken(1L);
        // small sleep to ensure expiry
        try { Thread.sleep(10); } catch (InterruptedException ignored) {}
        assertThat(shortLivedProvider.isExpired(token)).isTrue();
    }

    @Test
    void isExpired_validToken_returnsFalse() {
        String token = jwtProvider.generateAccessToken(1L);
        assertThat(jwtProvider.isExpired(token)).isFalse();
    }

    @Test
    void extractUserId_wrongSecret_throwsException() {
        JwtProvider otherProvider = new JwtProvider("other-secret-key-that-is-also-32-chars-long!", 3600000L, 1209600000L);
        String token = otherProvider.generateAccessToken(1L);
        assertThatThrownBy(() -> jwtProvider.extractUserId(token))
                .isInstanceOf(JwtException.class);
    }
}
