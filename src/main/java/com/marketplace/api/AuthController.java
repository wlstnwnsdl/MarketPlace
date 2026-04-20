package com.marketplace.api;

import com.marketplace.api.dto.AuthTokenResponse;
import com.marketplace.api.dto.RefreshRequest;
import com.marketplace.config.JwtProvider;
import com.marketplace.domain.RefreshToken;
import com.marketplace.repository.RefreshTokenRepository;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtProvider jwtProvider;

    public AuthController(RefreshTokenRepository refreshTokenRepository, JwtProvider jwtProvider) {
        this.refreshTokenRepository = refreshTokenRepository;
        this.jwtProvider = jwtProvider;
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthTokenResponse> refresh(@RequestBody @Valid RefreshRequest request) {
        RefreshToken stored = refreshTokenRepository.findByToken(request.refreshToken())
                .orElse(null);

        if (stored == null || stored.getExpiryDate().isBefore(LocalDateTime.now())) {
            return ResponseEntity.status(401).build();
        }

        Long userId = stored.getUserId();
        String newAccessToken = jwtProvider.generateAccessToken(userId);
        String newRefreshToken = jwtProvider.generateRefreshToken(userId);

        long refreshTokenExpiryMs = 1209600000L;
        stored.rotate(newRefreshToken, LocalDateTime.now().plusSeconds(refreshTokenExpiryMs / 1000));
        refreshTokenRepository.save(stored);

        return ResponseEntity.ok(new AuthTokenResponse(newAccessToken, newRefreshToken));
    }
}
