package com.example.demo.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/** Keeps meetings created by the initial implementation readable after IN_PROGRESS was renamed LIVE. */
@Converter
public class MeetingStatusConverter implements AttributeConverter<MeetingStatus, String> {
    @Override
    public String convertToDatabaseColumn(MeetingStatus status) {
        return status == null ? null : status.name();
    }

    @Override
    public MeetingStatus convertToEntityAttribute(String value) {
        if (value == null) return null;
        if ("IN_PROGRESS".equals(value)) return MeetingStatus.LIVE;
        return MeetingStatus.valueOf(value);
    }
}
