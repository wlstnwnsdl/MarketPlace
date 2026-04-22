package com.marketplace.api;

import com.marketplace.api.dto.PromptSummaryResponse;
import com.marketplace.api.dto.PurchaseResponse;
import com.marketplace.api.dto.UserResponse;
import com.marketplace.domain.Prompt;
import com.marketplace.domain.Purchase;
import com.marketplace.domain.User;
import com.marketplace.service.PromptService;
import com.marketplace.service.PurchaseService;
import com.marketplace.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class PurchaseController {

    private final PurchaseService purchaseService;
    private final PromptService promptService;
    private final UserService userService;

    public PurchaseController(PurchaseService purchaseService, PromptService promptService,
                              UserService userService) {
        this.purchaseService = purchaseService;
        this.promptService = promptService;
        this.userService = userService;
    }

    @PostMapping("/purchases/{promptId}")
    public ResponseEntity<PurchaseResponse> purchase(
            @PathVariable Long promptId,
            Authentication authentication) {

        Long userId = (Long) authentication.getPrincipal();
        Purchase purchase = purchaseService.createPurchase(userId, promptId);
        return ResponseEntity.ok(new PurchaseResponse(purchase.getId(), purchase.getPromptId(), purchase.getPurchasedAt()));
    }

    @GetMapping("/purchases")
    public ResponseEntity<List<Long>> myPurchases(Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        return ResponseEntity.ok(purchaseService.getPurchasedPromptIds(userId));
    }

    @GetMapping("/users/me")
    public ResponseEntity<UserResponse> getMe(Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        User user = userService.getById(userId);
        return ResponseEntity.ok(new UserResponse(user.getId(), user.getEmail(), user.getName()));
    }

    @GetMapping("/users/me/prompts")
    public ResponseEntity<List<PromptSummaryResponse>> myPrompts(Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        List<Prompt> prompts = promptService.getMyPrompts(userId);
        List<PromptSummaryResponse> response = prompts.stream()
                .map(PromptSummaryResponse::from)
                .toList();
        return ResponseEntity.ok(response);
    }
}
