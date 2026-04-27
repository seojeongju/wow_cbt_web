-- CBT 독립 운영용 마이그레이션

CREATE TABLE IF NOT EXISTS cbt_exams (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    course_id TEXT,
    subject_id TEXT,
    topic TEXT,
    round TEXT,
    description TEXT,
    time_limit INTEGER DEFAULT 60,
    pass_score INTEGER DEFAULT 60,
    is_active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY(course_id) REFERENCES courses(id) ON DELETE SET NULL,
    FOREIGN KEY(subject_id) REFERENCES subjects(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS cbt_exam_questions (
    id TEXT PRIMARY KEY,
    cbt_exam_id TEXT NOT NULL,
    question_id TEXT NOT NULL,
    order_no INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY(cbt_exam_id) REFERENCES cbt_exams(id) ON DELETE CASCADE,
    FOREIGN KEY(question_id) REFERENCES questions(id) ON DELETE CASCADE,
    UNIQUE(cbt_exam_id, question_id)
);

CREATE TABLE IF NOT EXISTS cbt_attempts (
    id TEXT PRIMARY KEY,
    cbt_exam_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    started_at TEXT NOT NULL,
    end_at TEXT NOT NULL,
    submitted_at TEXT,
    status TEXT NOT NULL CHECK(status IN ('in_progress', 'submitted', 'timeout')),
    answers_json TEXT NOT NULL DEFAULT '{}',
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY(cbt_exam_id) REFERENCES cbt_exams(id) ON DELETE CASCADE,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS cbt_results (
    id TEXT PRIMARY KEY,
    cbt_attempt_id TEXT NOT NULL,
    cbt_exam_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    score INTEGER NOT NULL,
    total_questions INTEGER NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('pass', 'fail')),
    submitted_at TEXT NOT NULL,
    answers_json TEXT NOT NULL DEFAULT '{}',
    FOREIGN KEY(cbt_attempt_id) REFERENCES cbt_attempts(id) ON DELETE CASCADE,
    FOREIGN KEY(cbt_exam_id) REFERENCES cbt_exams(id) ON DELETE CASCADE,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS cbt_admin_logs (
    id TEXT PRIMARY KEY,
    action TEXT NOT NULL,
    cbt_exam_id TEXT,
    admin_user_id TEXT,
    admin_user_name TEXT,
    note TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY(admin_user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_cbt_exams_active ON cbt_exams(is_active);
CREATE INDEX IF NOT EXISTS idx_cbt_attempts_exam ON cbt_attempts(cbt_exam_id);
CREATE INDEX IF NOT EXISTS idx_cbt_attempts_user ON cbt_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_cbt_results_user ON cbt_results(user_id);
CREATE INDEX IF NOT EXISTS idx_cbt_admin_logs_exam ON cbt_admin_logs(cbt_exam_id);
CREATE INDEX IF NOT EXISTS idx_cbt_admin_logs_admin ON cbt_admin_logs(admin_user_id);
