package com.marketplace.service;

import com.marketplace.api.exception.PromptNotFoundException;
import com.marketplace.api.exception.UnauthorizedException;
import com.marketplace.domain.Prompt;
import com.marketplace.domain.enums.PromptType;
import com.marketplace.domain.enums.TargetRole;
import com.marketplace.repository.PromptRepository;
import com.marketplace.repository.PurchaseRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class PromptService {

    private static final int MAX_CONTENT_BYTES = 51200;
    private static final int PREVIEW_LENGTH = 500;

    private final PromptRepository promptRepository;
    private final PurchaseRepository purchaseRepository;

    public PromptService(PromptRepository promptRepository, PurchaseRepository purchaseRepository) {
        this.promptRepository = promptRepository;
        this.purchaseRepository = purchaseRepository;
    }

    @Transactional(readOnly = true)
    public Page<Prompt> findPrompts(PromptType type, TargetRole targetRole, String keyword, int page, int size) {
        return promptRepository.findWithFilters(type, targetRole, keyword, PageRequest.of(page, size));
    }

    @Transactional(readOnly = true)
    public PromptDetail findPromptDetail(Long promptId, Long buyerId) {
        Prompt prompt = promptRepository.findById(promptId)
                .orElseThrow(() -> new PromptNotFoundException(promptId));

        boolean purchased = buyerId != null && purchaseRepository.existsByBuyerIdAndPromptId(buyerId, promptId);

        if (!purchased) {
            // content를 노출하지 않기 위해 previewContent만 담긴 뷰 객체 반환
            return new PromptDetail(new PromptWithoutContent(prompt), false);
        }

        return new PromptDetail(prompt, true);
    }

    public Prompt createPrompt(Long sellerId, String title, String description, String content,
                               PromptType type, TargetRole targetRole, int price, List<String> tags) {
        if (content != null && content.getBytes().length > MAX_CONTENT_BYTES) {
            throw new IllegalArgumentException("Content exceeds 50KB limit");
        }
        if (price < 0) {
            throw new IllegalArgumentException("Price cannot be negative");
        }

        String previewContent = content != null
                ? content.substring(0, Math.min(PREVIEW_LENGTH, content.length()))
                : null;

        Prompt prompt = Prompt.builder()
                .sellerId(sellerId)
                .title(title)
                .description(description)
                .content(content)
                .previewContent(previewContent)
                .type(type)
                .targetRole(targetRole)
                .price(price)
                .tags(tags)
                .build();

        return promptRepository.save(prompt);
    }

    public Prompt updatePrompt(Long promptId, Long sellerId, String title, String description,
                               String content, TargetRole targetRole, int price, List<String> tags) {
        Prompt prompt = promptRepository.findById(promptId)
                .orElseThrow(() -> new PromptNotFoundException(promptId));

        if (!prompt.getSellerId().equals(sellerId)) {
            throw new UnauthorizedException("Not authorized to update this prompt");
        }

        String previewContent = content != null
                ? content.substring(0, Math.min(PREVIEW_LENGTH, content.length()))
                : null;

        prompt.update(title, description, content, previewContent, prompt.getType(), targetRole, price, tags);
        return prompt;
    }

    public void deletePrompt(Long promptId, Long sellerId) {
        Prompt prompt = promptRepository.findById(promptId)
                .orElseThrow(() -> new PromptNotFoundException(promptId));

        if (!prompt.getSellerId().equals(sellerId)) {
            throw new UnauthorizedException("Not authorized to delete this prompt");
        }

        promptRepository.delete(prompt);
    }

    @Transactional(readOnly = true)
    public String getContentForDownload(Long promptId, Long buyerId) {
        Prompt prompt = promptRepository.findById(promptId)
                .orElseThrow(() -> new PromptNotFoundException(promptId));

        if (!purchaseRepository.existsByBuyerIdAndPromptId(buyerId, promptId)) {
            throw new UnauthorizedException("Purchase required to download this prompt");
        }

        return prompt.getContent();
    }

    public record PromptDetail(Object prompt, boolean purchased) {
        public PromptDetail(Prompt prompt, boolean purchased) {
            this((Object) prompt, purchased);
        }

        public PromptDetail(PromptWithoutContent prompt, boolean purchased) {
            this((Object) prompt, purchased);
        }

        public Prompt getPrompt() {
            if (prompt instanceof Prompt p) return p;
            return null;
        }

        public PromptWithoutContent getPromptView() {
            if (prompt instanceof PromptWithoutContent p) return p;
            return null;
        }
    }

    public record PromptWithoutContent(
            Long id,
            Long sellerId,
            String title,
            String description,
            String previewContent,
            com.marketplace.domain.enums.PromptType type,
            com.marketplace.domain.enums.TargetRole targetRole,
            int price,
            int downloadCount,
            java.util.List<String> tags,
            java.time.LocalDateTime createdAt
    ) {
        public PromptWithoutContent(Prompt prompt) {
            this(
                    prompt.getId(),
                    prompt.getSellerId(),
                    prompt.getTitle(),
                    prompt.getDescription(),
                    prompt.getPreviewContent(),
                    prompt.getType(),
                    prompt.getTargetRole(),
                    prompt.getPrice(),
                    prompt.getDownloadCount(),
                    prompt.getTags(),
                    prompt.getCreatedAt()
            );
        }
    }
}
