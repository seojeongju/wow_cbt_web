import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, BarChart2, MousePointerClick, ChevronRight, Printer, PenTool, Cpu, Box, UserPlus, PlayCircle, Trophy, CheckCircle2, X, Clock, Target, Award, FileText, MessageCircle } from 'lucide-react';
import { CourseService } from '../services/courseService';
import { AuthService } from '../services/authService';
import { SupportService } from '../services/supportService';
import { formatPhoneNumber } from '../utils/formatters';
import { useEffect, useState } from 'react';

// 과정별 상세 정보 데이터
const courseDetails: { [key: string]: { description: string; targets: string[]; features: string[]; howToUse: string[] } } = {
    '3D프린터운용기능사': {
        description: '3D 프린터를 활용하여 제품을 설계하고 출력하는 실무 능력을 평가하는 국가기술자격입니다. 3D 모델링, 슬라이싱, 출력 및 후처리 전반에 걸친 역량을 검증합니다.',
        targets: ['3D 프린터 관련 취업 준비생', '제조업 종사자', '메이커 및 창작자', '기술 교육자'],
        features: ['실제 시험과 동일한 문제 유형', 'AI 기반 오답 분석', '카테고리별 취약점 파악', '무제한 모의고사 응시'],
        howToUse: ['1. 회원가입 후 해당 과정을 신청합니다.', '2. 관리자 승인 후 문제풀이가 활성화됩니다.', '3. 모의고사를 통해 실전 연습을 합니다.', '4. 오답노트로 틀린 문제를 복습합니다.', '5. 성적 분석으로 취약 영역을 파악합니다.']
    },
    '3D프린터개발산업기사': {
        description: '3D 프린터 시스템의 설계, 개발, 유지보수 능력을 평가하는 중급 기술자격입니다. 하드웨어 구조, 펌웨어, 소재 특성 등 심화 지식을 다룹니다.',
        targets: ['3D 프린터 개발자', '장비 유지보수 엔지니어', '기술 연구원', '기능사 취득 후 상위 자격 준비자'],
        features: ['심화 이론 문제 포함', '실기 대비 핵심 개념', '최신 기출 경향 반영', '전문가 해설 제공'],
        howToUse: ['1. 회원가입 후 해당 과정을 신청합니다.', '2. 관리자 승인 후 문제풀이가 활성화됩니다.', '3. 이론 문제로 개념을 정리합니다.', '4. 모의고사로 실전 감각을 익힙니다.', '5. 오답노트로 취약 부분을 보완합니다.']
    }
};

// 기본 상세 정보 (정의되지 않은 과정용)
const defaultCourseDetail = {
    description: '체계적인 문제은행과 모의고사를 통해 자격증 취득을 지원하는 온라인 학습 과정입니다.',
    targets: ['해당 분야 취업 준비생', '실무 역량 향상을 원하는 직장인', '자격증 취득을 목표로 하는 분'],
    features: ['실전 모의고사 제공', 'AI 오답 분석', '성적 통계 및 취약점 분석', '언제 어디서나 학습 가능'],
    howToUse: ['1. 회원가입 후 원하는 과정을 신청합니다.', '2. 관리자 승인 후 문제풀이가 활성화됩니다.', '3. 모의고사를 통해 실력을 점검합니다.', '4. 오답노트로 틀린 문제를 복습합니다.', '5. 성적 분석을 통해 학습 전략을 세웁니다.']
};


export const LandingPage = () => {
    const navigate = useNavigate();
    const [courses, setCourses] = useState<any[]>([]);
    const [currentSlide, setCurrentSlide] = useState(0);
    const isLoggedIn = !!AuthService.getCurrentUser();

    // Mobile responsive state
    const [isMobile, setIsMobile] = useState(false);

    // 과정 상세 모달 상태
    const [selectedCourse, setSelectedCourse] = useState<any | null>(null);
    const [showCourseModal, setShowCourseModal] = useState(false);

    // 문의 모달 상태
    const [showSupportModal, setShowSupportModal] = useState(false);
    const [isSupportSubmitting, setIsSupportSubmitting] = useState(false);
    const [supportForm, setSupportForm] = useState({
        name: '',
        email: '',
        phone: '',
        category: 'QUESTION',
        title: '',
        content: '',
        agree: false
    });

    const handleSupportSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!isLoggedIn) {
            if (!supportForm.name || !supportForm.email) {
                alert('이름과 이메일을 입력해주세요.');
                return;
            }
            if (!supportForm.agree) {
                alert('개인정보 수집 및 이용에 동의해주세요.');
                return;
            }
        }
        if (!supportForm.title || !supportForm.content) {
            alert('제목과 내용을 입력해주세요.');
            return;
        }

        setIsSupportSubmitting(true);
        try {
            const user = AuthService.getCurrentUser();
            await SupportService.createInquiry({
                userId: user?.id, // Optional
                userName: isLoggedIn ? user!.name : supportForm.name,
                userEmail: isLoggedIn ? user!.email : supportForm.email,
                category: supportForm.category,
                title: supportForm.title,
                content: isLoggedIn
                    ? supportForm.content
                    : `[연락처: ${supportForm.phone || '미입력'}]\n\n${supportForm.content}`
            });
            alert(isLoggedIn
                ? '문의가 등록되었습니다.\n답변은 대시보드 또는 가입하신 이메일로 확인 가능합니다.'
                : '문의가 등록되었습니다.\n답변은 입력하신 이메일로 발송됩니다.');
            setShowSupportModal(false);
            setSupportForm({ ...supportForm, title: '', content: '', agree: false });
        } catch (error) {
            console.error(error);
            alert('문의 등록 중 오류가 발생했습니다.');
        } finally {
            setIsSupportSubmitting(false);
        }
    };

    const slides = [
        {
            subtitle: "3D 프린터 운용기능사 합격 솔루션",
            title: "실전처럼 연습하고\n한 번에 합격하세요",
            desc: "실제 시험 환경과 동일한 모의고사 시스템을 제공합니다.\n오답 노트로 완벽하게 복습하고 취약 유형을 분석받으세요.",
            image: "/images/hero/operation.png"
        },
        {
            subtitle: "3D 프린터 개발산업기사 전문 과정",
            title: "더 깊이 있는 전문가로\n성장하는 지름길",
            desc: "하드웨어 설계부터 제어 시스템까지,\n산업기사 핵심 기출문제를 완벽하게 대비하세요.",
            image: "/images/hero/development.png"
        },
        {
            subtitle: "ACU 국제 자격증 대비",
            title: "글로벌 스탠다드\n3D 모델링 전문가",
            desc: "Autodesk Certified User 자격증 취득을 위한\n실전 문제와 팁을 제공합니다.",
            image: "/images/hero/acu.png"
        },
        {
            subtitle: "3D 프린터 전문 교강사 양성",
            title: "미래 교육을 선도하는\n최고의 3D 교육 전문가",
            desc: "체계적인 교육 커리큘럼과 티칭 노하우,\n강사 자격 취득을 위한 필수 코스입니다.",
            image: "/images/hero/instructor.png"
        }
    ];

    useEffect(() => {
        (async () => {
            const courseList = await CourseService.getCourses();
            setCourses(courseList);
        })();

        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length);
        }, 5000);

        // Check screen size
        const handleResize = () => {
            setIsMobile(window.innerWidth < 640);
        };

        handleResize(); // Initial check
        window.addEventListener('resize', handleResize);

        return () => {
            clearInterval(timer);
            window.removeEventListener('resize', handleResize);
        };
    }, []);



    const handleStartClick = () => {
        if (isLoggedIn) {
            navigate('/student/dashboard');
        } else {
            if (confirm("회원가입 후 이용 가능한 유료 서비스입니다.\n지금 무료 회원가입 페이지로 이동하시겠습니까?")) {
                navigate('/register');
            }
        }
    };

    return (
        <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: "'Inter', sans-serif" }}>
            {/* Header */}
            <header style={{
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 100,
                borderBottom: '1px solid #e2e8f0',
                padding: isMobile ? '0.75rem 0' : '0.8rem 0'
            }}>
                <div className="container" style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: isMobile ? '0 0.75rem' : '0 1rem',
                    maxWidth: '1200px',
                    margin: '0 auto'
                }}>
                    {/* Logo */}
                    <div
                        style={{
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: isMobile ? '0.5rem' : '0.75rem'
                        }}
                        onClick={() => navigate('/')}
                    >
                        <img src="/images/wow_logo.png" alt="WOW3D-CBT" style={{ height: isMobile ? '28px' : '32px' }} />
                        {!isMobile && (
                            <span style={{
                                fontSize: '1.25rem',
                                fontWeight: 800,
                                color: '#334155',
                                letterSpacing: '-0.5px'
                            }}>WOW3D-CBT</span>
                        )}
                    </div>

                    {/* Navigation */}
                    <div style={{ display: 'flex', gap: isMobile ? '0.5rem' : '0.75rem', alignItems: 'center' }}>
                        {/* 1:1 문의 버튼 */}
                        {!isMobile && (
                            <button
                                onClick={() => setShowSupportModal(true)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.4rem',
                                    background: 'transparent',
                                    border: 'none',
                                    color: '#475569',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    fontSize: '0.9rem',
                                    padding: '0.5rem 0.75rem'
                                }}
                            >
                                <MessageCircle size={18} /> 1:1 문의
                            </button>
                        )}

                        {/* Mobile: 아이콘만 */}
                        {isMobile && (
                            <button
                                onClick={() => setShowSupportModal(true)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    background: 'transparent',
                                    border: 'none',
                                    color: '#475569',
                                    cursor: 'pointer',
                                    padding: '0.5rem',
                                    borderRadius: '0.5rem'
                                }}
                            >
                                <MessageCircle size={20} />
                            </button>
                        )}

                        {/* Logged in: Dashboard button */}
                        {isLoggedIn ? (
                            <button
                                onClick={() => navigate('/student/dashboard')}
                                className="btn btn-primary"
                                style={{
                                    fontSize: isMobile ? '0.85rem' : '0.95rem',
                                    padding: isMobile ? '0.5rem 1rem' : '0.625rem 1.25rem'
                                }}
                            >
                                {isMobile ? '대시보드' : '대시보드 가기'}
                            </button>
                        ) : (
                            /* Not logged in: Login + Register */
                            <>
                                <button
                                    onClick={() => navigate('/login')}
                                    style={{
                                        padding: isMobile ? '0.5rem 0.875rem' : '0.5rem 1rem',
                                        background: 'transparent',
                                        border: 'none',
                                        color: '#64748b',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        fontSize: isMobile ? '0.85rem' : '0.95rem',
                                        borderRadius: '0.5rem'
                                    }}
                                >
                                    로그인
                                </button>
                                <button
                                    onClick={() => navigate('/register')}
                                    className="btn btn-primary"
                                    style={{
                                        padding: isMobile ? '0.5rem 1rem' : '0.5rem 1.2rem',
                                        fontSize: isMobile ? '0.85rem' : '0.95rem'
                                    }}
                                >
                                    회원가입
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </header>

            {/* Hero Section with Slider */}
            <section style={{
                position: 'relative',
                height: '440px',
                overflow: 'hidden',
                color: 'white',
                textAlign: 'center'
            }}>
                <AnimatePresence mode='wait'>
                    <motion.div
                        key={currentSlide}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1 }}
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            backgroundImage: `url(${slides[currentSlide].image})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                        }}
                    >
                        {/* Overlay Gradient */}
                        <div style={{
                            position: 'absolute',
                            top: 0, left: 0, right: 0, bottom: 0,
                            background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.7) 0%, rgba(15, 23, 42, 0.9) 100%)',
                            zIndex: 1
                        }} />
                    </motion.div>
                </AnimatePresence>

                {/* Hero Content */}
                <div
                    style={{
                        position: 'relative',
                        zIndex: 10,
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        paddingTop: '50px'
                    }}
                >
                    <AnimatePresence mode='wait'>
                        <motion.div
                            key={`content-${currentSlide}`}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            style={{ maxWidth: '800px', margin: '0 auto', padding: '0 1rem' }}
                        >
                            <div style={{
                                display: 'inline-block',
                                padding: '0.3rem 0.8rem',
                                background: 'rgba(255, 255, 255, 0.1)',
                                color: '#e2e8f0',
                                borderRadius: '2rem',
                                fontWeight: 700,
                                fontSize: '0.75rem',
                                marginBottom: '0.8rem',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                backdropFilter: 'blur(4px)'
                            }}>
                                {slides[currentSlide].subtitle}
                            </div>
                            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, lineHeight: 1.2, marginBottom: '0.8rem', textShadow: '0 4px 10px rgba(0,0,0,0.8)', color: 'white' }}>
                                {slides[currentSlide].title.split('\n').map((line, i) => (
                                    <span key={i} style={{ display: 'block' }}>{line}</span>
                                ))}
                            </h1>
                            <p style={{ fontSize: '0.9rem', color: '#f1f5f9', marginBottom: '1.5rem', lineHeight: 1.5, textShadow: '0 2px 4px rgba(0,0,0,0.8)', fontWeight: 500 }}>
                                {slides[currentSlide].desc}
                            </p>
                            <button
                                onClick={handleStartClick}
                                style={{
                                    padding: '0.6rem 1.5rem',
                                    fontSize: '0.9rem',
                                    fontWeight: 700,
                                    color: 'white',
                                    background: '#6366f1',
                                    border: 'none',
                                    borderRadius: '3rem',
                                    cursor: 'pointer',
                                    boxShadow: '0 4px 15px rgba(99, 102, 241, 0.4)',
                                    transition: 'transform 0.2s',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.4rem'
                                }}
                            >
                                시작하기 <ChevronRight size={16} />
                            </button>
                        </motion.div>
                    </AnimatePresence>

                    {/* Dots Navigation */}
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
                        {slides.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentSlide(index)}
                                style={{
                                    width: '8px',
                                    height: '8px',
                                    borderRadius: '50%',
                                    border: 'none',
                                    background: currentSlide === index ? '#6366f1' : 'rgba(255,255,255,0.3)',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s'
                                }}
                            />
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section style={{ padding: '5rem 1rem', background: 'white' }}>
                <div className="container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                        <FeatureCard
                            icon={<BookOpen size={32} color="#6366f1" />}
                            title="실전 모의고사 제공"
                            desc="최신 기출 경향을 반영한 3D 프린터 운용기능사 필기 모의고사를 무제한 응시할 수 있습니다."
                        />
                        <FeatureCard
                            icon={<MousePointerClick size={32} color="#10b981" />}
                            title="오답 노트 시스템"
                            desc="틀린 문제는 자동으로 저장됩니다. 시험 직전 오답만 모아서 빠르게 복습하세요."
                        />
                        <FeatureCard
                            icon={<BarChart2 size={32} color="#f59e0b" />}
                            title="학습 성과 분석"
                            desc="나의 점수 변화와 취약한 과목(모델링, 설정 등)을 그래프로 한눈에 파악하세요."
                        />
                    </div>
                </div>
            </section>



            {/* Curriculum Preview Section (Courses) */}
            <section style={{ padding: '6rem 1rem', background: '#f8fafc', position: 'relative', overflow: 'hidden' }}>
                {/* Background Decor */}
                <div style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0, height: '100%',
                    background: 'radial-gradient(circle at 10% 10%, rgba(99, 102, 241, 0.03) 0%, transparent 50%)',
                    zIndex: 0
                }} />

                <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
                    <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                        <span style={{
                            color: '#6366f1',
                            fontWeight: 700,
                            letterSpacing: '0.1em',
                            fontSize: '0.9rem',
                            textTransform: 'uppercase',
                            display: 'block',
                            marginBottom: '0.5rem'
                        }}>Curriculum</span>
                        <h2 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#1e293b', marginBottom: '1rem', letterSpacing: '-0.02em' }}> 교육 과정(문제은행)</h2>
                        <p style={{ color: '#64748b', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
                            국가기술자격부터 실무 전문가 과정까지,<br />WOW3D-CBT만의 체계적인 커리큘럼을 만나보세요.
                        </p>
                    </div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                        gap: '2rem',
                    }}>
                        {courses.length > 0 ? courses.map((course) => {
                            // Icon Selection Logic
                            let Icon = BookOpen;
                            let color1 = '#6366f1'; // Indigo
                            let color2 = '#a5b4fc';

                            if (course.name.includes('운용기능사')) {
                                Icon = Printer;
                                color1 = '#0ea5e9'; // Sky
                                color2 = '#bae6fd';
                            } else if (course.name.includes('기계') || course.name.includes('제도')) {
                                Icon = PenTool;
                                color1 = '#f59e0b'; // Amber
                                color2 = '#fde68a';
                            } else if (course.name.includes('개발') || course.name.includes('산업기사')) {
                                Icon = Cpu;
                                color1 = '#10b981'; // Emerald
                                color2 = '#a7f3d0';
                            } else if (course.name.includes('모델링')) {
                                Icon = Box;
                                color1 = '#8b5cf6'; // Violet
                                color2 = '#ddd6fe';
                            }

                            return (
                                <div key={course.id}
                                    onClick={() => { setSelectedCourse(course); setShowCourseModal(true); }}
                                    className="course-card"
                                    style={{
                                        background: 'white',
                                        borderRadius: '1.5rem',
                                        padding: '2rem',
                                        boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.05)',
                                        border: '1px solid #f1f5f9',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'flex-start',
                                        justifyContent: 'space-between',
                                        minHeight: '280px',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease',
                                        position: 'relative',
                                        overflow: 'hidden'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.transform = 'translateY(-10px)';
                                        e.currentTarget.style.boxShadow = '0 20px 40px -5px rgba(0, 0, 0, 0.1)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = '0 10px 30px -5px rgba(0, 0, 0, 0.05)';
                                    }}
                                >
                                    {/* Abstract Fancy Background for Card */}
                                    <div style={{
                                        position: 'absolute',
                                        top: '-50px',
                                        right: '-50px',
                                        width: '200px',
                                        height: '200px',
                                        background: `radial-gradient(circle, ${color2} 0%, rgba(255,255,255,0) 70%)`,
                                        opacity: 0.2,
                                        borderRadius: '50%',
                                        zIndex: 0
                                    }} />

                                    <div style={{ position: 'relative', zIndex: 1, width: '100%', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                        <div style={{
                                            width: '64px',
                                            height: '64px',
                                            borderRadius: '1.125rem',
                                            background: `linear-gradient(135deg, ${color1}, ${color1}dd)`,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            marginBottom: '1.75rem',
                                            boxShadow: `0 8px 16px -4px ${color1}66`,
                                            color: 'white'
                                        }}>
                                            <Icon size={30} strokeWidth={1.5} />
                                        </div>

                                        <h3 style={{
                                            fontSize: '1.3rem',
                                            fontWeight: 700,
                                            color: '#1e293b',
                                            marginBottom: '1rem',
                                            lineHeight: 1.5,
                                            wordBreak: 'keep-all',
                                            letterSpacing: '-0.02em'
                                        }}>
                                            {course.name}
                                        </h3>

                                        <div style={{
                                            height: '3px',
                                            width: '50px',
                                            background: `linear-gradient(90deg, ${color1}, transparent)`,
                                            borderRadius: '2px'
                                        }} />
                                    </div>

                                    <div style={{
                                        marginTop: '1.5rem',
                                        position: 'relative',
                                        zIndex: 1,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        color: color1,
                                        fontWeight: 600,
                                        fontSize: '0.95rem',
                                        padding: '0.75rem 1.25rem',
                                        borderRadius: '0.75rem',
                                        background: `${color1}08`,
                                        transition: 'all 0.2s'
                                    }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = `${color1}15`;
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = `${color1}08`;
                                        }}
                                    >
                                        <span>과정 보기</span>
                                        <ChevronRight size={16} />
                                    </div>
                                </div>
                            );
                        }) : (
                            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem' }}>
                                <div className="loader" style={{ margin: '0 auto 1rem', border: '3px solid #f3f3f3', borderTop: '3px solid #6366f1', borderRadius: '50%', width: '30px', height: '30px', animation: 'spin 1s linear infinite' }} />
                                <p style={{ color: '#94a3b8' }}>커리큘럼을 불러오는 중입니다...</p>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* How It Works Section (New) */}
            <section style={{ padding: '7rem 1rem', background: 'white', position: 'relative', overflow: 'hidden' }}>
                <div className="container" style={{ maxWidth: '1000px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
                    <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
                        <span style={{ color: '#6366f1', fontWeight: 700, letterSpacing: '0.1em', fontSize: '0.9rem', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>
                            Process
                        </span>
                        <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '1rem', letterSpacing: '-0.02em', color: '#1e293b' }}>
                            CBT 합격 완성 로드맵
                        </h2>
                        <p style={{ color: '#64748b', fontSize: '1.1rem' }}>
                            복잡한 절차 없이, 오직 합격에만 집중할 수 있도록 설계되었습니다.
                        </p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '3rem', position: 'relative' }}>

                        {/* Step 1 */}
                        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
                            <div style={{
                                width: '90px', height: '90px', borderRadius: '2rem', background: '#eef2ff',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem',
                                color: '#6366f1', boxShadow: '0 10px 20px -5px rgba(99, 102, 241, 0.15)'
                            }}>
                                <UserPlus size={36} strokeWidth={1.5} />
                            </div>
                            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '0.75rem', color: '#1e293b' }}>
                                1. 회원가입 및 수강신청
                            </h3>
                            <p style={{ color: '#64748b', lineHeight: 1.6, fontSize: '1rem' }}>
                                간편하게 가입하고 원하는 과정을 신청하세요.<br />관리자 승인 후 즉시 학습이 가능합니다.
                            </p>
                        </div>

                        {/* Step 2 */}
                        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
                            <div style={{
                                width: '90px', height: '90px', borderRadius: '2rem', background: '#ecfdf5',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem',
                                color: '#10b981', boxShadow: '0 10px 20px -5px rgba(16, 185, 129, 0.15)'
                            }}>
                                <PlayCircle size={36} strokeWidth={1.5} />
                            </div>
                            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '0.75rem', color: '#1e293b' }}>
                                2. 실전 모의고사 응시
                            </h3>
                            <p style={{ color: '#64748b', lineHeight: 1.6, fontSize: '1rem' }}>
                                실제 시험장과 동일한 환경에서 연습하세요.<br />제한 시간 내에 문제를 푸는 훈련이 됩니다.
                            </p>
                        </div>

                        {/* Step 3 */}
                        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
                            <div style={{
                                width: '90px', height: '90px', borderRadius: '2rem', background: '#fffbeb',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem',
                                color: '#f59e0b', boxShadow: '0 10px 20px -5px rgba(245, 158, 11, 0.15)'
                            }}>
                                <Trophy size={36} strokeWidth={1.5} />
                            </div>
                            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '0.75rem', color: '#1e293b' }}>
                                3. 오답 분석 및 합격
                            </h3>
                            <p style={{ color: '#64748b', lineHeight: 1.6, fontSize: '1rem' }}>
                                틀린 문제만 모아 집중 공략하세요.<br />완벽한 이해가 합격으로 이어집니다.
                            </p>
                        </div>
                    </div>

                    <div style={{ textAlign: 'center', marginTop: '5rem' }}>
                        <button
                            onClick={() => navigate(isLoggedIn ? '/student/dashboard' : '/login')}
                            style={{
                                background: '#1e293b',
                                color: 'white',
                                padding: '1rem 2.5rem',
                                borderRadius: '3rem',
                                fontSize: '1.1rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.6rem',
                                border: 'none',
                                boxShadow: '0 10px 25px -5px rgba(30, 41, 59, 0.3)'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-3px)';
                                e.currentTarget.style.boxShadow = '0 15px 30px -5px rgba(30, 41, 59, 0.4)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(30, 41, 59, 0.3)';
                            }}
                        >
                            <CheckCircle2 size={20} /> 지금 바로 시작하기
                        </button>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer style={{ background: '#1e293b', color: '#94a3b8', padding: '4rem 1rem', fontSize: '0.9rem' }}>
                <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem' }}>
                    <div style={{ background: 'white', padding: '10px 20px', borderRadius: '8px' }}>
                        <img src="/images/wow_logo.png" alt="WOW3D-CBT" style={{ height: '36px' }} />
                    </div>
                    <div style={{ textAlign: 'center', lineHeight: 1.6 }}>
                        <p>&copy; 2025 WOW3D Education Center. All rights reserved.</p>
                        <p>서울시 마포구 독막로93 상수빌딩4층 | 고객센터: 02-3144-3137 | wow3d16@naver.com</p>
                        <p style={{ marginTop: '0.5rem', opacity: 0.7 }}>본 서비스는 유료 회원 전용 서비스입니다. 무단 배포를 금지합니다.</p>
                    </div>
                </div>
            </footer>

            {/* 과정 상세 모달 */}
            {showCourseModal && selectedCourse && (() => {
                let detail = defaultCourseDetail;

                // 1. Try DB details
                if (selectedCourse.details) {
                    try {
                        const dbDetail = typeof selectedCourse.details === 'string'
                            ? JSON.parse(selectedCourse.details)
                            : selectedCourse.details;

                        if (dbDetail && (dbDetail.description || dbDetail.targets)) {
                            detail = {
                                description: dbDetail.description || defaultCourseDetail.description,
                                targets: (dbDetail.targets && dbDetail.targets.length > 0) ? dbDetail.targets : defaultCourseDetail.targets,
                                features: (dbDetail.features && dbDetail.features.length > 0) ? dbDetail.features : defaultCourseDetail.features,
                                howToUse: (dbDetail.howToUse && dbDetail.howToUse.length > 0) ? dbDetail.howToUse : defaultCourseDetail.howToUse
                            };
                        }
                    } catch (e) {
                        // Fallback on error
                    }
                }
                // 2. Try Hardcoded details (Legacy Support)
                else if (courseDetails[selectedCourse.name]) {
                    detail = courseDetails[selectedCourse.name];
                }

                // 아이콘 및 색상 결정
                let Icon = BookOpen;
                let color1 = '#6366f1';
                if (selectedCourse.name.includes('운용기능사')) {
                    Icon = Printer; color1 = '#0ea5e9';
                } else if (selectedCourse.name.includes('개발') || selectedCourse.name.includes('산업기사')) {
                    Icon = Cpu; color1 = '#10b981';
                } else if (selectedCourse.name.includes('모델링')) {
                    Icon = Box; color1 = '#8b5cf6';
                }

                return (
                    <div
                        style={{
                            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                            background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            zIndex: 1000, padding: '1rem'
                        }}
                        onClick={() => setShowCourseModal(false)}
                    >
                        <div
                            style={{
                                background: 'white', borderRadius: '1.5rem', padding: '2.5rem',
                                maxWidth: '700px', width: '100%', maxHeight: '90vh', overflowY: 'auto',
                                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                                position: 'relative'
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* 닫기 버튼 */}
                            <button
                                onClick={() => setShowCourseModal(false)}
                                style={{
                                    position: 'absolute', top: '1.5rem', right: '1.5rem',
                                    background: '#f1f5f9', border: 'none', borderRadius: '50%',
                                    width: '40px', height: '40px', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}
                            >
                                <X size={20} color="#64748b" />
                            </button>

                            {/* 헤더 */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                                <div style={{
                                    width: '60px', height: '60px', borderRadius: '1rem',
                                    background: `linear-gradient(135deg, ${color1}, ${color1}80)`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    <Icon size={30} color="white" />
                                </div>
                                <div>
                                    <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1e293b', margin: 0 }}>
                                        {selectedCourse.name}
                                    </h2>
                                    <span style={{ fontSize: '0.9rem', color: '#64748b' }}>온라인 CBT 문제은행</span>
                                </div>
                            </div>

                            {/* 설명 */}
                            <div style={{ marginBottom: '2rem' }}>
                                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem', fontWeight: 700, color: '#334155', marginBottom: '0.75rem' }}>
                                    <FileText size={18} color={color1} /> 과정 소개
                                </h3>
                                <div
                                    style={{ color: '#475569', lineHeight: 1.7, background: '#f8fafc', padding: '1rem', borderRadius: '0.75rem', overflowX: 'auto' }}
                                    dangerouslySetInnerHTML={{ __html: detail.description }}
                                />
                            </div>

                            {/* 대상 */}
                            <div style={{ marginBottom: '2rem' }}>
                                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem', fontWeight: 700, color: '#334155', marginBottom: '0.75rem' }}>
                                    <Target size={18} color={color1} /> 학습 대상
                                </h3>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                    {detail.targets.map((t, i) => (
                                        <span key={i} style={{
                                            padding: '0.5rem 1rem', background: '#f1f5f9', borderRadius: '2rem',
                                            fontSize: '0.9rem', color: '#475569'
                                        }}>{t}</span>
                                    ))}
                                </div>
                            </div>

                            {/* 특징 */}
                            <div style={{ marginBottom: '2rem' }}>
                                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem', fontWeight: 700, color: '#334155', marginBottom: '0.75rem' }}>
                                    <Award size={18} color={color1} /> 주요 특징
                                </h3>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                                    {detail.features.map((f, i) => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#475569' }}>
                                            <CheckCircle2 size={16} color="#10b981" />
                                            <span>{f}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* 이용 방법 */}
                            <div style={{ marginBottom: '2rem' }}>
                                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem', fontWeight: 700, color: '#334155', marginBottom: '0.75rem' }}>
                                    <Clock size={18} color={color1} /> 이용 방법
                                </h3>
                                <div style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '0.75rem' }}>
                                    {detail.howToUse.map((step, i) => (
                                        <div key={i} style={{
                                            display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
                                            marginBottom: i < detail.howToUse.length - 1 ? '0.75rem' : 0,
                                            color: '#475569', fontSize: '0.95rem'
                                        }}>
                                            <span style={{
                                                minWidth: '24px', height: '24px', borderRadius: '50%',
                                                background: color1, color: 'white', fontSize: '0.8rem',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600
                                            }}>{i + 1}</span>
                                            <span>{step.replace(/^\d+\.\s*/, '')}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* 신청 버튼 */}
                            <button
                                onClick={() => {
                                    setShowCourseModal(false);
                                    handleStartClick();
                                }}
                                style={{
                                    width: '100%', padding: '1rem', borderRadius: '0.75rem',
                                    background: `linear-gradient(135deg, ${color1}, ${color1}cc)`,
                                    color: 'white', fontWeight: 700, fontSize: '1.1rem',
                                    border: 'none', cursor: 'pointer', display: 'flex',
                                    alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.02)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                            >
                                <PlayCircle size={20} /> 과정 신청하기
                            </button>
                        </div>
                    </div>
                );
            })()}
            {/* 1:1 문의 모달 */}
            {showSupportModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 2000, padding: '1rem'
                }}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        style={{
                            background: 'white', borderRadius: '1.5rem', padding: '2.5rem',
                            maxWidth: '500px', width: '100%', maxHeight: '90vh', overflowY: 'auto',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                            position: 'relative'
                        }}
                    >
                        <button
                            onClick={() => setShowSupportModal(false)}
                            style={{
                                position: 'absolute', top: '1.5rem', right: '1.5rem',
                                background: '#f1f5f9', border: 'none', borderRadius: '50%',
                                width: '36px', height: '36px', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}
                        >
                            <X size={20} color="#64748b" />
                        </button>

                        <div style={{ marginBottom: '2rem' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <MessageCircle size={28} color="#6366f1" /> 1:1 문의
                            </h2>
                            <p style={{ color: '#64748b', fontSize: '0.95rem' }}>
                                {isLoggedIn
                                    ? '궁금한 점이나 불편한 사항을 남겨주세요.'
                                    : '로그인하지 않아도 문의가 가능합니다. 답변은 이메일로 발송됩니다.'}
                            </p>
                        </div>

                        <form onSubmit={handleSupportSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {/* 게스트 전용 필드 */}
                            {!isLoggedIn && (
                                <>
                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        <div style={{ flex: 1 }}>
                                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.3rem' }}>이름</label>
                                            <input
                                                type="text"
                                                value={supportForm.name}
                                                onChange={e => setSupportForm({ ...supportForm, name: e.target.value })}
                                                placeholder="이름"
                                                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.95rem' }}
                                            />
                                        </div>
                                        <div style={{ flex: 1.5 }}>
                                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.3rem' }}>이메일</label>
                                            <input
                                                type="email"
                                                value={supportForm.email}
                                                onChange={e => setSupportForm({ ...supportForm, email: e.target.value })}
                                                placeholder="example@email.com"
                                                style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.95rem' }}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.3rem' }}>전화번호</label>
                                        <input
                                            type="tel"
                                            value={supportForm.phone}
                                            onChange={e => setSupportForm({ ...supportForm, phone: formatPhoneNumber(e.target.value) })}
                                            placeholder="010-0000-0000"
                                            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.95rem' }}
                                        />
                                    </div>
                                </>
                            )}

                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.3rem' }}>문의 유형</label>
                                <select
                                    value={supportForm.category}
                                    onChange={e => setSupportForm({ ...supportForm, category: e.target.value })}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.95rem', background: 'white' }}
                                >
                                    <option value="QUESTION">학습/이용 질문</option>
                                    <option value="ERROR">오류/불편 신고</option>
                                    <option value="OTHER">기타 문의</option>
                                </select>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.3rem' }}>제목</label>
                                <input
                                    type="text"
                                    value={supportForm.title}
                                    onChange={e => setSupportForm({ ...supportForm, title: e.target.value })}
                                    placeholder="문의 제목을 입력해주세요"
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.95rem' }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#475569', marginBottom: '0.3rem' }}>내용</label>
                                <textarea
                                    value={supportForm.content}
                                    onChange={e => setSupportForm({ ...supportForm, content: e.target.value })}
                                    placeholder="문의 내용을 상세히 적어주세요."
                                    rows={5}
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #cbd5e1', fontSize: '0.95rem', resize: 'none', fontFamily: 'inherit' }}
                                />
                            </div>

                            {!isLoggedIn && (
                                <div style={{ background: '#f8fafc', padding: '0.75rem', borderRadius: '0.5rem', fontSize: '0.8rem', color: '#64748b' }}>
                                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            checked={supportForm.agree}
                                            onChange={e => setSupportForm({ ...supportForm, agree: e.target.checked })}
                                            style={{ marginTop: '0.15rem' }}
                                        />
                                        <span>
                                            (필수) 문의 처리 및 답변 발송을 위해 이름, 이메일을 수집하며, 문의 해결 후 3년간 보관됩니다.
                                        </span>
                                    </label>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isSupportSubmitting}
                                style={{
                                    padding: '1rem', borderRadius: '0.75rem', border: 'none',
                                    background: '#6366f1', color: 'white', fontWeight: 700, fontSize: '1rem',
                                    cursor: isSupportSubmitting ? 'not-allowed' : 'pointer',
                                    opacity: isSupportSubmitting ? 0.7 : 1,
                                    marginTop: '0.5rem'
                                }}
                            >
                                {isSupportSubmitting ? '전송 중...' : '문의 등록하기'}
                            </button>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

const FeatureCard = ({ icon, title, desc }: any) => (
    <div style={{ padding: '2rem', borderRadius: '1.5rem', background: '#f8fafc', border: '1px solid #f1f5f9' }}>
        <div style={{ marginBottom: '1.5rem' }}>{icon}</div>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#1e293b', marginBottom: '1rem' }}>{title}</h3>
        <p style={{ color: '#64748b', lineHeight: 1.6 }}>{desc}</p>
    </div>
);
