package com.marketplace.api.exception;

public class PromptNotFoundException extends RuntimeException {
    public PromptNotFoundException(Long id) {
        super("Prompt not found: " + id);
    }
}
