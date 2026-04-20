package com.marketplace.config;

import org.springframework.security.oauth2.core.user.OAuth2User;

import java.util.Collection;
import java.util.List;
import java.util.Map;

public record UserPrincipal(
        Long userId,
        String email,
        String name,
        Map<String, Object> attributes
) implements OAuth2User {

    @Override
    public Map<String, Object> getAttributes() {
        return attributes;
    }

    @Override
    public Collection<? extends org.springframework.security.core.GrantedAuthority> getAuthorities() {
        return List.of();
    }

    @Override
    public String getName() {
        return email;
    }
}
