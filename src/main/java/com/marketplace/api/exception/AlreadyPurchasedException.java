package com.marketplace.api.exception;

public class AlreadyPurchasedException extends RuntimeException {
    public AlreadyPurchasedException(Long promptId) {
        super("Already purchased: " + promptId);
    }
}
