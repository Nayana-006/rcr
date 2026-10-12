package com.example.demo.service;

import com.example.demo.dto.CreateMeetingRequest;
import com.example.demo.dto.JoinMeetingResponse;
import com.example.demo.dto.MeetingResponse;
import com.example.demo.entity.Course;
import com.example.demo.entity.Meeting;
import com.example.demo.entity.MeetingStatus;
import com.example.demo.entity.MeetingStatusConverter;
import com.example.demo.entity.Role;
import com.example.demo.entity.User;
import com.example.demo.exception.InvalidMeetingStateException;
import com.example.demo.repository.CourseRepository;
import com.example.demo.repository.EnrollmentRepository;
import com.example.demo.repository.MeetingRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.time.Instant;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MeetingServiceTest {
    @Mock private MeetingRepository meetingRepository;
    @Mock private CourseRepository courseRepository;
    @Mock private EnrollmentRepository enrollmentRepository;

    private MeetingService service;
    private User faculty;
    private User otherFaculty;
    private User student;
    private Course course;
    private Meeting meeting;

    @BeforeEach
    void setUp() {
        service = new MeetingService(meetingRepository, courseRepository, enrollmentRepository);
        faculty = user(10L, Role.FACULTY);
        otherFaculty = user(11L, Role.FACULTY);
        student = user(20L, Role.STUDENT);
        course = Course.builder().id(30L).title("Physics").faculty(faculty).build();
        meeting = Meeting.builder()
                .id(40L).course(course).faculty(faculty).title("Motion")
                .roomName("rcr-room-test").scheduledStartTime(Instant.now().plusSeconds(3600))
                .status(MeetingStatus.SCHEDULED).build();
        lenient().when(meetingRepository.save(any(Meeting.class))).thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void enrolledStudentCanAccessAndJoinLiveClass() {
        meeting.setStatus(MeetingStatus.LIVE);
        when(meetingRepository.findById(40L)).thenReturn(Optional.of(meeting));
        when(enrollmentRepository.existsByStudentAndCourse(student, course)).thenReturn(true);

        MeetingResponse details = service.getMeeting(40L, student);
        JoinMeetingResponse join = service.joinMeeting(40L, student);

        assertEquals(MeetingStatus.LIVE, details.getStatus());
        assertEquals("rcr-room-test", join.getRoomName());
    }

    @Test
    void studentWithoutEnrollmentCannotReadOrJoinMeeting() {
        when(meetingRepository.findById(40L)).thenReturn(Optional.of(meeting));
        when(enrollmentRepository.existsByStudentAndCourse(student, course)).thenReturn(false);

        assertThrows(AccessDeniedException.class, () -> service.getMeeting(40L, student));
        assertThrows(AccessDeniedException.class, () -> service.joinMeeting(40L, student));
    }

    @Test
    void facultyCanScheduleAndManageOwnCourseMeeting() {
        when(courseRepository.findById(30L)).thenReturn(Optional.of(course));
        CreateMeetingRequest request = new CreateMeetingRequest();
        request.setCourseId(30L);
        request.setTitle("  Lab  ");
        request.setScheduledStartTime(Instant.now().plusSeconds(3600));

        MeetingResponse created = service.createMeeting(request, faculty);
        assertEquals("Lab", created.getTitle());
        assertEquals(MeetingStatus.SCHEDULED, created.getStatus());

        when(meetingRepository.findByIdForUpdate(40L)).thenReturn(Optional.of(meeting));
        MeetingResponse started = service.updateMeetingStatus(40L, MeetingStatus.LIVE, faculty);
        assertEquals(MeetingStatus.LIVE, started.getStatus());
    }

    @Test
    void facultyCannotCreateOrManageAnotherFacultysMeeting() {
        when(courseRepository.findById(30L)).thenReturn(Optional.of(course));
        CreateMeetingRequest request = new CreateMeetingRequest();
        request.setCourseId(30L);
        request.setTitle("Other class");
        request.setScheduledStartTime(Instant.now().plusSeconds(3600));

        assertThrows(AccessDeniedException.class, () -> service.createMeeting(request, otherFaculty));
        when(meetingRepository.findByIdForUpdate(40L)).thenReturn(Optional.of(meeting));
        assertThrows(AccessDeniedException.class,
                () -> service.updateMeetingStatus(40L, MeetingStatus.CANCELLED, otherFaculty));
    }

    @Test
    void administratorRetainsMeetingManagementAccess() {
        User admin = user(1L, Role.ADMIN);
        when(courseRepository.findById(30L)).thenReturn(Optional.of(course));
        CreateMeetingRequest request = new CreateMeetingRequest();
        request.setCourseId(30L);
        request.setTitle("Admin scheduled class");
        request.setScheduledStartTime(Instant.now().plusSeconds(3600));
        assertEquals(MeetingStatus.SCHEDULED, service.createMeeting(request, admin).getStatus());

        when(meetingRepository.findByIdForUpdate(40L)).thenReturn(Optional.of(meeting));
        assertEquals(MeetingStatus.CANCELLED,
                service.updateMeetingStatus(40L, MeetingStatus.CANCELLED, admin).getStatus());
    }

    @Test
    void cancelledAndCompletedMeetingsCannotBeJoined() {
        when(meetingRepository.findById(40L)).thenReturn(Optional.of(meeting));
        when(enrollmentRepository.existsByStudentAndCourse(student, course)).thenReturn(true);

        for (MeetingStatus terminal : new MeetingStatus[]{MeetingStatus.CANCELLED, MeetingStatus.COMPLETED}) {
            meeting.setStatus(terminal);
            assertThrows(InvalidMeetingStateException.class, () -> service.joinMeeting(40L, student));
        }
    }

    @Test
    void startAndEndRecordTimesAndRepeatedRequestsAreIdempotent() {
        when(meetingRepository.findByIdForUpdate(40L)).thenReturn(Optional.of(meeting));

        MeetingResponse started = service.updateMeetingStatus(40L, MeetingStatus.LIVE, faculty);
        Instant startTime = started.getActualStartTime();
        assertNotNull(startTime);
        assertNull(started.getActualEndTime());

        MeetingResponse repeatedStart = service.updateMeetingStatus(40L, MeetingStatus.LIVE, faculty);
        assertEquals(startTime, repeatedStart.getActualStartTime());
        assertEquals(1L, mockingDetails(meetingRepository).getInvocations().stream()
                .filter(invocation -> invocation.getMethod().getName().equals("save")).count());

        MeetingResponse ended = service.updateMeetingStatus(40L, MeetingStatus.COMPLETED, faculty);
        Instant endTime = ended.getActualEndTime();
        assertNotNull(endTime);
        assertFalse(endTime.isBefore(startTime));
        assertEquals(endTime, service.updateMeetingStatus(40L, MeetingStatus.COMPLETED, faculty).getActualEndTime());
    }

    @Test
    void invalidTransitionsAreRejectedAndLegacyInProgressRowsReadAsLive() {
        when(meetingRepository.findByIdForUpdate(40L)).thenReturn(Optional.of(meeting));

        assertThrows(InvalidMeetingStateException.class,
                () -> service.updateMeetingStatus(40L, MeetingStatus.COMPLETED, faculty));
        meeting.setStatus(MeetingStatus.COMPLETED);
        assertThrows(InvalidMeetingStateException.class,
                () -> service.updateMeetingStatus(40L, MeetingStatus.LIVE, faculty));
        assertEquals(MeetingStatus.LIVE, new MeetingStatusConverter().convertToEntityAttribute("IN_PROGRESS"));
    }

    private static User user(Long id, Role role) {
        return User.builder().id(id).name("User " + id).email("user" + id + "@example.test").role(role).build();
    }
}
