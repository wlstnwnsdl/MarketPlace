package com.marketplace.api.dto;

import com.marketplace.domain.Prompt;
import com.marketplace.domain.enums.PromptType;
import com.marketplace.domain.enums.TargetRole;
import com.marketplace.service.PromptService.PromptDetail;
import com.marketplace.service.PromptService.PromptWithoutContent;

import java.time.LocalDateTime;
import java.util.List;

public record PromptDetailResponse(
        Long id,
        String title,
        String description,
        String previewContent,
        String content,
        boolean purchased,
        PromptType type,
        TargetRole targetRole,
        int price,
        int downloadCount,
        List<String> tags,
        Long sellerId,
        LocalDateTime createdAt
) {
    public static PromptDetailResponse from(PromptDetail detail) {
        if (detail.purchased()) {
            Prompt prompt = detail.getPrompt();
            return new PromptDetailResponse(
                    prompt.getId(),
                    prompt.getTitle(),
                    prompt.getDescription(),
                    prompt.getPreviewContent(),
                    prompt.getContent(),
                    true,
                    prompt.getType(),
                    prompt.getTargetRole(),
                    prompt.getPrice(),
                    prompt.getDownloadCount(),
                    prompt.getTags(),
                    prompt.getSellerId(),
                    prompt.getCreatedAt()
            );
        } else {
            PromptWithoutContent view = detail.getPromptView();
            return new PromptDetailResponse(
                    view.id(),
                    view.title(),
                    view.description(),
                    view.previewContent(),
                    null,
                    false,
                    view.type(),
                    view.targetRole(),
                    view.price(),
                    view.downloadCount(),
                    view.tags(),
                    view.sellerId(),
                    view.createdAt()
            );
        }
    }
}
