package com.marketplace.api.dto;

import com.marketplace.domain.Prompt;
import com.marketplace.domain.enums.PromptStatus;
import com.marketplace.domain.enums.PromptType;
import com.marketplace.domain.enums.TargetRole;
import com.marketplace.service.PromptService.PromptWithoutContent;

import java.time.LocalDateTime;
import java.util.List;

public record PromptSummaryResponse(
        Long id,
        String title,
        String description,
        String previewContent,
        PromptType type,
        TargetRole targetRole,
        int price,
        int downloadCount,
        List<String> tags,
        Long sellerId,
        LocalDateTime createdAt,
        PromptStatus status
) {
    public static PromptSummaryResponse from(Prompt prompt) {
        return new PromptSummaryResponse(
                prompt.getId(),
                prompt.getTitle(),
                prompt.getDescription(),
                prompt.getPreviewContent(),
                prompt.getType(),
                prompt.getTargetRole(),
                prompt.getPrice(),
                prompt.getDownloadCount(),
                prompt.getTags(),
                prompt.getSellerId(),
                prompt.getCreatedAt(),
                prompt.getStatus()
        );
    }

    public static PromptSummaryResponse from(PromptWithoutContent view) {
        return new PromptSummaryResponse(
                view.id(),
                view.title(),
                view.description(),
                view.previewContent(),
                view.type(),
                view.targetRole(),
                view.price(),
                view.downloadCount(),
                view.tags(),
                view.sellerId(),
                view.createdAt(),
                view.status()
        );
    }
}
