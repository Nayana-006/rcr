package com.example.demo.service;

import com.example.demo.dto.CreateMeetingRequest;
import com.example.demo.dto.JoinMeetingResponse;
import com.example.demo.dto.MeetingResponse;
import com.example.demo.entity.Course;
import com.example.demo.entity.Meeting;
import com.example.demo.entity.MeetingStatus;
import com.example.demo.entity.Role;
import com.example.demo.entity.User;
import com.example.demo.exception.InvalidMeetingStateException;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.repository.CourseRepository;
import com.example.demo.repository.EnrollmentRepository;
import com.example.demo.repository.MeetingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MeetingService {

    private final MeetingRepository meetingRepository;
    private final CourseRepository courseRepository;
    private final EnrollmentRepository enrollmentRepository;

    @Transactional
    public MeetingResponse createMeeting(CreateMeetingRequest request, User actor) {
        Course course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new ResourceNotFoundException("Course not found"));
        requireFacultyOrAdmin(actor);
        if (actor.getRole() != Role.ADMIN && !course.getFaculty().getId().equals(actor.getId())) {
            throw new AccessDeniedException("You can schedule classes only for courses you teach");
        }

        Meeting meeting = Meeting.builder()
                .course(course)
                .faculty(course.getFaculty())
                .title(request.getTitle().trim())
                .description(request.getDescription())
                .scheduledStartTime(request.getScheduledStartTime())
                .roomName("rcr-room-" + UUID.randomUUID())
                .status(MeetingStatus.SCHEDULED)
                .build();
        return mapToResponse(meetingRepository.save(meeting));
    }

    @Transactional(readOnly = true)
    public List<MeetingResponse> getMeetingsByCourse(Long courseId, User actor) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course not found"));
        requireCourseAccess(course, actor);
        return meetingRepository.findByCourseIdOrderByScheduledStartTimeDesc(courseId)
                .stream().map(this::mapToResponse).toList();
    }

    @Transactional(readOnly = true)
    public MeetingResponse getMeeting(Long meetingId, User actor) {
        Meeting meeting = findMeeting(meetingId);
        requireCourseAccess(meeting.getCourse(), actor);
        return mapToResponse(meeting);
    }

    @Transactional(readOnly = true)
    public JoinMeetingResponse joinMeeting(Long meetingId, User actor) {
        Meeting meeting = findMeeting(meetingId);
        requireCourseAccess(meeting.getCourse(), actor);
        if (meeting.getStatus() != MeetingStatus.LIVE) {
            throw new InvalidMeetingStateException("This class is not live and cannot be joined");
        }
        return JoinMeetingResponse.builder()
                .meetingId(meeting.getId())
                .roomName(meeting.getRoomName())
                .build();
    }

    @Transactional
    public MeetingResponse updateMeetingStatus(Long meetingId, MeetingStatus requestedStatus, User actor) {
        requireFacultyOrAdmin(actor);
        Meeting meeting = meetingRepository.findByIdForUpdate(meetingId)
                .orElseThrow(() -> new ResourceNotFoundException("Meeting not found"));
        requireMeetingManager(meeting, actor);

        MeetingStatus current = meeting.getStatus();
        if (current == requestedStatus) {
            return mapToResponse(meeting); // repeated requests are safe and do not rewrite timestamps
        }

        Instant now = Instant.now();
        if (current == MeetingStatus.SCHEDULED && requestedStatus == MeetingStatus.LIVE) {
            meeting.setStatus(MeetingStatus.LIVE);
            meeting.setActualStartTime(now);
        } else if (current == MeetingStatus.LIVE && requestedStatus == MeetingStatus.COMPLETED) {
            meeting.setStatus(MeetingStatus.COMPLETED);
            meeting.setActualEndTime(now);
        } else if ((current == MeetingStatus.SCHEDULED || current == MeetingStatus.LIVE)
                && requestedStatus == MeetingStatus.CANCELLED) {
            meeting.setStatus(MeetingStatus.CANCELLED);
        } else {
            throw new InvalidMeetingStateException(
                    "Cannot change a meeting from " + current + " to " + requestedStatus);
        }
        return mapToResponse(meetingRepository.save(meeting));
    }

    private Meeting findMeeting(Long meetingId) {
        return meetingRepository.findById(meetingId)
                .orElseThrow(() -> new ResourceNotFoundException("Meeting not found"));
    }

    private void requireCourseAccess(Course course, User actor) {
        if (actor.getRole() == Role.ADMIN) return;
        if (actor.getRole() == Role.FACULTY) {
            if (course.getFaculty().getId().equals(actor.getId())) return;
            throw new AccessDeniedException("You can access meetings only for courses you teach");
        }
        if (actor.getRole() == Role.STUDENT
                && enrollmentRepository.existsByStudentAndCourse(actor, course)) return;
        throw new AccessDeniedException("You must be enrolled in this course to access its meetings");
    }

    private void requireMeetingManager(Meeting meeting, User actor) {
        if (actor.getRole() == Role.ADMIN) return;
        if (actor.getRole() != Role.FACULTY
                || !meeting.getCourse().getFaculty().getId().equals(actor.getId())
                || !meeting.getFaculty().getId().equals(actor.getId())) {
            throw new AccessDeniedException("You can manage only classes for courses you teach");
        }
    }

    private void requireFacultyOrAdmin(User actor) {
        if (actor.getRole() != Role.FACULTY && actor.getRole() != Role.ADMIN) {
            throw new AccessDeniedException("Only faculty or administrators can manage classes");
        }
    }

    private MeetingResponse mapToResponse(Meeting meeting) {
        return MeetingResponse.builder()
                .id(meeting.getId())
                .courseId(meeting.getCourse().getId())
                .courseTitle(meeting.getCourse().getTitle())
                .facultyId(meeting.getFaculty().getId())
                .facultyName(meeting.getFaculty().getName())
                .title(meeting.getTitle())
                .description(meeting.getDescription())
                .scheduledStartTime(meeting.getScheduledStartTime())
                .actualStartTime(meeting.getActualStartTime())
                .actualEndTime(meeting.getActualEndTime())
                .status(meeting.getStatus())
                .build();
    }
}
