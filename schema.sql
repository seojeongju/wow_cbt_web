-- ============================================
-- WOW3D CBT Database Schema (Cloudflare D1)
-- ============================================

PRAGMA foreign_keys = OFF;

-- 1. Users Table
DROP TABLE IF EXISTS users;
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL, -- Should be hashed (bcrypt)
    name TEXT NOT NULL,
    phone TEXT,
    role TEXT DEFAULT 'student' CHECK(role IN ('student', 'admin')),
    approved INTEGER DEFAULT 0, -- 0: pending, 1: approved
    last_login_at TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

-- 2. Courses Table
DROP TABLE IF EXISTS courses;
CREATE TABLE courses (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
);

-- 3. Course Enrollments (Many-to-Many: Users <-> Courses)
DROP TABLE IF EXISTS course_enrollments;
CREATE TABLE course_enrollments (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    course_id TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(course_id) REFERENCES courses(id) ON DELETE CASCADE,
    UNIQUE(user_id, course_id)
);

-- 4. Categories Table (Per-Course Categories)
DROP TABLE IF EXISTS categories;
CREATE TABLE categories (
    id TEXT PRIMARY KEY,
    course_id TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY(course_id) REFERENCES courses(id) ON DELETE CASCADE,
    UNIQUE(course_id, name)
);

-- 5. Exams Table
DROP TABLE IF EXISTS exams;
CREATE TABLE exams (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    course_id TEXT NOT NULL,
    description TEXT,
    time_limit INTEGER DEFAULT 60, -- in minutes
    pass_score INTEGER DEFAULT 60,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY(course_id) REFERENCES courses(id) ON DELETE CASCADE
);

-- 6. Questions Table
DROP TABLE IF EXISTS questions;
CREATE TABLE questions (
    id TEXT PRIMARY KEY,
    exam_id TEXT NOT NULL,
    category TEXT, -- Category name (not FK for flexibility)
    text TEXT NOT NULL,
    options TEXT, -- JSON array: ["opt1", "opt2", "opt3", "opt4"] or empty for subjective
    correct_answer TEXT NOT NULL, -- Number (0-3) or string for subjective
    explanation TEXT,
    image_url TEXT, -- Base64 or external URL
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY(exam_id) REFERENCES exams(id) ON DELETE CASCADE
);

-- 7. Exam Results Table
DROP TABLE IF EXISTS exam_results;
CREATE TABLE exam_results (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    exam_id TEXT NOT NULL,
    score INTEGER NOT NULL,
    total_questions INTEGER NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('pass', 'fail')),
    take_duration INTEGER, -- in seconds
    answers TEXT NOT NULL, -- JSON object: {"q1": 0, "q2": "answer", ...}
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY(exam_id) REFERENCES exams(id) ON DELETE CASCADE
);

-- 8. Support Tickets Table
DROP TABLE IF EXISTS support_tickets;
CREATE TABLE support_tickets (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    user_name TEXT NOT NULL,
    user_email TEXT NOT NULL,
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'answered')),
    admin_reply TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 9. System Settings Table
DROP TABLE IF EXISTS system_settings;
CREATE TABLE system_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT DEFAULT (datetime('now'))
);

-- ============================================
-- Initial Data
-- ============================================

-- Default Admin User (password: 1234 - should be hashed in production)
INSERT INTO users (id, email, password, name, phone, role, approved) 
VALUES (
    'admin_default', 
    'admin@wow3d.com', 
    '1234', 
    '관리자',
    '010-0000-0000',
    'admin', 
    1
);

-- Default Course
INSERT INTO courses (id, name)
VALUES ('course_3d_printer', '3D프린터운용기능사');

-- Default Categories for the course
INSERT INTO categories (id, course_id, name)
VALUES 
    ('cat_001', 'course_3d_printer', '3D형상모델링'),
    ('cat_002', 'course_3d_printer', '3D프린팅'),
    ('cat_003', 'course_3d_printer', '3D스캐닝');

-- Default System Settings
INSERT INTO system_settings (key, value)
VALUES 
    ('requireUserApproval', 'true'),
    ('requireCourseApproval', 'true'),
    ('sessionTimeout', '30'),
    ('passingScore', '60');

-- Sample Exam
INSERT INTO exams (id, title, course_id, description, time_limit, pass_score)
VALUES (
    'exam_sample_001', 
    '3D프린터운용기능사 모의고사 1회', 
    'course_3d_printer',
    '2024년도 대비 최신 경향 반영 모의고사입니다.', 
    60, 
    60
);

-- Sample Questions
INSERT INTO questions (id, exam_id, category, text, options, correct_answer, explanation)
VALUES 
(
    'q_sample_001', 
    'exam_sample_001', 
    '3D형상모델링',
    '3D 모델링에서 가장 기본이 되는 형상은?', 
    '["직육면체", "원기둥", "구", "모두"]', 
    '3',
    '기본 3D 형상은 직육면체, 원기둥, 구 등이 모두 해당됩니다.'
),
(
    'q_sample_002', 
    'exam_sample_001', 
    '3D프린팅',
    'FDM 방식의 3D 프린터에서 주로 사용하는 필라멘트 재료는?', 
    '["PLA", "레진", "파우더", "종이"]', 
    '0',
    'FDM 방식은 PLA, ABS 등의 필라멘트를 사용합니다.'
);

-- ============================================
-- Indexes for Performance
-- ============================================

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_course_enrollments_user ON course_enrollments(user_id);
CREATE INDEX idx_course_enrollments_status ON course_enrollments(status);
CREATE INDEX idx_categories_course ON categories(course_id);
CREATE INDEX idx_exams_course ON exams(course_id);
CREATE INDEX idx_questions_exam ON questions(exam_id);
CREATE INDEX idx_exam_results_user ON exam_results(user_id);
CREATE INDEX idx_exam_results_exam ON exam_results(exam_id);
CREATE INDEX idx_support_tickets_status ON support_tickets(status);
