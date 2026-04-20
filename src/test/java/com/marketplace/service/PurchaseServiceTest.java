package com.marketplace.service;

import com.marketplace.api.exception.AlreadyPurchasedException;
import com.marketplace.api.exception.PromptNotFoundException;
import com.marketplace.domain.Prompt;
import com.marketplace.domain.Purchase;
import com.marketplace.domain.enums.PromptType;
import com.marketplace.repository.PromptRepository;
import com.marketplace.repository.PurchaseRepository;
import com.marketplace.service.event.PurchaseCompletedEvent;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class PurchaseServiceTest {

    @Mock
    private PurchaseRepository purchaseRepository;

    @Mock
    private PromptRepository promptRepository;

    @Mock
    private ApplicationEventPublisher eventPublisher;

    @InjectMocks
    private PurchaseService purchaseService;

    private Prompt buildPrompt(Long sellerId) {
        return Prompt.builder()
                .sellerId(sellerId)
                .title("Test Prompt")
                .content("content")
                .type(PromptType.CLAUDE_MD)
                .price(0)
                .build();
    }

    @Test
    void createPurchase_success() {
        Long buyerId = 1L;
        Long promptId = 10L;
        Prompt prompt = buildPrompt(99L);

        given(promptRepository.findById(promptId)).willReturn(Optional.of(prompt));
        given(purchaseRepository.existsByBuyerIdAndPromptId(buyerId, promptId)).willReturn(false);
        given(purchaseRepository.save(any(Purchase.class))).willAnswer(inv -> inv.getArgument(0));

        Purchase result = purchaseService.createPurchase(buyerId, promptId);

        assertThat(result.getBuyerId()).isEqualTo(buyerId);
        assertThat(result.getPromptId()).isEqualTo(promptId);

        ArgumentCaptor<PurchaseCompletedEvent> eventCaptor = ArgumentCaptor.forClass(PurchaseCompletedEvent.class);
        verify(eventPublisher).publishEvent(eventCaptor.capture());
        assertThat(eventCaptor.getValue().promptId()).isEqualTo(promptId);
        assertThat(eventCaptor.getValue().buyerId()).isEqualTo(buyerId);
    }

    @Test
    void createPurchase_duplicatePurchase_throwsAlreadyPurchasedException() {
        Long buyerId = 1L;
        Long promptId = 10L;
        Prompt prompt = buildPrompt(99L);

        given(promptRepository.findById(promptId)).willReturn(Optional.of(prompt));
        given(purchaseRepository.existsByBuyerIdAndPromptId(buyerId, promptId)).willReturn(true);

        assertThatThrownBy(() -> purchaseService.createPurchase(buyerId, promptId))
                .isInstanceOf(AlreadyPurchasedException.class)
                .hasMessageContaining("Already purchased: " + promptId);
    }

    @Test
    void createPurchase_promptNotFound_throwsPromptNotFoundException() {
        Long buyerId = 1L;
        Long promptId = 999L;

        given(promptRepository.findById(promptId)).willReturn(Optional.empty());

        assertThatThrownBy(() -> purchaseService.createPurchase(buyerId, promptId))
                .isInstanceOf(PromptNotFoundException.class)
                .hasMessageContaining("Prompt not found: " + promptId);
    }

    @Test
    void createPurchase_selfPurchase_throwsIllegalArgumentException() {
        Long sellerId = 1L;
        Long promptId = 10L;
        Prompt prompt = buildPrompt(sellerId);

        given(promptRepository.findById(promptId)).willReturn(Optional.of(prompt));

        assertThatThrownBy(() -> purchaseService.createPurchase(sellerId, promptId))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Cannot purchase your own prompt");
    }
}
