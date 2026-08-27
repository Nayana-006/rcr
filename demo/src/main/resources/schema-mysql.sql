s-- SQL Server schema for the Spring Boot demo application
-- Run this file against your SQL Server instance to build the database.

IF DB_ID(N'demo') IS NULL
    CREATE DATABASE [demo];
GO

USE [demo];
GO

CREATE TABLE [users] (
  [id] BIGINT IDENTITY(1,1) NOT NULL,
  [name] VARCHAR(120) NOT NULL,
  [email] VARCHAR(180) NOT NULL,
  [password] VARCHAR(255) NOT NULL,
  [role] VARCHAR(30) NOT NULL,
  [active] BIT NOT NULL DEFAULT ((1)),
  [created_at] DATETIME2(6) NOT NULL,
  CONSTRAINT [pk_users] PRIMARY KEY CLUSTERED ([id]),
  CONSTRAINT [uk_users_email] UNIQUE ([email])
);
GO

CREATE TABLE [courses] (
  [id] BIGINT IDENTITY(1,1) NOT NULL,
  [title] VARCHAR(255) NOT NULL,
  [description] VARCHAR(2000) NULL,
  [thumbnail_url] VARCHAR(500) NULL,
  [created_at] DATETIME2(6) NOT NULL,
  [faculty_id] BIGINT NOT NULL,
  CONSTRAINT [pk_courses] PRIMARY KEY CLUSTERED ([id]),
  CONSTRAINT [fk_courses_faculty] FOREIGN KEY ([faculty_id]) REFERENCES [users] ([id])
);
GO

CREATE TABLE [enrollments] (
  [id] BIGINT IDENTITY(1,1) NOT NULL,
  [enrolled_at] DATETIME2(6) NOT NULL,
  [student_id] BIGINT NOT NULL,
  [course_id] BIGINT NOT NULL,
  CONSTRAINT [pk_enrollments] PRIMARY KEY CLUSTERED ([id]),
  CONSTRAINT [uk_student_course] UNIQUE ([student_id],[course_id]),
  CONSTRAINT [fk_enrollments_student] FOREIGN KEY ([student_id]) REFERENCES [users] ([id]),
  CONSTRAINT [fk_enrollments_course] FOREIGN KEY ([course_id]) REFERENCES [courses] ([id])
);
GO

CREATE TABLE [assignments] (
  [id] BIGINT IDENTITY(1,1) NOT NULL,
  [title] VARCHAR(255) NOT NULL,
  [description] VARCHAR(2000) NULL,
  [due_date] DATETIME2(6) NULL,
  [created_at] DATETIME2(6) NOT NULL,
  [course_id] BIGINT NOT NULL,
  CONSTRAINT [pk_assignments] PRIMARY KEY CLUSTERED ([id]),
  CONSTRAINT [fk_assignments_course] FOREIGN KEY ([course_id]) REFERENCES [courses] ([id])
);
GO

CREATE TABLE [course_progress] (
  [id] BIGINT IDENTITY(1,1) NOT NULL,
  [progress_percent] INT NOT NULL,
  [last_accessed] DATETIME2(6) NOT NULL,
  [student_id] BIGINT NOT NULL,
  [course_id] BIGINT NOT NULL,
  CONSTRAINT [pk_course_progress] PRIMARY KEY CLUSTERED ([id]),
  CONSTRAINT [uk_course_progress_student_course] UNIQUE ([student_id],[course_id]),
  CONSTRAINT [fk_course_progress_student] FOREIGN KEY ([student_id]) REFERENCES [users] ([id]),
  CONSTRAINT [fk_course_progress_course] FOREIGN KEY ([course_id]) REFERENCES [courses] ([id])
);
GO

CREATE TABLE [submissions] (
  [id] BIGINT IDENTITY(1,1) NOT NULL,
  [submitted_at] DATETIME2(6) NOT NULL,
  [status] VARCHAR(30) NOT NULL,
  [grade] FLOAT NULL,
  [feedback] VARCHAR(2000) NULL,
  [assignment_id] BIGINT NOT NULL,
  [student_id] BIGINT NOT NULL,
  CONSTRAINT [pk_submissions] PRIMARY KEY CLUSTERED ([id]),
  CONSTRAINT [uk_assignment_student] UNIQUE ([assignment_id],[student_id]),
  CONSTRAINT [fk_submissions_assignment] FOREIGN KEY ([assignment_id]) REFERENCES [assignments] ([id]),
  CONSTRAINT [fk_submissions_student] FOREIGN KEY ([student_id]) REFERENCES [users] ([id])
);
GO

CREATE TABLE [notifications] (
  [id] BIGINT IDENTITY(1,1) NOT NULL,
  [title] VARCHAR(255) NULL,
  [message] VARCHAR(2000) NULL,
  [type] VARCHAR(50) NULL,
  [read_status] BIT NOT NULL DEFAULT ((0)),
  [created_at] DATETIME2(6) NOT NULL,
  [user_id] BIGINT NOT NULL,
  CONSTRAINT [pk_notifications] PRIMARY KEY CLUSTERED ([id]),
  CONSTRAINT [fk_notifications_user] FOREIGN KEY ([user_id]) REFERENCES [users] ([id])
);
GO

CREATE TABLE [learning_links] (
  [id] BIGINT IDENTITY(1,1) NOT NULL,
  [label] VARCHAR(255) NOT NULL,
  [type] VARCHAR(50) NOT NULL,
  [url] VARCHAR(2000) NOT NULL,
  [course_id] BIGINT NOT NULL,
  [created_at] DATETIME2(6) NOT NULL,
  CONSTRAINT [pk_learning_links] PRIMARY KEY CLUSTERED ([id]),
  CONSTRAINT [fk_learning_links_course] FOREIGN KEY ([course_id]) REFERENCES [courses] ([id])
);
GO

CREATE TABLE [doubts] (
  [id] BIGINT IDENTITY(1,1) NOT NULL,
  [title] VARCHAR(255) NOT NULL,
  [message] VARCHAR(2000) NULL,
  [status] VARCHAR(30) NOT NULL,
  [created_at] DATETIME2(6) NOT NULL,
  [student_id] BIGINT NOT NULL,
  [faculty_id] BIGINT NULL,
  [course_id] BIGINT NOT NULL,
  CONSTRAINT [pk_doubts] PRIMARY KEY CLUSTERED ([id]),
  CONSTRAINT [fk_doubts_student] FOREIGN KEY ([student_id]) REFERENCES [users] ([id]),
  CONSTRAINT [fk_doubts_faculty] FOREIGN KEY ([faculty_id]) REFERENCES [users] ([id]),
  CONSTRAINT [fk_doubts_course] FOREIGN KEY ([course_id]) REFERENCES [courses] ([id])
);
GO

CREATE TABLE [attendance] (
  [id] BIGINT IDENTITY(1,1) NOT NULL,
  [date] DATE NOT NULL,
  [present] BIT NOT NULL,
  [created_at] DATETIME2(6) NOT NULL,
  [student_id] BIGINT NOT NULL,
  [course_id] BIGINT NOT NULL,
  [faculty_id] BIGINT NOT NULL,
  CONSTRAINT [pk_attendance] PRIMARY KEY CLUSTERED ([id]),
  CONSTRAINT [uk_attendance_student_course_date] UNIQUE ([student_id],[course_id],[date]),
  CONSTRAINT [fk_attendance_student] FOREIGN KEY ([student_id]) REFERENCES [users] ([id]),
  CONSTRAINT [fk_attendance_course] FOREIGN KEY ([course_id]) REFERENCES [courses] ([id]),
  CONSTRAINT [fk_attendance_faculty] FOREIGN KEY ([faculty_id]) REFERENCES [users] ([id])
);
GO