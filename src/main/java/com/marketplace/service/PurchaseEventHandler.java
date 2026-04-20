package com.marketplace.service;

import com.marketplace.repository.PromptRepository;
import com.marketplace.service.event.PurchaseCompletedEvent;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
public class PurchaseEventHandler {

    private final PromptRepository promptRepository;

    public PurchaseEventHandler(PromptRepository promptRepository) {
        this.promptRepository = promptRepository;
    }

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void handlePurchaseCompleted(PurchaseCompletedEvent event) {
        promptRepository.findById(event.promptId()).ifPresent(prompt -> {
            prompt.incrementDownloadCount();
            promptRepository.save(prompt);
        });
    }
}
