package com.example.demo.service;

import com.example.demo.dto.AssignmentRequest;
import com.example.demo.entity.Course;
import com.example.demo.entity.Role;
import com.example.demo.entity.User;
import com.example.demo.repository.AssignmentRepository;
import com.example.demo.repository.CourseRepository;
import com.example.demo.repository.EnrollmentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AssignmentServiceTest {
    @Mock private AssignmentRepository assignmentRepository;
    @Mock private CourseRepository courseRepository;
    @Mock private EnrollmentRepository enrollmentRepository;
    private AssignmentService service;
    private User faculty;
    private User otherFaculty;
    private User student;
    private Course course;

    @BeforeEach
    void setup() {
        service = new AssignmentService(assignmentRepository, courseRepository, enrollmentRepository);
        faculty = user(1L, Role.FACULTY);
        otherFaculty = user(2L, Role.FACULTY);
        student = user(3L, Role.STUDENT);
        course = Course.builder().id(10L).title("Math").faculty(faculty).build();
        lenient().when(assignmentRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void facultyCanCreateForTheirCourseAndCannotCreateForAnotherFaculty() {
        when(courseRepository.findById(10L)).thenReturn(Optional.of(course));
        AssignmentRequest request = request();
        assertEquals(25.0, service.createAssignment(request, faculty).getMaxMarks(), 0.0001);
        assertThrows(AccessDeniedException.class, () -> service.createAssignment(request, otherFaculty));
    }

    @Test
    void studentCanListAssignmentsOnlyForEnrolledCourse() {
        when(courseRepository.findById(10L)).thenReturn(Optional.of(course));
        when(enrollmentRepository.existsByStudentAndCourse(student, course)).thenReturn(true, false);
        when(assignmentRepository.findByCourseId(10L)).thenReturn(List.of(
                com.example.demo.entity.Assignment.builder().id(20L).title("Algebra").course(course).maxMarks(25.0).build()));
        assertEquals(1, service.getAssignmentsByCourse(10L, student).size());
        assertThrows(AccessDeniedException.class, () -> service.getAssignmentsByCourse(10L, student));
    }

    private AssignmentRequest request() {
        AssignmentRequest request = new AssignmentRequest();
        request.setTitle(" Algebra ");
        request.setDescription("Solve");
        request.setDueDate(Instant.now().plusSeconds(3600));
        request.setCourseId(10L);
        request.setMaxMarks(25.0);
        request.setAllowLateSubmission(false);
        return request;
    }

    private static User user(Long id, Role role) {
        return User.builder().id(id).name("User " + id).email("u" + id + "@example.test").role(role).build();
    }
}
