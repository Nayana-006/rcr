# Remote Classroom for Rural Students (RCR Project)

A full-stack web application for remote learning, built with Spring Boot (Java 21) and React (Vite).

## Features

### For Students
- View and enroll in available courses
- Track course progress and attendance
- Submit assignments and view grades
- Ask doubts and receive replies from faculty
- View notifications

### For Faculty
- Create and manage courses
- Add learning links (YouTube, Google Drive, PDF, etc.)
- Create and grade assignments
- Mark attendance for enrolled students
- View student progress and completion rates
- Reply to student doubts

### For Admin
- Manage student and faculty users
- View system statistics and dashboard
- Monitor course enrollments and activity

## Tech Stack

### Backend
- **Java 21** with Spring Boot 4.1.0
- **Spring Security** with JWT authentication
- **Spring Data JPA** with Hibernate
- **MySQL** database (production) / H2 (development)
- **Lombok** for reduced boilerplate

### Frontend
- **React 19** with Vite
- **React Router** for navigation
- **Axios** for API calls
- **React Hook Form** with Zod validation
- **Lucide React** for icons
- **Recharts** for data visualization

## Prerequisites

- Java 21 or higher
- Node.js 18 or higher
- MySQL 8.0 or higher (for production)

## Installation

### 1. Clone the repository
```bash
git clone https://github.com/Sushanth-16/rcr-project.git
cd rcr-project
```

### 2. Database Setup

The application uses MySQL by default. Create a database named `rcr_project`:

```sql
CREATE DATABASE rcr_project;
```

Update the database credentials in `demo/src/main/resources/application.properties`:
```properties
spring.datasource.username=your_username
spring.datasource.password=your_password
```

### 3. Backend Setup

```bash
cd demo
mvn spring-boot:run
```

The backend will start on `http://localhost:8080`

### 4. Frontend Setup

Open a new terminal:
```bash
cd frontend
npm install
npm run dev
```

The frontend will start on `http://localhost:5173`

## Default Test Credentials

After starting the application, you can register new users or use these test accounts:

| Role    | Email              | Password      |
|---------|--------------------|---------------|
| Admin   | admin@rcr.com      | password123   |
| Faculty | faculty@rcr.com    | password123   |
| Student | student@rcr.com    | password123   |

## API Documentation

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user

### Users (Admin)
- `GET /api/users` - Get all users
- `GET /api/users/role/{role}` - Get users by role
- `PATCH /api/users/{id}/active` - Activate/deactivate user

### Courses
- `GET /api/courses` - Get all courses
- `GET /api/courses/{id}` - Get course by ID
- `POST /api/courses` - Create course (Faculty)
- `PUT /api/courses/{id}` - Update course (Faculty)
- `DELETE /api/courses/{id}` - Delete course (Faculty)
- `POST /api/courses/{id}/links` - Add learning link (Faculty)

### Enrollments
- `POST /api/enrollments` - Enroll student in course
- `GET /api/enrollments/student/{studentId}` - Get student enrollments
- `GET /api/enrollments/course/{courseId}` - Get course enrollments

### Assignments
- `GET /api/assignments/course/{courseId}` - Get course assignments
- `POST /api/assignments` - Create assignment (Faculty)
- `PUT /api/assignments/{id}` - Update assignment (Faculty)
- `DELETE /api/assignments/{id}` - Delete assignment (Faculty)

### Submissions
- `POST /api/submissions` - Submit assignment
- `GET /api/submissions/assignment/{assignmentId}` - Get assignment submissions
- `GET /api/submissions/student/{studentId}` - Get student submissions
- `PUT /api/submissions/{id}/grade` - Grade submission (Faculty)

### Attendance
- `POST /api/attendance` - Mark attendance (Faculty)
- `GET /api/attendance/student/{studentId}` - Get student attendance
- `GET /api/attendance/course/{courseId}` - Get course attendance

### Doubts
- `POST /api/doubts` - Create doubt (Student)
- `PUT /api/doubts/{id}/reply` - Reply to doubt (Faculty)
- `PUT /api/doubts/{id}/resolve` - Resolve doubt (Faculty)
- `GET /api/doubts/student/{studentId}` - Get student doubts
- `GET /api/doubts/faculty/{facultyId}` - Get faculty doubts
- `GET /api/doubts/course/{courseId}` - Get course doubts

### Notifications
- `GET /api/notifications/user/{userId}` - Get user notifications
- `PUT /api/notifications/{id}/read` - Mark notification as read
- `POST /api/notifications` - Create notification

### Dashboard
- `GET /api/dashboard/student/{studentId}` - Student dashboard
- `GET /api/dashboard/faculty/{facultyId}` - Faculty dashboard
- `GET /api/dashboard/admin` - Admin dashboard

## Project Structure

```
rcr-project/
├── demo/                    # Spring Boot backend
│   ├── src/main/java/
│   │   └── com/example/demo/
│   │       ├── controller/  # REST API controllers
│   │       ├── service/     # Business logic
│   │       ├── repository/  # Data access layer
│   │       ├── entity/      # JPA entities
│   │       ├── dto/         # Data transfer objects
│   │       ├── security/    # Security configuration
│   │       └── exception/   # Exception handling
│   └── src/main/resources/
│       └── application.properties
│
└── frontend/                # React frontend
    ├── src/
    │   ├── pages/          # Page components
    │   │   ├── admin/
    │   │   ├── faculty/
    │   │   ├── student/
    │   │   └── public/
    │   ├── components/     # Reusable components
    │   ├── context/        # React context (auth)
    │   ├── services/       # API service layer
    │   └── layouts/        # Page layouts
    └── package.json
```

## License

MIT License