-- 운영 중인 DB(이미 cbt_admin_logs가 있는 환경)용 추가 마이그레이션
-- 컬럼이 이미 있으면 ALTER TABLE이 실패할 수 있으므로 1회만 실행하세요.

ALTER TABLE cbt_admin_logs ADD COLUMN admin_user_id TEXT;
ALTER TABLE cbt_admin_logs ADD COLUMN admin_user_name TEXT;
CREATE INDEX IF NOT EXISTS idx_cbt_admin_logs_admin ON cbt_admin_logs(admin_user_id);
