package com.examoptima.exception;

public class InsufficientCapacityException extends ExamOptimaException {
    private final int requiredSeats;
    private final int availableSeats;

    public InsufficientCapacityException(int requiredSeats, int availableSeats) {
        super(String.format("Insufficient classroom capacity: %d registered students exceed %d available seats.",
                requiredSeats, availableSeats));
        this.requiredSeats = requiredSeats;
        this.availableSeats = availableSeats;
    }

    public int getRequiredSeats() {
        return requiredSeats;
    }

    public int getAvailableSeats() {
        return availableSeats;
    }
}
