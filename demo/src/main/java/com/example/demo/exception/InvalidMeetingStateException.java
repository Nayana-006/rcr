package com.example.demo.exception;

public class InvalidMeetingStateException extends RuntimeException {
    public InvalidMeetingStateException(String message) {
        super(message);
    }
}
