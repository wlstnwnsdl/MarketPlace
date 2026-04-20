package com.marketplace.service;

import com.marketplace.api.exception.AlreadyPurchasedException;
import com.marketplace.api.exception.PromptNotFoundException;
import com.marketplace.domain.Prompt;
import com.marketplace.domain.Purchase;
import com.marketplace.repository.PromptRepository;
import com.marketplace.repository.PurchaseRepository;
import com.marketplace.service.event.PurchaseCompletedEvent;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class PurchaseService {

    private final PurchaseRepository purchaseRepository;
    private final PromptRepository promptRepository;
    private final ApplicationEventPublisher eventPublisher;

    public PurchaseService(PurchaseRepository purchaseRepository,
                           PromptRepository promptRepository,
                           ApplicationEventPublisher eventPublisher) {
        this.purchaseRepository = purchaseRepository;
        this.promptRepository = promptRepository;
        this.eventPublisher = eventPublisher;
    }

    public Purchase createPurchase(Long buyerId, Long promptId) {
        Prompt prompt = promptRepository.findById(promptId)
                .orElseThrow(() -> new PromptNotFoundException(promptId));

        if (prompt.getSellerId().equals(buyerId)) {
            throw new IllegalArgumentException("Cannot purchase your own prompt");
        }

        if (purchaseRepository.existsByBuyerIdAndPromptId(buyerId, promptId)) {
            throw new AlreadyPurchasedException(promptId);
        }

        Purchase purchase = Purchase.builder()
                .buyerId(buyerId)
                .promptId(promptId)
                .build();

        Purchase saved = purchaseRepository.save(purchase);
        eventPublisher.publishEvent(new PurchaseCompletedEvent(promptId, buyerId));
        return saved;
    }

    @Transactional(readOnly = true)
    public List<Long> getPurchasedPromptIds(Long buyerId) {
        return purchaseRepository.findByBuyerIdOrderByPurchasedAtDesc(buyerId)
                .stream()
                .map(Purchase::getPromptId)
                .toList();
    }
}
