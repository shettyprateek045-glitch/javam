package com.examoptima.exception;

public class ExamOptimaException extends RuntimeException {
    public ExamOptimaException(String message) {
        super(message);
    }

    public ExamOptimaException(String message, Throwable cause) {
        super(message, cause);
    }
}
