import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, FileText, TrendingUp, Activity, Award, MessageCircle, Settings } from 'lucide-react';
import { AuthService } from '../../services/authService';
import { ExamService } from '../../services/examService';
import { AnalyticsService } from '../../services/analyticsService';
import { ExamResult } from '../../types';

export const AdminDashboard = () => {
    const navigate = useNavigate();

    // ⭐️ 실제 데이터 state
    const [stats, setStats] = useState({
        totalStudents: 0,
        totalQuestions: 0,
        avgPassRate: 0,
        weeklyExams: 0,
        pendingUsers: 0,
        pendingCourses: 0 // ⭐️ Added
    });
    // Activity needs user name, so we extend the type or map it during render
    const [recentActivities, setRecentActivities] = useState<(ExamResult & { userName: string })[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAllData = async () => {
            try {
                // 1. 사용자 데이터 & 매핑 준비
                const users = await AuthService.getAllUsers();
                const students = users.filter(u => u.role === 'student');
                const pendingUsers = users.filter(u => !u.approved).length;
                const pendingCourses = users.filter(u => u.approved && u.pendingCourses && u.pendingCourses.length > 0).length; // ⭐️ Count users with pending courses

                const userMap = new Map<string, string>();
                users.forEach(u => userMap.set(u.id, u.name));

                // 2. 시험 및 문제 데이터
                const exams = await ExamService.getExamList();
                const totalQuestions = exams.reduce((sum, exam) => {
                    const questionCount = Array.isArray(exam.questions) ? exam.questions.length : 0;
                    return sum + questionCount;
                }, 0);

                // 3. 시험 결과 데이터 (Using AnalyticsService)
                const allResults = await AnalyticsService.getGlobalExamHistory();

                // 이번 주 시험 수 계산
                const oneWeekAgo = new Date();
                oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
                const weeklyExams = allResults.filter(r => new Date(r.date) > oneWeekAgo).length;

                // 평균 합격률 계산
                const passedCount = allResults.filter(r => r.passed).length;
                const avgPassRate = allResults.length > 0
                    ? Math.round((passedCount / allResults.length) * 100)
                    : 0;

                // 최근 활동 (최근 5개) + User Name Mapping
                const recentActivitiesWithNames = allResults
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .slice(0, 5)
                    .map(r => ({
                        ...r,
                        userName: userMap.get(r.userId) || r.userId // Fallback to ID if name not found
                    }));

                setStats({
                    totalStudents: students.length,
                    totalQuestions,
                    avgPassRate,
                    weeklyExams,
                    pendingUsers,
                    pendingCourses
                });
                setRecentActivities(recentActivitiesWithNames);
                setLoading(false);
            } catch (error) {
                console.error('Failed to fetch admin stats:', error);
                setLoading(false);
            }
        };

        fetchAllData();
    }, []);

    return (
        <div>
            {/* Welcome Section */}
            {/* Welcome Section with Reset Button */}
            <section style={{
                marginBottom: '2rem',
                padding: '2rem',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '1rem',
                color: 'white',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div>
                    <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                        환영합니다, 관리자님 👋
                    </h2>
                    <p style={{ fontSize: '1rem', opacity: 0.9 }}>
                        오늘도 WOW3D CBT 교육센터를 성장시켜주셔서 감사합니다.
                    </p>
                </div>


            </section>

            {/* Statistics Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '1.5rem',
                marginBottom: '3rem'
            }}>
                <StatCard
                    icon={<Users size={28} />}
                    label="전체 수강생"
                    value={loading ? '...' : `${stats.totalStudents}명`}
                    trend={
                        (stats.pendingUsers > 0 || stats.pendingCourses > 0) ? (
                            <span>
                                {stats.pendingUsers > 0 && `가입 대기 ${stats.pendingUsers}명`}
                                {stats.pendingUsers > 0 && stats.pendingCourses > 0 && ', '}
                                {stats.pendingCourses > 0 && `과정 대기 ${stats.pendingCourses}명`}
                            </span>
                        ) : '모두 승인됨'
                    }
                    color="#3b82f6"
                    bgColor="rgba(59, 130, 246, 0.1)"
                />
                <StatCard
                    icon={<FileText size={28} />}
                    label="누적 문제 수"
                    value={loading ? '...' : `${stats.totalQuestions.toLocaleString()}개`}
                    trend={stats.totalQuestions > 0 ? '운영 중' : '문제 등록 필요'}
                    color="#10b981"
                    bgColor="rgba(16, 185, 129, 0.1)"
                />
                <StatCard
                    icon={<Award size={28} />}
                    label="평균 합격률"
                    value={loading ? '...' : `${stats.avgPassRate}%`}
                    trend={stats.avgPassRate >= 60 ? '양호' : '관리 필요'}
                    color="#f59e0b"
                    bgColor="rgba(245, 158, 11, 0.1)"
                />
                <StatCard
                    icon={<Activity size={28} />}
                    label="이번 주 시험"
                    value={loading ? '...' : `${stats.weeklyExams}회`}
                    trend={stats.weeklyExams > 0 ? '활발' : '낮음'}
                    color="#8b5cf6"
                    bgColor="rgba(139, 92, 246, 0.1)"
                />
            </div>

            {/* Quick Actions */}
            <section>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem', color: '#1e293b' }}>
                    빠른 작업
                </h3>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: '1.5rem'
                }}>
                    <ActionCard
                        title="새 문제 등록"
                        desc="문제은행에 새로운 시험 문제를 추가합니다"
                        icon={<FileText size={28} />}
                        color="#6366f1"
                        onClick={() => navigate('/admin/questions')}
                    />
                    <ActionCard
                        title="수강생 승인"
                        desc={
                            stats.pendingUsers > 0 || stats.pendingCourses > 0
                                ? `가입 대기 ${stats.pendingUsers}명, 과정 대기 ${stats.pendingCourses}명`
                                : '현재 대기 중인 요청이 없습니다'
                        }
                        icon={<Users size={28} />}
                        color="#0ea5e9"
                        onClick={() => navigate('/admin/users')}
                    />
                    <ActionCard
                        title="학습 통계 보기"
                        desc="전체 학습 데이터를 분석합니다"
                        icon={<TrendingUp size={28} />}
                        color="#10b981"
                        onClick={() => navigate('/admin/analytics')}
                    />
                    <ActionCard
                        title="1:1 문의 관리"
                        desc="수강생들의 문의에 답변합니다"
                        icon={<MessageCircle size={28} />}
                        color="#ec4899"
                        onClick={() => navigate('/admin/support')}
                    />
                    <ActionCard
                        title="시스템 설정"
                        desc="회원가입 정책, 데이터 백업 및 복원"
                        icon={<Settings size={28} />}
                        color="#64748b"
                        onClick={() => navigate('/admin/settings')}
                    />
                </div>
            </section>

            {/* Recent Activity */}
            <section style={{ marginTop: '3rem' }}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1.5rem', color: '#1e293b' }}>
                    최근 활동
                </h3>
                <div style={{
                    background: 'white',
                    borderRadius: '1rem',
                    padding: '1.5rem',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                            로딩 중...
                        </div>
                    ) : recentActivities.length > 0 ? (
                        recentActivities.map((activity, index) => {
                            const timeAgo = getTimeAgo(activity.date);
                            return (
                                <ActivityItem
                                    key={activity.id}
                                    time={timeAgo}
                                    user={activity.userName} // ⭐️ Use mapped userName
                                    action={activity.examTitle}
                                    score={`${activity.score}점`}
                                    isLast={index === recentActivities.length - 1}
                                />
                            );
                        })
                    ) : (
                        <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                            아직 시험 기록이 없습니다.
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
};

// ⭐️ 시간 계산 헬퍼 함수
const getTimeAgo = (dateString: string): string => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return '방금 전';
    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    if (diffDays < 7) return `${diffDays}일 전`;
    return date.toLocaleDateString();
};

const StatCard = ({ icon, label, value, trend, color, bgColor }: any) => (
    <motion.div
        whileHover={{ y: -5 }}
        style={{
            padding: '1.5rem',
            background: 'white',
            borderRadius: '1rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            border: '1px solid #f1f5f9',
            position: 'relative',
            overflow: 'hidden'
        }}
    >
        {/* Background Decoration */}
        <div style={{
            position: 'absolute',
            top: '-20px',
            right: '-20px',
            width: '100px',
            height: '100px',
            background: bgColor,
            borderRadius: '50%',
            opacity: 0.5
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{
                display: 'inline-flex',
                padding: '0.75rem',
                borderRadius: '0.75rem',
                background: bgColor,
                color: color,
                marginBottom: '1rem'
            }}>
                {icon}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.5rem' }}>
                {label}
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.5rem' }}>
                {value}
            </div>
            <div style={{ fontSize: '0.875rem', color: color, fontWeight: 600 }}>
                {trend}
            </div>
        </div>
    </motion.div>
);

const ActionCard = ({ title, desc, icon, color, onClick }: any) => (
    <motion.button
        whileHover={{ y: -5, boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)' }}
        onClick={onClick}
        style={{
            padding: '1.5rem',
            background: 'white',
            borderRadius: '1rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
            border: '1px solid #f1f5f9',
            cursor: 'pointer',
            textAlign: 'left',
            display: 'flex',
            alignItems: 'start',
            gap: '1rem',
            transition: 'all 0.3s'
        }}
    >
        <div style={{
            padding: '0.75rem',
            borderRadius: '0.75rem',
            background: `${color}15`,
            color: color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            {icon}
        </div>
        <div style={{ flex: 1 }}>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.5rem' }}>
                {title}
            </h4>
            <p style={{ fontSize: '0.875rem', color: '#64748b', lineHeight: 1.5 }}>
                {desc}
            </p>
        </div>
    </motion.button>
);

const ActivityItem = ({ time, user, action, score, isLast = false }: any) => (
    <div style={{
        padding: '1rem 0',
        borderBottom: isLast ? 'none' : '1px solid #f1f5f9',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
    }}>
        <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.25rem' }}>
                {time}
            </div>
            <div style={{ fontSize: '0.95rem', color: '#1e293b' }}>
                <strong>{user}</strong>님이 {action}
            </div>
        </div>
        {score && (
            <div style={{
                padding: '0.5rem 1rem',
                background: '#f0fdf4',
                color: '#16a34a',
                borderRadius: '2rem',
                fontSize: '0.875rem',
                fontWeight: 600
            }}>
                {score}
            </div>
        )}
    </div>
);
