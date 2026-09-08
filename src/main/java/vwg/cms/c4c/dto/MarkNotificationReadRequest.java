package vwg.cms.c4c.dto;

import jakarta.validation.constraints.NotNull;

public record MarkNotificationReadRequest(@NotNull Boolean read) {
}

