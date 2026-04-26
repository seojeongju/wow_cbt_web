-- 1. Create Subjects Table (중분류: 과목/모듈)
CREATE TABLE IF NOT EXISTS subjects (
    id TEXT PRIMARY KEY,
    course_id TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY(course_id) REFERENCES courses(id) ON DELETE CASCADE,
    UNIQUE(course_id, name)
);

-- 2. Add subject_id to exams table
-- Note: SQLite ALTER TABLE ADD COLUMN does not strictly support adding FK constraints inline in all versions easily,
-- but D1 usually allows standard SQLite syntax. we will add it as nullable.
ALTER TABLE exams ADD COLUMN subject_id TEXT;

-- 3. Create Indexes
CREATE INDEX IF NOT EXISTS idx_subjects_course ON subjects(course_id);
CREATE INDEX IF NOT EXISTS idx_exams_subject ON exams(subject_id);
