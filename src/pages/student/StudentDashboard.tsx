
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Play, BookOpen, AlertCircle, PlusCircle, X,
    Trophy, Target, BarChart2, Clock, CheckCircle, GraduationCap, LayoutDashboard, ChevronRight, Award, Home
} from 'lucide-react';
import React, { useEffect, useState, useRef } from 'react';
import { AuthService } from '../../services/authService';
import { ExamService } from '../../services/examService';
import { CourseService } from '../../services/courseService';
import { User, ExamResult, Course } from '../../types';
import { CourseDetailModal } from '../../components/student/CourseDetailModal';

// Components
const SectionTitle = ({ children, icon: Icon }: any) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', marginTop: '2rem' }}>
        {Icon && <Icon size={24} color="#6366f1" />}
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>{children}</h2>
    </div>
);

const CourseCard = ({ title, status, expiresAt, isSelected, onClick }: any) => {
    const isPending = status === 'pending';

    return (
        <motion.div
            whileHover={{ y: -2, boxShadow: '0 8px 15px -5px rgba(0,0,0,0.1)' }}
            onClick={!isPending ? onClick : undefined}
            style={{
                background: isSelected ? 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)' : 'white',
                color: isSelected ? 'white' : '#1e293b',
                padding: '1rem 1.25rem', // Reduced padding
                borderRadius: '1rem',
                boxShadow: isSelected ? '0 8px 20px -5px rgba(79, 70, 229, 0.3)' : '0 2px 4px -1px rgba(0,0,0,0.05)',
                border: isSelected ? 'none' : '1px solid #e2e8f0',
                cursor: isPending ? 'default' : 'pointer',
                position: 'relative',
                overflow: 'hidden',
                height: '100%',
                minHeight: '140px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '0.25rem'
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                <div style={{
                    padding: '0.2rem 0.6rem',
                    borderRadius: '2rem',
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    background: isPending ? '#fef3c7' : (isSelected ? 'rgba(255,255,255,0.2)' : '#dcfce7'),
                    color: isPending ? '#d97706' : (isSelected ? 'white' : '#166534'),
                    display: 'inline-block'
                }}>
                    {isPending ? '승인 대기중' : '수강중'}
                </div>
                {isSelected && <CheckCircle size={16} color="white" style={{ opacity: 0.9 }} />}
            </div>

            <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0', lineHeight: 1.3 }}>
                {title}
            </h3>

            {!isPending && (
                <div style={{ fontSize: '0.75rem', opacity: isSelected ? 0.9 : 0.5, display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.25rem' }}>
                    <Clock size={12} />
                    {expiresAt ? `${new Date(expiresAt).toLocaleDateString()} 까지` : '기간 무제한'}
                </div>
            )}
        </motion.div>
    );
};

const ActionCard = ({ title, desc, icon, color, onClick, disabled, badge, isPrimary }: any) => {
    // 실전 모의고사는 특별한 스타일 적용
    if (isPrimary) {
        return (
            <motion.button
                whileHover={{ y: -8, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onClick}
                disabled={disabled}
                style={{
                    background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #818cf8 100%)',
                    padding: '1.75rem', 
                    borderRadius: '1.5rem', 
                    border: 'none',
                    textAlign: 'left', 
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    boxShadow: '0 20px 40px -10px rgba(79, 70, 229, 0.4), 0 0 0 3px rgba(99, 102, 241, 0.1)',
                    display: 'flex', 
                    flexDirection: 'column',
                    alignItems: 'start', 
                    gap: '1rem', 
                    width: '100%', 
                    position: 'relative',
                    overflow: 'hidden',
                    opacity: disabled ? 0.6 : 1,
                    filter: disabled ? 'grayscale(1)' : 'none',
                    minHeight: '160px'
                }}
            >
                {/* 배경 장식 요소 */}
                <div style={{
                    position: 'absolute',
                    top: '-40px',
                    right: '-40px',
                    width: '150px',
                    height: '150px',
                    background: 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 70%)',
                    borderRadius: '50%'
                }} />
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', width: '100%', position: 'relative', zIndex: 1 }}>
                    <motion.div 
                        animate={{ 
                            scale: [1, 1.1, 1],
                            boxShadow: [
                                '0 0 0 0 rgba(255,255,255,0.4)',
                                '0 0 0 8px rgba(255,255,255,0)',
                                '0 0 0 0 rgba(255,255,255,0)'
                            ]
                        }}
                        transition={{ 
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                        style={{
                            minWidth: '56px', 
                            height: '56px', 
                            borderRadius: '1.25rem', 
                            background: 'rgba(255,255,255,0.25)',
                            backdropFilter: 'blur(10px)',
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            border: '2px solid rgba(255,255,255,0.3)'
                        }}
                    >
                        {icon && React.cloneElement(icon, { size: 28, color: 'white' })}
                    </motion.div>
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
                            <h4 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'white', margin: 0 }}>
                                {title}
                            </h4>
                            {badge && (
                                <span style={{ 
                                    fontSize: '0.7rem', 
                                    background: 'rgba(255,255,255,0.3)', 
                                    color: 'white', 
                                    padding: '0.25rem 0.7rem', 
                                    borderRadius: '0.875rem',
                                    fontWeight: 600,
                                    backdropFilter: 'blur(10px)'
                                }}>
                                    {badge}
                                </span>
                            )}
                        </div>
                        <p style={{ fontSize: '0.95rem', color: 'rgba(255,255,255,0.95)', lineHeight: 1.4, fontWeight: 500 }}>
                            {desc}
                        </p>
                    </div>
                </div>
                
                {/* CTA 버튼 */}
                <motion.div
                    whileHover={{ scale: 1.05 }}
                    style={{
                        position: 'relative',
                        zIndex: 1,
                        alignSelf: 'flex-end',
                        marginTop: 'auto',
                        padding: '0.7rem 1.75rem',
                        background: 'rgba(255,255,255,0.95)',
                        color: '#4f46e5',
                        borderRadius: '0.875rem',
                        fontWeight: 700,
                        fontSize: '0.9rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                    }}
                >
                    지금 시작하기 <ChevronRight size={18} />
                </motion.div>
            </motion.button>
        );
    }
    
    // 일반 카드 스타일
    return (
        <motion.button
            whileHover={!disabled ? { y: -5, boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' } : undefined}
            onClick={onClick}
            disabled={disabled}
            style={{
                background: 'white', padding: '1.5rem', borderRadius: '1.5rem', border: 'none',
                textAlign: 'left', cursor: disabled ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
                display: 'flex', alignItems: 'start', gap: '1rem', width: '100%', position: 'relative',
                opacity: disabled ? 0.6 : 1,
                filter: disabled ? 'grayscale(1)' : 'none'
            }}
        >
            <div style={{
                minWidth: '48px', height: '48px', borderRadius: '1rem', background: color,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
                {icon}
            </div>
            <div style={{ flex: 1 }}>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.3rem' }}>
                    {title}
                    {badge && <span style={{ fontSize: '0.7rem', background: '#fee2e2', color: '#ef4444', padding: '0.2rem 0.6rem', borderRadius: '1rem' }}>{badge}</span>}
                </h4>
                <p style={{ fontSize: '0.9rem', color: '#64748b', lineHeight: 1.4 }}>{desc}</p>
            </div>
        </motion.button>
    );
};

export const StudentDashboard = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState<User | null>(null);
    const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
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

    // Course Detail Modal State
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedDetailCourse, setSelectedDetailCourse] = useState<Course | null>(null);

    // Learning Tools Section Ref
    const learningToolsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const initDashboard = async () => {
            let currentUser = AuthService.getCurrentUser();
            if (!currentUser) {
                navigate('/login');
                return;
            }

            // 1. Initial load from cache (fast)
            setUser(currentUser);

            // 2. Load stats
            loadStats();

            // 3. Refresh user data from server (to get latest approvals)
            try {
                const freshUser = await AuthService.refreshSession();
                if (freshUser) {
                    setUser(freshUser);
                    console.log('User data refreshed from server');
                }
            } catch (e) {
                console.error('Failed to refresh session:', e);
            }
        };

        initDashboard();
    }, [navigate]);

    // Auto-select course logic
    useEffect(() => {
        // Only run if user is loaded and no course is selected yet
        if (user && !selectedCourse) {
            const activeEnrollment = (user.courseEnrollments || []).find(e => e.status === 'active' || e.status === 'approved');
            if (activeEnrollment) {
                setSelectedCourse(activeEnrollment.courseName);
            }
        }
    }, [user, selectedCourse]);

    const loadStats = async () => {
        const history = await ExamService.getExamHistory();
        if (history.length > 0) {
            const total = history.length;
            const scores = history.map(h => h.score);
            const avg = Math.round(scores.reduce((a, b) => a + b, 0) / total);
            const max = Math.max(...scores);
            const passed = history.filter(h => h.passed).length;
            setStats({
                totalExams: total,
                averageScore: avg,
                maxScore: max,
                recentResults: [...history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5),
                passRate: Math.round((passed / total) * 100)
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
    };

    const handleEnroll = async (courseId: string, courseName: string) => {
        if (!user) return;
        if (!confirm(`'${courseName}' 과정을 신청하시겠습니까?`)) return;

        const result = await CourseService.requestEnrollment(user.id, courseId);
        if (result.success) {
            alert(result.message); // text: "신청되었습니다"

            // UX 개선: 새로고침 없이 즉시 상태 반영
            setUser(prev => {
                if (!prev) return null;
                return {
                    ...prev,
                    pendingCourses: [...(prev.pendingCourses || []), courseName]
                };
            });

            // 모달 닫기
            setShowEnrollModal(false);
        } else {
            alert(result.message);
        }
    };

    const handleCourseClick = (courseName: string) => {
        setSelectedCourse(courseName);
        // 학습 도구 섹션으로 스크롤
        setTimeout(() => {
            learningToolsRef.current?.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start' 
            });
        }, 100);
    };

    if (!user) return null;

    const activeEnrollments = (user.courseEnrollments || []).filter(e => e.status === 'active' || e.status === 'approved');
    const pendingCourses = user.pendingCourses || [];

    return (
        <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: "'Pretendard', sans-serif" }}>
            {/* 1. Header (Simple) */}
            <header style={{ background: 'white', padding: '1rem 0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div onClick={() => navigate('/')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <img src="/images/wow_logo.png" alt="WOW3D" style={{ height: '28px' }} />
                        <span style={{ fontWeight: 800, fontSize: '1.4rem', color: '#1e293b' }}>
                            WOW3D<span style={{ color: '#6366f1' }}>-CBT</span>
                        </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e293b' }}>{user.name}님</div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{user.email}</div>
                        </div>
                        <button
                            onClick={() => navigate('/')}
                            style={{ padding: '0.5rem 1rem', background: 'transparent', border: '1px solid #e2e8f0', borderRadius: '0.5rem', fontSize: '0.85rem', fontWeight: 600, color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', marginRight: '0.5rem' }}
                        >
                            <Home size={16} /> 홈으로
                        </button>
                        <button
                            onClick={() => navigate('/student/support')}
                            style={{ padding: '0.5rem 1rem', background: 'transparent', border: '1px solid #e2e8f0', borderRadius: '0.5rem', fontSize: '0.85rem', fontWeight: 600, color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', marginRight: '0.5rem' }}
                        >
                            <AlertCircle size={16} /> 1:1 문의
                        </button>
                        <button
                            onClick={() => AuthService.logout()}
                            style={{ padding: '0.5rem 1rem', background: '#f1f5f9', border: 'none', borderRadius: '0.5rem', fontSize: '0.85rem', fontWeight: 600, color: '#475569', cursor: 'pointer' }}
                        >
                            로그아웃
                        </button>
                    </div>
                </div>
            </header>

            <main className="container" style={{ paddingBottom: '4rem' }}>

                {/* 2. Welcome Message */}
                <div style={{ margin: '2rem 0' }}>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.5rem' }}>
                        안녕하세요, {user.name}님! 👋
                    </h1>
                    <p style={{ color: '#64748b', fontSize: '1rem' }}>
                        오늘도 목표 달성을 위해 힘차게 시작해볼까요?
                    </p>
                </div>

                {/* 3. My Courses Section */}
                <SectionTitle icon={GraduationCap}>내 강의실</SectionTitle>

                {/* Empty State */}
                {activeEnrollments.length === 0 && pendingCourses.length === 0 && (
                    <div style={{ background: 'white', padding: '3rem', borderRadius: '1rem', textAlign: 'center', border: '1px dashed #cbd5e1', marginBottom: '3rem' }}>
                        <div style={{ marginBottom: '1rem', background: '#eff6ff', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                            <BookOpen size={32} color="#3b82f6" />
                        </div>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.5rem' }}>아직 수강 중인 과정이 없습니다</h3>
                        <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>새로운 과정을 신청하고 학습을 시작해보세요!</p>
                        <button
                            onClick={handleOpenEnrollModal}
                            style={{ padding: '0.75rem 1.5rem', background: '#4f46e5', color: 'white', border: 'none', borderRadius: '0.75rem', fontWeight: 600, fontSize: '1rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                            <PlusCircle size={18} /> 새 과정 신청하기
                        </button>
                    </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem', marginBottom: '2rem', alignItems: 'stretch' }}>
                    {/* Active Courses */}
                    {activeEnrollments.map((enrollment, idx) => (
                        <CourseCard
                            key={`active-${idx}`}
                            title={enrollment.courseName}
                            status={enrollment.status}
                            expiresAt={enrollment.expiresAt}
                            isSelected={selectedCourse === enrollment.courseName}
                            onClick={() => handleCourseClick(enrollment.courseName)}
                        />
                    ))}

                    {/* Pending Courses */}
                    {pendingCourses.map((courseName, idx) => (
                        <CourseCard
                            key={`pending-${idx}`}
                            title={courseName}
                            status="pending"
                            isSelected={false}
                        />
                    ))}

                    {/* Add Button (Small) */}
                    {(activeEnrollments.length > 0 || pendingCourses.length > 0) && (
                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            onClick={handleOpenEnrollModal}
                            style={{
                                background: '#f8fafc',
                                border: '2px dashed #cbd5e1',
                                borderRadius: '1rem',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.75rem',
                                color: '#64748b',
                                cursor: 'pointer',
                                height: '100%',
                                minHeight: '140px'
                            }}
                        >
                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <PlusCircle size={20} color="#64748b" />
                            </div>
                            <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>새 과정 추가</span>
                        </motion.div>
                    )}
                </div>

                {/* 4. Learning Tools (Only visible when course selected) */}
                {selectedCourse ? (
                    <motion.div
                        ref={learningToolsRef}
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                        style={{
                            background: 'white',
                            borderRadius: '1.5rem',
                            padding: '2rem',
                            boxShadow: '0 20px 40px -5px rgba(0,0,0,0.05)',
                            border: '2px solid #e0e7ff' // Emphasis border
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <SectionTitle icon={LayoutDashboard} style={{ margin: 0 }}>
                                <span style={{ color: '#4f46e5' }}>{selectedCourse}</span> 학습 도구
                            </SectionTitle>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            {/* 실전 모의고사 - 강조된 메인 카드 */}
                            <ActionCard
                                title="실전 모의고사"
                                desc="실제 시험과 동일한 환경에서 테스트해보세요."
                                icon={<Play size={24} color="#6366f1" />}
                                color="#e0e7ff"
                                onClick={() => navigate(`/student/exam?course=${encodeURIComponent(selectedCourse)}`)}
                                isPrimary={true}
                            />
                            
                            {/* 오답 노트 & 성적 분석 - 나란히 배치 */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.5rem' }}>
                                <ActionCard
                                    title="오답 노트"
                                    desc="틀린 문제를 다시 풀며 약점을 보완하세요."
                                    icon={<AlertCircle size={24} color="#ef4444" />}
                                    color="#fee2e2"
                                    onClick={() => navigate('/student/review')}
                                    badge={`${stats.totalExams > 0 ? '학습중' : ''}`}
                                />
                                <ActionCard
                                    title="성적 분석"
                                    desc="나의 학습 성취도와 합격 확률을 확인하세요."
                                    icon={<BarChart2 size={24} color="#10b981" />}
                                    color="#d1fae5"
                                    onClick={() => navigate('/student/analytics')}
                                    badge={stats.totalExams === 0 ? '데이터 부족' : undefined}
                                />
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    (activeEnrollments.length > 0) && (
                        <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8', background: 'rgba(255,255,255,0.5)', borderRadius: '1rem', border: '1px solid #e2e8f0' }}>
                            <BookOpen size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                            <p>학습할 과정을 위 &quot;내 강의실&quot; 목록에서 선택해주세요.</p>
                        </div>
                    )
                )}

                {/* Hero Section (Additional Info) */}
                <div style={{ marginTop: '4rem' }}>
                    <div style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                        borderRadius: '2rem', padding: '3rem', color: 'white',
                        position: 'relative', overflow: 'hidden',
                        boxShadow: '0 20px 40px -10px rgba(79, 70, 229, 0.4)'
                    }}>
                        <div style={{ position: 'relative', zIndex: 1 }}>
                            <div style={{
                                display: 'inline-block', padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.2)',
                                borderRadius: '2rem', fontSize: '0.85rem', fontWeight: 600, marginBottom: '1rem',
                                backdropFilter: 'blur(10px)'
                            }}>
                                D-Day 기능 준비중
                            </div>
                            <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '1rem', lineHeight: 1.2 }}>
                                합격까지 완벽한 페이스메이커!
                            </h1>
                            <p style={{ fontSize: '1.1rem', opacity: 0.9 }}>
                                WOW3D-CBT와 함께라면 합격은 당신의 것입니다.
                            </p>
                        </div>
                        {/* Decorative Elements */}
                        <div style={{
                            position: 'absolute', right: '-50px', bottom: '-50px', width: '300px', height: '300px',
                            background: 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 70%)',
                            borderRadius: '50%'
                        }} />
                    </div>
                </div>

                {/* Stats Grid */}
                <div style={{ marginTop: '2rem', marginBottom: '1rem' }}>
                    <div
                        onClick={() => navigate('/student/history')}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', cursor: 'pointer' }}
                    >
                        <SectionTitle icon={BarChart2}>학습 요약</SectionTitle>
                        <span style={{ fontSize: '0.9rem', color: '#6366f1', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            상세보기 <ChevronRight size={16} />
                        </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                                <Target size={28} color="#7c3aed" />
                            </div>
                            <div style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 600, marginBottom: '0.25rem' }}>총 응시 횟수</div>
                            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#1e293b' }}>{stats.totalExams}<span style={{ fontSize: '1rem', fontWeight: 600, color: '#94a3b8', marginLeft: '0.2rem' }}>회</span></div>
                        </div>

                        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                                <Trophy size={28} color="#059669" />
                            </div>
                            <div style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 600, marginBottom: '0.25rem' }}>합격률</div>
                            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#1e293b' }}>{stats.passRate}<span style={{ fontSize: '1rem', fontWeight: 600, color: '#94a3b8', marginLeft: '0.2rem' }}>%</span></div>
                        </div>

                        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                                <Award size={28} color="#d97706" />
                            </div>
                            <div style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 600, marginBottom: '0.25rem' }}>최고 점수</div>
                            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#1e293b' }}>{stats.maxScore}<span style={{ fontSize: '1rem', fontWeight: 600, color: '#94a3b8', marginLeft: '0.2rem' }}>점</span></div>
                        </div>
                    </div>
                </div>

                {/* 5. Enrollment Modal */}
                {showEnrollModal && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                    }}>
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            style={{ background: 'white', borderRadius: '1rem', width: '90%', maxWidth: '500px', overflow: 'hidden' }}
                        >
                            <div style={{ padding: '1.5rem', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>새 과정 신청</h3>
                                <button onClick={() => setShowEnrollModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                    <X size={24} color="#64748b" />
                                </button>
                            </div>
                            <div style={{ padding: '1.5rem', maxHeight: '60vh', overflowY: 'auto' }}>
                                {availableCourses.length > 0 ? (
                                    <div style={{ display: 'grid', gap: '1rem' }}>
                                        {availableCourses.map((course) => (
                                            <div
                                                key={course.id}
                                                style={{
                                                    padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '0.75rem',
                                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                                }}
                                            >
                                                <div>
                                                    <div style={{ fontWeight: 700, color: '#1e293b' }}>{course.name}</div>
                                                    <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.2rem' }}>
                                                        {(course as any).category || '자격증'}
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <button
                                                        onClick={() => { setSelectedDetailCourse(course); setShowDetailModal(true); }}
                                                        style={{
                                                            padding: '0.5rem 1rem', background: '#6366f1', color: 'white',
                                                            border: 'none', borderRadius: '0.5rem',
                                                            cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', flex: 1
                                                        }}
                                                    >
                                                        신청하기
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                                        신청 가능한 과정이 없습니다.
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </main>

            {/* Course Detail Modal */}
            {showDetailModal && selectedDetailCourse && (
                <CourseDetailModal
                    course={selectedDetailCourse}
                    onClose={() => setShowDetailModal(false)}
                    onEnroll={handleEnroll}
                />
            )}

        </div>
    );
};
