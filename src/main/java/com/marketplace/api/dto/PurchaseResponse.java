package com.marketplace.api.dto;

import java.time.LocalDateTime;

public record PurchaseResponse(Long purchaseId, Long promptId, LocalDateTime purchasedAt) {}
