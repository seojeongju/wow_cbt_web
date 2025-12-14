import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Play, BookOpen, AlertCircle, MessageCircle, PlusCircle, X,
    ChevronDown, ChevronRight, Trophy, Target, BarChart2
} from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { AuthService } from '../../services/authService';
import { ExamService } from '../../services/examService';
import { CourseService } from '../../services/courseService';
import { User, ExamResult, Course } from '../../types';

export const StudentDashboard = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState<User | null>(null);
    const [stats, setStats] = useState({
        totalExams: 0,
        averageScore: 0,
        maxScore: 0,
        recentResults: [] as ExamResult[],
        passRate: 0
    });

    // Enrollment Modal State
    const [showEnrollModal, setShowEnrollModal] = useState(false);
    const [availableCourses, setAvailableCourses] = useState<Course[]>([]);

    // Course Selector State
    const [showCourseMenu, setShowCourseMenu] = useState(false);
    const courseMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const currentUser = AuthService.getCurrentUser();
        if (currentUser) {
            setUser(currentUser);
            loadStats();
        } else {
            navigate('/login');
        }
    }, [navigate]);

    // Handle outside clicks to close the course menu
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (courseMenuRef.current && !courseMenuRef.current.contains(event.target as Node)) {
                setShowCourseMenu(false);
            }
        };

        if (showCourseMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showCourseMenu]);

    const loadStats = async () => {
        const history = await ExamService.getExamHistory();
        if (history.length > 0) {
            const total = history.length;
            const scores = history.map(h => h.score);
            const avg = Math.round(scores.reduce((a, b) => a + b, 0) / total);
            const max = Math.max(...scores);
            const passed = history.filter(h => h.passed).length;
            const passRate = Math.round((passed / total) * 100);

            // Sort by date descending (newest first)
            const recent = [...history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

            setStats({
                totalExams: total,
                averageScore: avg,
                maxScore: max,
                recentResults: recent,
                passRate
            });
        }
    };

    const handleOpenEnrollModal = async () => {
        if (!user) return;
        const all = await CourseService.getCourses();
        const enrolledNames = (user.courseEnrollments || []).map(e => e.courseName);
        const pendingNames = user.pendingCourses || [];
        const exclude = [...enrolledNames, ...pendingNames];
        setAvailableCourses(all.filter(c => !exclude.includes(c.name)));
        setShowEnrollModal(true);
        setShowCourseMenu(false);
    };

    const handleEnroll = async (courseId: string, courseName: string) => {
        if (!user) return;
        if (!confirm(`'${courseName}' 과정을 신청하시겠습니까?`)) return;

        const result = await CourseService.requestEnrollment(user.id, courseId);
        if (result.success) {
            alert(result.message);
            window.location.reload();
        } else {
            alert(result.message);
        }
    };

    const currentCourseName = user?.pendingCourses?.[0] || '3D프린터운용기능사';

    return (
        <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: "'Pretendard', sans-serif" }}>
            {/* Header */}
            <header style={{ background: 'white', padding: '0.8rem 0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', position: 'sticky', top: 0, zIndex: 50 }}>
                <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                        <div
                            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                            onClick={() => navigate('/')}
                        >
                            <img src="/images/wow_logo.png" alt="WOW3D" style={{ height: '24px' }} />
                            <span style={{ fontWeight: 800, fontSize: '1.25rem', color: '#1e293b' }}>
                                WOW<span style={{ color: '#6366f1' }}>CBT</span>
                            </span>
                        </div>

                        {/* Course Selector Widget */}
                        <div ref={courseMenuRef} style={{ position: 'relative' }}>
                            <button
                                onClick={() => setShowCourseMenu(!showCourseMenu)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                                    padding: '0.5rem 1rem', background: '#f1f5f9', borderRadius: '2rem',
                                    border: 'none', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600, color: '#334155'
                                }}
                            >
                                <BookOpen size={16} />
                                {currentCourseName}
                                <ChevronDown size={14} style={{ opacity: 0.5 }} />
                            </button>

                            <AnimatePresence>
                                {showCourseMenu && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        style={{
                                            position: 'absolute', top: '120%', left: 0, minWidth: '280px',
                                            background: 'white', borderRadius: '1rem', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                                            padding: '1rem', border: '1px solid #e2e8f0', zIndex: 100
                                        }}
                                    >
                                        {/* Active Courses Section */}
                                        <div style={{ marginBottom: '1rem' }}>
                                            <div style={{ padding: '0 0.5rem 0.5rem', fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.05em' }}>수강 중인 과정</div>
                                            {(user?.courseEnrollments || [])
                                                .filter(e => e.status === 'active')
                                                .map((enrollment, idx) => (
                                                    <div
                                                        key={idx}
                                                        style={{
                                                            padding: '0.75rem 1rem',
                                                            background: enrollment.courseName === currentCourseName ? '#eff6ff' : '#f8fafc',
                                                            borderRadius: '0.5rem',
                                                            color: enrollment.courseName === currentCourseName ? '#3b82f6' : '#334155',
                                                            fontWeight: 600,
                                                            fontSize: '0.9rem',
                                                            marginBottom: '0.5rem',
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            alignItems: 'center'
                                                        }}
                                                    >
                                                        <span>{enrollment.courseName}</span>
                                                        {enrollment.courseName === currentCourseName && (
                                                            <span style={{ fontSize: '0.7rem', opacity: 0.7 }}>현재</span>
                                                        )}
                                                    </div>
                                                ))}
                                            {(user?.courseEnrollments || []).filter(e => e.status === 'active').length === 0 && (
                                                <div style={{ padding: '0.75rem', fontSize: '0.85rem', color: '#94a3b8', textAlign: 'center' }}>수강 중인 과정이 없습니다</div>
                                            )}
                                        </div>

                                        {/* Pending Courses Section */}
                                        {(user?.pendingCourses || []).length > 0 && (
                                            <div style={{ marginBottom: '1rem' }}>
                                                <div style={{ padding: '0 0.5rem 0.5rem', fontSize: '0.75rem', fontWeight: 700, color: '#f59e0b', letterSpacing: '0.05em' }}>신청 대기 중</div>
                                                {(user?.pendingCourses || []).map((courseName: string, idx: number) => (
                                                    <div
                                                        key={idx}
                                                        style={{
                                                            padding: '0.75rem 1rem',
                                                            background: '#fffbeb',
                                                            borderRadius: '0.5rem',
                                                            color: '#d97706',
                                                            fontWeight: 600,
                                                            fontSize: '0.9rem',
                                                            marginBottom: '0.5rem',
                                                            display: 'flex',
                                                            justifyContent: 'space-between',
                                                            alignItems: 'center'
                                                        }}
                                                    >
                                                        <span>{courseName}</span>
                                                        <span style={{ fontSize: '0.7rem', opacity: 0.8 }}>승인 대기</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        <div style={{ height: '1px', background: '#e2e8f0', margin: '0.5rem 0' }} />

                                        <button
                                            onClick={handleOpenEnrollModal}
                                            style={{
                                                width: '100%', padding: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem',
                                                background: 'none', border: 'none', cursor: 'pointer', color: '#64748b',
                                                fontSize: '0.9rem', fontWeight: 600, borderRadius: '0.5rem',
                                                justifyContent: 'center'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                                        >
                                            <PlusCircle size={16} /> 새 과정 추가하기
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#334155' }}>
                            {user?.name}님
                        </span>
                        <div style={{ width: '1px', height: '16px', background: '#e2e8f0' }} />
                        <button
                            onClick={() => AuthService.logout()}
                            style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '0.9rem', cursor: 'pointer', fontWeight: 500 }}
                        >
                            로그아웃
                        </button>
                    </div>
                </div>
            </header>

            <main className="container" style={{ marginTop: '2rem', paddingBottom: '4rem' }}>

                {/* Hero Section */}
                <section style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                    borderRadius: '1.5rem', padding: '3rem', color: 'white',
                    marginBottom: '2rem', boxShadow: '0 20px 40px -10px rgba(99, 102, 241, 0.3)',
                    position: 'relative', overflow: 'hidden'
                }}>
                    <div style={{ position: 'relative', zIndex: 10, maxWidth: '600px' }}>
                        <div style={{
                            display: 'inline-block', padding: '0.4rem 1rem', background: 'rgba(255,255,255,0.2)',
                            borderRadius: '2rem', fontSize: '0.9rem', fontWeight: 600, marginBottom: '1rem',
                            backdropFilter: 'blur(5px)'
                        }}>
                            D-Day 기능 준비중
                        </div>
                        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1rem', lineHeight: 1.2 }}>
                            합격까지 얼마 남지 않았어요!<br />
                            <span style={{ opacity: 0.9 }}>지금 바로 실전처럼 연습해보세요.</span>
                        </h1>
                        <p style={{ fontSize: '1.1rem', opacity: 0.8, marginBottom: '2rem' }}>
                            오늘의 목표: 모의고사 1회 응시하고 오답 분석하기
                        </p>
                        <button
                            onClick={() => navigate('/student/exam')}
                            style={{
                                padding: '1rem 2.5rem', background: 'white', color: '#4f46e5',
                                border: 'none', borderRadius: '3rem', fontSize: '1.1rem', fontWeight: 700,
                                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem',
                                boxShadow: '0 10px 20px rgba(0,0,0,0.1)', transition: 'transform 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            <Play fill="currentColor" size={20} /> 실전 모의고사 시작
                        </button>
                    </div>

                    {/* Circular Stats in Hero */}
                    <div style={{ position: 'relative', zIndex: 10, display: 'flex', gap: '2rem' }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{
                                width: '120px', height: '120px', borderRadius: '50%', border: '8px solid rgba(255,255,255,0.2)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 800,
                                marginBottom: '0.5rem', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(5px)'
                            }}>
                                {stats.averageScore}
                            </div>
                            <div style={{ fontSize: '0.9rem', opacity: 0.8, fontWeight: 600 }}>평균 점수</div>
                        </div>
                    </div>

                    {/* Background Decor */}
                    <div style={{
                        position: 'absolute', top: -50, right: -50, width: '300px', height: '300px',
                        background: 'radial-gradient(circle, rgba(255,255,255,0.2), transparent)', borderRadius: '50%'
                    }} />
                </section>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '2rem', alignItems: 'start' }}>

                    {/* Left Column (Main Stats & Actions) - spans 8/12 */}
                    <div style={{ gridColumn: 'span 8', display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                        {/* Stats Strip */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
                            <StatCard
                                label="총 응시 횟수"
                                value={`${stats.totalExams}회`}
                                icon={<BarChart2 size={20} color="#6366f1" />}
                                color="rgba(99, 102, 241, 0.1)"
                            />
                            <StatCard
                                label="합격률"
                                value={`${stats.passRate}%`}
                                icon={<Trophy size={20} color="#10b981" />}
                                color="rgba(16, 185, 129, 0.1)"
                            />
                            <StatCard
                                label="취약 유형"
                                value="3D모델링"
                                icon={<AlertCircle size={20} color="#f59e0b" />}
                                color="rgba(245, 158, 11, 0.1)"
                                isText
                            />
                        </div>

                        {/* Recent History Table */}
                        <section style={{ background: 'white', borderRadius: '1.5rem', padding: '2rem', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b' }}>최근 응시 기록</h3>
                                <button
                                    onClick={() => navigate('/student/history')}
                                    style={{ color: '#6366f1', background: 'none', border: 'none', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                                >
                                    전체보기 <ChevronRight size={16} />
                                </button>
                            </div>

                            {stats.recentResults.length > 0 ? (
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <tbody>
                                        {stats.recentResults.map((result) => (
                                            <tr key={result.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                <td style={{ padding: '1rem 0', color: '#64748b', fontSize: '0.9rem' }}>
                                                    {new Date(result.date).toLocaleDateString()}
                                                </td>
                                                <td style={{ padding: '1rem 0', fontWeight: 600, color: '#334155' }}>
                                                    {result.examTitle || '모의고사'}
                                                </td>
                                                <td style={{ padding: '1rem 0', textAlign: 'right' }}>
                                                    <span style={{
                                                        display: 'inline-block', padding: '0.25rem 0.75rem', borderRadius: '1rem',
                                                        fontSize: '0.85rem', fontWeight: 700,
                                                        background: result.passed ? '#ecfdf5' : '#fef2f2',
                                                        color: result.passed ? '#10b981' : '#ef4444'
                                                    }}>
                                                        {result.score}점 ({result.passed ? '합격' : '불합격'})
                                                    </span>
                                                </td>
                                                <td style={{ padding: '1rem 0', textAlign: 'right' }}>
                                                    <button
                                                        onClick={() => navigate('/student/review')}
                                                        style={{
                                                            padding: '0.4rem 0.8rem', border: '1px solid #e2e8f0', borderRadius: '0.5rem',
                                                            background: 'white', color: '#64748b', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer'
                                                        }}
                                                    >
                                                        오답보기
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                                    아직 응시 기록이 없습니다.
                                </div>
                            )}
                        </section>
                    </div>

                    {/* Right Column (Tools & Support) - spans 4/12 */}
                    <div style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                        {/* Quick Action: Practice */}
                        <ActionCard
                            title="유형별 연습"
                            desc="취약한 파트만 골라서 집중 공략하세요."
                            icon={<BookOpen size={24} color="#0891b2" />}
                            color="#ecfeff"
                            accent="#0891b2"
                            onClick={() => navigate('/student/practice')}
                        />

                        {/* Quick Action: Wrong Notes */}
                        <ActionCard
                            title="오답 노트"
                            desc="틀린 문제를 다시 틀리지 않도록 복습은 필수!"
                            icon={<AlertCircle size={24} color="#e11d48" />}
                            color="#fff1f2"
                            accent="#e11d48"
                            badge={`${stats.recentResults.reduce((acc, cur) => acc + cur.wrongCount, 0)}문제`}
                            onClick={() => navigate('/student/review')}
                        />

                        {/* Quick Action: Support */}
                        <ActionCard
                            title="1:1 문의"
                            desc="궁금한 점이 있다면 언제든 물어보세요."
                            icon={<MessageCircle size={24} color="#6366f1" />}
                            color="#eef2ff"
                            accent="#6366f1"
                            onClick={() => navigate('/student/support')}
                        />

                        {/* Tip Card */}
                        <div style={{ padding: '1.5rem', background: '#334155', borderRadius: '1.5rem', color: 'white' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: '#94a3b8', fontSize: '0.9rem', fontWeight: 600 }}>
                                <Target size={16} /> 오늘의 TIP
                            </div>
                            <p style={{ lineHeight: 1.5, fontSize: '0.95rem' }}>
                                모의고사는 실제 시험 시간인 60분에 맞춰서 풀어보는 것이 중요합니다. 시계를 보며 시간 배분 연습을 해보세요.
                            </p>
                        </div>
                    </div>
                </div>

            </main>

            {/* Enroll Modal */}
            {showEnrollModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        style={{ background: 'white', padding: '2rem', borderRadius: '1rem', width: '90%', maxWidth: '500px', maxHeight: '80vh', overflowY: 'auto' }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>과정 추가 신청</h2>
                            <button onClick={() => setShowEnrollModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem' }}><X /></button>
                        </div>

                        {availableCourses.length === 0 ? (
                            <p style={{ color: 'var(--slate-500)', textAlign: 'center', padding: '2rem' }}>신청 가능한 새로운 과정이 없습니다.</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {availableCourses.map(course => (
                                    <div key={course.id} style={{
                                        padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '0.75rem',
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                    }}>
                                        <span style={{ fontWeight: 600, color: '#334155' }}>{course.name}</span>
                                        <button
                                            onClick={() => handleEnroll(course.id, course.name)}
                                            style={{
                                                padding: '0.5rem 1rem', background: '#6366f1', color: 'white',
                                                border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem'
                                            }}
                                        >
                                            신청하기
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </div>
    );
};

const StatCard = ({ label, value, icon, color, isText }: any) => (
    <div style={{ background: 'white', padding: '1.5rem', borderRadius: '1.25rem', boxShadow: '0 4px 20px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '1rem', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {icon}
        </div>
        <div>
            <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500, marginBottom: '0.2rem' }}>{label}</div>
            <div style={{ fontSize: isText ? '1.1rem' : '1.5rem', fontWeight: 700, color: '#1e293b' }}>{value}</div>
        </div>
    </div>
);

const ActionCard = ({ title, desc, icon, color, onClick, badge }: any) => (
    <motion.button
        whileHover={{ y: -5, boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
        onClick={onClick}
        style={{
            background: 'white', padding: '1.5rem', borderRadius: '1.5rem', border: 'none',
            textAlign: 'left', cursor: 'pointer', boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
            display: 'flex', alignItems: 'start', gap: '1rem', width: '100%', position: 'relative'
        }}
    >
        <div style={{
            minWidth: '48px', height: '48px', borderRadius: '1rem', background: color,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
            {icon}
        </div>
        <div style={{ flex: 1 }}>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {title}
                {badge && <span style={{ fontSize: '0.7rem', background: '#fee2e2', color: '#ef4444', padding: '0.2rem 0.6rem', borderRadius: '1rem' }}>{badge}</span>}
            </h4>
            <p style={{ fontSize: '0.9rem', color: '#64748b', lineHeight: 1.4 }}>{desc}</p>
        </div>
    </motion.button>
);
