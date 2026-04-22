package com.marketplace.service;

import com.marketplace.api.exception.PromptNotFoundException;
import com.marketplace.api.exception.UnauthorizedException;
import com.marketplace.domain.Prompt;
import com.marketplace.domain.enums.PromptStatus;
import com.marketplace.domain.enums.PromptType;
import com.marketplace.domain.enums.TargetRole;
import com.marketplace.repository.PromptRepository;
import com.marketplace.repository.PurchaseRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class PromptService {

    private static final int MAX_CONTENT_BYTES = 51200;
    private static final int PREVIEW_MAX_LINES = 5;
    private static final int PREVIEW_MAX_CHARS = 500;

    private final PromptRepository promptRepository;
    private final PurchaseRepository purchaseRepository;

    public PromptService(PromptRepository promptRepository, PurchaseRepository purchaseRepository) {
        this.promptRepository = promptRepository;
        this.purchaseRepository = purchaseRepository;
    }

    /**
     * content에서 처음 5줄만 추출하고, 500자를 초과하면 500자로 자른다.
     */
    private String buildPreviewContent(String content) {
        if (content == null) return null;
        String[] lines = content.split("\n", -1);
        String preview = Arrays.stream(lines)
                .limit(PREVIEW_MAX_LINES)
                .collect(Collectors.joining("\n"));
        if (preview.length() > PREVIEW_MAX_CHARS) {
            preview = preview.substring(0, PREVIEW_MAX_CHARS);
        }
        return preview;
    }

    @Transactional(readOnly = true)
    public Page<Prompt> findPrompts(PromptType type, TargetRole targetRole, String keyword, int page, int size) {
        return promptRepository.findWithFilters(type, targetRole, PromptStatus.PUBLIC, keyword, PageRequest.of(page, size));
    }

    @Transactional(readOnly = true)
    public PromptDetail findPromptDetail(Long promptId, Long requesterId) {
        Prompt prompt = promptRepository.findById(promptId)
                .orElseThrow(() -> new PromptNotFoundException(promptId));

        // 소유자는 상태와 무관하게 전체 내용 반환
        if (requesterId != null && requesterId.equals(prompt.getSellerId())) {
            return new PromptDetail(prompt, true);
        }

        // PUBLIC이 아닌 경우: 소유자 외 404
        if (prompt.getStatus() != PromptStatus.PUBLIC) {
            throw new PromptNotFoundException(promptId);
        }

        boolean purchased = requesterId != null && purchaseRepository.existsByBuyerIdAndPromptId(requesterId, promptId);

        if (!purchased) {
            return new PromptDetail(new PromptWithoutContent(prompt), false);
        }

        return new PromptDetail(prompt, true);
    }

    public Prompt createPrompt(Long sellerId, String title, String description, String content,
                               PromptType type, TargetRole targetRole, int price, List<String> tags,
                               PromptStatus status) {
        if (content != null && content.getBytes().length > MAX_CONTENT_BYTES) {
            throw new IllegalArgumentException("Content exceeds 50KB limit");
        }
        if (price < 0) {
            throw new IllegalArgumentException("Price cannot be negative");
        }

        String previewContent = buildPreviewContent(content);

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
                .status(status)
                .build();

        return promptRepository.save(prompt);
    }

    public Prompt updatePrompt(Long promptId, Long sellerId, String title, String description,
                               String content, TargetRole targetRole, int price, List<String> tags,
                               PromptStatus status) {
        Prompt prompt = promptRepository.findById(promptId)
                .orElseThrow(() -> new PromptNotFoundException(promptId));

        if (!prompt.getSellerId().equals(sellerId)) {
            throw new UnauthorizedException("Not authorized to update this prompt");
        }

        String previewContent = buildPreviewContent(content);

        prompt.update(title, description, content, previewContent, prompt.getType(), targetRole, price, tags, status);
        return prompt;
    }

    @Transactional(readOnly = true)
    public List<Prompt> getMyPrompts(Long sellerId) {
        return promptRepository.findBySellerIdOrderByCreatedAtDesc(sellerId);
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
    public String getContentForDownload(Long promptId, Long requesterId) {
        Prompt prompt = promptRepository.findById(promptId)
                .orElseThrow(() -> new PromptNotFoundException(promptId));

        boolean isOwner = prompt.getSellerId().equals(requesterId);
        boolean isPurchased = purchaseRepository.existsByBuyerIdAndPromptId(requesterId, promptId);

        if (!isOwner && !isPurchased) {
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
            java.time.LocalDateTime createdAt,
            com.marketplace.domain.enums.PromptStatus status
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
                    prompt.getCreatedAt(),
                    prompt.getStatus()
            );
        }
    }
}
