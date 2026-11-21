package com.examoptima.exception;

public class RoomUnavailableException extends ExamOptimaException {
    private final String roomId;

    public RoomUnavailableException(String roomId, String message) {
        super(String.format("Classroom %s unavailable: %s", roomId, message));
        this.roomId = roomId;
    }

    public String getRoomId() {
        return roomId;
    }
}
