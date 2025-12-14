import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, BarChart2, MousePointerClick, ChevronRight, Printer, PenTool, Cpu, Box, UserPlus, PlayCircle, Trophy, CheckCircle2 } from 'lucide-react';
import { CourseService } from '../services/courseService';
import { AuthService } from '../services/authService';
import { useEffect, useState } from 'react';


export const LandingPage = () => {
    const navigate = useNavigate();
    const [courses, setCourses] = useState<any[]>([]);
    const [currentSlide, setCurrentSlide] = useState(0);
    const isLoggedIn = !!AuthService.getCurrentUser();

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
        return () => clearInterval(timer);
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
                padding: '0.8rem 0'
            }}>
                <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 1rem', maxWidth: '1200px', margin: '0 auto' }}>
                    <div
                        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem' }}
                        onClick={() => navigate('/')}
                    >
                        <img src="/images/wow_logo.png" alt="WOW3D CBT" style={{ height: '32px' }} />
                        <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#334155', letterSpacing: '-0.5px' }}>WOW3D-CBT</span>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        {isLoggedIn ? (
                            <button onClick={() => navigate('/student/dashboard')} className="btn btn-primary">대시보드 가기</button>
                        ) : (
                            <>
                                <button onClick={() => navigate('/login')} style={{ padding: '0.5rem 1rem', background: 'transparent', border: 'none', color: '#64748b', fontWeight: 600, cursor: 'pointer' }}>로그인</button>
                                <button onClick={() => navigate('/register')} className="btn btn-primary" style={{ padding: '0.5rem 1.2rem' }}>회원가입</button>
                            </>
                        )}
                    </div>
                </div>
            </header>

            {/* Hero Section with Slider */}
            <section style={{
                position: 'relative',
                height: '600px',
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
                        paddingTop: '60px' // Offset for fixed header
                    }}
                >
                    <AnimatePresence mode='wait'>
                        <motion.div
                            key={`content-${currentSlide}`}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -30 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            style={{ maxWidth: '800px', margin: '0 auto', padding: '0 1rem' }}
                        >
                            <div style={{
                                display: 'inline-block',
                                padding: '0.5rem 1rem',
                                background: 'rgba(255, 255, 255, 0.1)',
                                color: '#e2e8f0',
                                borderRadius: '2rem',
                                fontWeight: 700,
                                fontSize: '0.9rem',
                                marginBottom: '1.5rem',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                backdropFilter: 'blur(4px)'
                            }}>
                                {slides[currentSlide].subtitle}
                            </div>
                            <h1 style={{ fontSize: '3.5rem', fontWeight: 800, lineHeight: 1.2, marginBottom: '1.5rem', textShadow: '0 4px 10px rgba(0,0,0,0.8)', color: 'white' }}>
                                {slides[currentSlide].title.split('\n').map((line, i) => (
                                    <span key={i} style={{ display: 'block' }}>{line}</span>
                                ))}
                            </h1>
                            <p style={{ fontSize: '1.2rem', color: '#f1f5f9', marginBottom: '3rem', lineHeight: 1.6, textShadow: '0 2px 4px rgba(0,0,0,0.8)', fontWeight: 500 }}>
                                {slides[currentSlide].desc}
                            </p>
                            <button
                                onClick={handleStartClick}
                                style={{
                                    padding: '1rem 2.5rem',
                                    fontSize: '1.2rem',
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
                                    gap: '0.5rem'
                                }}
                            >
                                시작하기 <ChevronRight />
                            </button>
                        </motion.div>
                    </AnimatePresence>

                    {/* Dots Navigation */}
                    <div style={{ display: 'flex', gap: '0.8rem', marginTop: '3rem' }}>
                        {slides.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentSlide(index)}
                                style={{
                                    width: '12px',
                                    height: '12px',
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
                            국가기술자격부터 실무 전문가 과정까지,<br />WOW3D CBT만의 체계적인 커리큘럼을 만나보세요.
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
                                    onClick={() => handleStartClick()}
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
                                        height: '320px',
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

                                    <div style={{ position: 'relative', zIndex: 1, width: '100%' }}>
                                        <div style={{
                                            width: '60px',
                                            height: '60px',
                                            borderRadius: '1rem',
                                            background: `linear-gradient(135deg, ${color1}, ${color1}dd)`,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            marginBottom: '1.5rem',
                                            boxShadow: `0 8px 16px -4px ${color1}66`,
                                            color: 'white'
                                        }}>
                                            <Icon size={28} strokeWidth={1.5} />
                                        </div>

                                        <h3 style={{
                                            fontSize: '1.4rem',
                                            fontWeight: 800,
                                            color: '#1e293b',
                                            marginBottom: '0.75rem',
                                            lineHeight: 1.3
                                        }}>
                                            {course.name}
                                        </h3>

                                        <div style={{
                                            height: '4px',
                                            width: '40px',
                                            background: '#e2e8f0',
                                            borderRadius: '2px'
                                        }} />
                                    </div>

                                    <div style={{
                                        marginTop: 'auto',
                                        position: 'relative',
                                        zIndex: 1,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        color: color1,
                                        fontWeight: 600,
                                        fontSize: '0.95rem'
                                    }}>
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
                        <img src="/images/wow_logo.png" alt="WOW3D CBT" style={{ height: '36px' }} />
                    </div>
                    <div style={{ textAlign: 'center', lineHeight: 1.6 }}>
                        <p>&copy; 2025 WOW3D Education Center. All rights reserved.</p>
                        <p>서울시 마포구 독막로93 상수빌딩4층 | 고객센터: 02-3144-3137 | wow3d16@naver.com</p>
                        <p style={{ marginTop: '0.5rem', opacity: 0.7 }}>본 서비스는 유료 회원 전용 서비스입니다. 무단 배포를 금지합니다.</p>
                    </div>
                </div>
            </footer>
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
