package com.marketplace.service.event;

public record PurchaseCompletedEvent(Long promptId, Long buyerId) {}
