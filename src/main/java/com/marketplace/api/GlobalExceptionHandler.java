package com.marketplace.api;

import com.marketplace.api.exception.AlreadyPurchasedException;
import com.marketplace.api.exception.PromptNotFoundException;
import com.marketplace.api.exception.UnauthorizedException;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

    record ErrorResponse(String message, String code) {}

    @ExceptionHandler(PromptNotFoundException.class)
    public ResponseEntity<ErrorResponse> handlePromptNotFound(PromptNotFoundException e) {
        return ResponseEntity.status(404).body(new ErrorResponse(e.getMessage(), "PROMPT_NOT_FOUND"));
    }

    @ExceptionHandler(AlreadyPurchasedException.class)
    public ResponseEntity<ErrorResponse> handleAlreadyPurchased(AlreadyPurchasedException e) {
        return ResponseEntity.status(409).body(new ErrorResponse(e.getMessage(), "ALREADY_PURCHASED"));
    }

    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<ErrorResponse> handleUnauthorized(UnauthorizedException e) {
        return ResponseEntity.status(403).body(new ErrorResponse(e.getMessage(), "UNAUTHORIZED"));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegalArgument(IllegalArgumentException e) {
        return ResponseEntity.status(400).body(new ErrorResponse(e.getMessage(), "BAD_REQUEST"));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException e) {
        String message = e.getBindingResult().getFieldErrors().stream()
                .map(FieldError::getDefaultMessage)
                .collect(Collectors.joining(", "));
        return ResponseEntity.status(400).body(new ErrorResponse(message, "VALIDATION_ERROR"));
    }
}
