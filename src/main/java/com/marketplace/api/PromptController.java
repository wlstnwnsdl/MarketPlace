package com.marketplace.api;

import com.marketplace.api.dto.*;
import com.marketplace.domain.Prompt;
import com.marketplace.domain.enums.PromptType;
import com.marketplace.domain.enums.TargetRole;
import com.marketplace.service.PromptService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.util.List;

@RestController
@RequestMapping("/api/prompts")
public class PromptController {

    private final PromptService promptService;

    public PromptController(PromptService promptService) {
        this.promptService = promptService;
    }

    @GetMapping
    public ResponseEntity<PageResponse<PromptSummaryResponse>> listPrompts(
            @RequestParam(required = false) PromptType type,
            @RequestParam(required = false) TargetRole targetRole,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Page<Prompt> result = promptService.findPrompts(type, targetRole, keyword, page, size);
        List<PromptSummaryResponse> content = result.getContent().stream()
                .map(PromptSummaryResponse::from)
                .toList();

        PageResponse<PromptSummaryResponse> response = new PageResponse<>(
                content, result.getNumber(), result.getSize(),
                result.getTotalElements(), result.getTotalPages());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<PromptDetailResponse> getPrompt(
            @PathVariable Long id,
            Authentication authentication) {

        Long userId = extractUserId(authentication);
        PromptService.PromptDetail detail = promptService.findPromptDetail(id, userId);
        return ResponseEntity.ok(PromptDetailResponse.from(detail));
    }

    @PostMapping
    public ResponseEntity<PromptSummaryResponse> createPrompt(
            @RequestBody @Valid PromptRequest request,
            Authentication authentication) {

        Long userId = (Long) authentication.getPrincipal();
        Prompt prompt = promptService.createPrompt(
                userId, request.title(), request.description(), request.content(),
                request.type(), request.targetRole(), request.price(), request.tags(),
                request.status());

        return ResponseEntity.ok(PromptSummaryResponse.from(prompt));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PromptSummaryResponse> updatePrompt(
            @PathVariable Long id,
            @RequestBody @Valid PromptRequest request,
            Authentication authentication) {

        Long userId = (Long) authentication.getPrincipal();
        Prompt prompt = promptService.updatePrompt(
                id, userId, request.title(), request.description(), request.content(),
                request.targetRole(), request.price(), request.tags(),
                request.status());

        return ResponseEntity.ok(PromptSummaryResponse.from(prompt));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePrompt(
            @PathVariable Long id,
            Authentication authentication) {

        Long userId = (Long) authentication.getPrincipal();
        promptService.deletePrompt(id, userId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<byte[]> downloadPrompt(
            @PathVariable Long id,
            Authentication authentication) {

        Long userId = (Long) authentication.getPrincipal();
        String content = promptService.getContentForDownload(id, userId);

        String filename = "prompt-" + id + ".md";
        byte[] bytes = content.getBytes(StandardCharsets.UTF_8);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.TEXT_PLAIN)
                .body(bytes);
    }

    private Long extractUserId(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return null;
        }
        Object principal = authentication.getPrincipal();
        if (principal instanceof Long userId) {
            return userId;
        }
        return null;
    }
}
