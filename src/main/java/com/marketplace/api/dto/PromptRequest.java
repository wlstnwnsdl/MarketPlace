package com.marketplace.api.dto;

import com.marketplace.domain.enums.PromptStatus;
import com.marketplace.domain.enums.PromptType;
import com.marketplace.domain.enums.TargetRole;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public record PromptRequest(
        @NotBlank @Size(max = 200) String title,
        @Size(max = 2000) String description,
        @NotBlank String content,
        @NotNull PromptType type,
        TargetRole targetRole,
        int price,
        List<String> tags,
        PromptStatus status
) {}
