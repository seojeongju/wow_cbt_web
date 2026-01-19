-- Migration: Add Advanced Grading Criteria (Category-Based)
-- Date: 2026-01-19
-- Description: Adds support for category-level minimum scores and average score requirements

-- Add new columns to exams table
ALTER TABLE exams ADD COLUMN average_pass_score INTEGER; -- 평균 합격 점수 (null이면 사용 안 함)
ALTER TABLE exams ADD COLUMN use_average_score INTEGER DEFAULT 0; -- 평균 점수 기준 사용 여부 (0: 미사용, 1: 사용)
ALTER TABLE exams ADD COLUMN category_min_scores TEXT; -- JSON: {"category": minScore, ...}
ALTER TABLE exams ADD COLUMN use_category_min_score INTEGER DEFAULT 0; -- 카테고리별 과락 사용 여부 (0: 미사용, 1: 사용)

-- Add new columns to exam_results table for detailed grading feedback
ALTER TABLE exam_results ADD COLUMN category_scores TEXT; -- JSON: {"category": score, ...}
ALTER TABLE exam_results ADD COLUMN average_score REAL; -- 평균 점수
ALTER TABLE exam_results ADD COLUMN fail_reasons TEXT; -- JSON array: ["reason1", "reason2", ...]

-- Note: subject_id column already exists in questions table from earlier migration
