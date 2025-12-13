import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, BookOpen, AlertCircle, Clock } from 'lucide-react';

export const StudentDashboard = () => {
    const navigate = useNavigate();
    return (
        <div style={{ minHeight: '100vh', background: 'var(--slate-50)', paddingBottom: '4rem' }}>
            {/* Top Navigation */}
            <header style={{ background: 'white', borderBottom: '1px solid var(--slate-200)', padding: '1rem 0' }}>
                <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 700, fontSize: '1.25rem', color: 'var(--slate-900)' }}>
                        WOW<span style={{ color: 'var(--primary-600)' }}>CBT</span>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.9rem', color: 'var(--slate-600)' }}>김수강님 (3D프린터운용기능사)</span>
                        <button className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>로그아웃</button>
                    </div>
                </div>
            </header>

            <main className="container" style={{ marginTop: '2rem' }}>
                {/* Welcome Section */}
                <section style={{ marginBottom: '3rem' }}>
                    <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>반갑습니다, 김수강님! 👋</h1>
                    <p style={{ color: 'var(--slate-500)' }}>오늘도 합격을 향해 달려볼까요? 현재 예상 합격률은 <span style={{ color: 'var(--primary-600)', fontWeight: 700 }}>72%</span> 입니다.</p>
                </section>

                {/* Main Actions Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>

                    {/* Action Card 1: Real Mock Exam */}
                    {/* Action Card 1: Real Mock Exam */}
                    <ActionCard
                        title="실전 모의고사"
                        desc="실제 시험과 동일한 환경(60분)에서 테스트하세요."
                        icon={<Clock size={24} color="white" />}
                        color="var(--primary-600)"
                        buttonText="시험 시작하기"
                        trend="+5점 상승 중"
                        onClick={() => navigate('/exam/exam-001')}
                    />

                    {/* Action Card 2: Practice Mode */}
                    <ActionCard
                        title="유형별 연습"
                        desc="3D모델링, 슬라이싱 등 취약하고 어려운 파트만 집중 공략!"
                        icon={<BookOpen size={24} color="white" />}
                        color="#0891b2"
                        buttonText="문제 풀러가기"
                    />

                    {/* Action Card 3: Wrong Answers */}
                    <ActionCard
                        title="오답 노트"
                        desc="틀린 문제는 다시 틀리기 쉽습니다. 확실하게 내 것으로 만드세요."
                        icon={<AlertCircle size={24} color="white" />}
                        color="#e11d48"
                        buttonText="오답 복습하기"
                        badge="12문제 대기중"
                    />

                </div>

                {/* Statistics Section */}
                <section>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                        <h2 style={{ fontSize: '1.5rem' }}>최근 학습 현황</h2>
                        <button style={{ color: 'var(--primary-600)', fontWeight: 600, fontSize: '0.9rem' }}>전체 보기</button>
                    </div>

                    <div className="glass-card" style={{ padding: '2rem', background: 'white' }}>
                        {/* Mock Chart Area */}
                        <div style={{ display: 'flex', alignItems: 'flex-end', height: '200px', gap: '2rem', paddingBottom: '1rem', borderBottom: '1px solid var(--slate-100)' }}>
                            <ChartBar height="40%" label="1회차" score="40" />
                            <ChartBar height="55%" label="2회차" score="55" />
                            <ChartBar height="60%" label="3회차" score="60" />
                            <ChartBar height="75%" active label="4회차" score="75" />
                            <ChartBar height="65%" label="5회차" score="65" />
                        </div>
                        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'space-around' }}>
                            <StatItem label="총 응시 횟수" value="5회" />
                            <StatItem label="평균 점수" value="59점" />
                            <StatItem label="최고 점수" value="75점" />
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
};

const ActionCard = ({ title, desc, icon, color, buttonText, badge, trend, onClick }: any) => (
    <motion.div
        whileHover={{ y: -5 }}
        className="glass-card"
        style={{ padding: '2rem', background: 'white', position: 'relative', overflow: 'hidden' }}
    >
        <div style={{
            position: 'absolute', top: 0, right: 0, padding: '1rem',
            background: 'linear-gradient(to bottom left, rgba(0,0,0,0.05), transparent)',
            width: '100px', height: '100px', borderRadius: '0 0 0 100%'
        }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
            <div style={{
                width: '48px', height: '48px', borderRadius: '12px', background: color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 4px 10px -2px ${color}66`
            }}>
                {icon}
            </div>
            {badge && <span style={{ background: '#fef2f2', color: '#e11d48', fontSize: '0.75rem', padding: '0.25rem 0.5rem', borderRadius: '1rem', fontWeight: 600 }}>{badge}</span>}
            {trend && <span style={{ background: '#ecfdf5', color: '#059669', fontSize: '0.75rem', padding: '0.25rem 0.5rem', borderRadius: '1rem', fontWeight: 600 }}>{trend}</span>}
        </div>

        <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{title}</h3>
        <p style={{ color: 'var(--slate-500)', fontSize: '0.95rem', marginBottom: '1.5rem', lineHeight: '1.4' }}>{desc}</p>

        <button
            onClick={onClick}
            className="btn"
            style={{
                width: '100%',
                background: 'var(--slate-50)',
                color: 'var(--slate-700)',
                justifyContent: 'space-between',
                padding: '0.75rem 1rem'
            }}>
            {buttonText}
            <Play size={16} fill="currentColor" />
        </button>
    </motion.div>
);

const ChartBar = ({ height, label, score, active }: any) => (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', height: '100%', justifyContent: 'flex-end' }}>
        <motion.div
            initial={{ height: 0 }}
            animate={{ height: height }}
            style={{
                width: '100%', maxWidth: '40px',
                background: active ? 'var(--primary-600)' : 'var(--slate-200)',
                borderRadius: '4px 4px 0 0',
                position: 'relative',
                display: 'flex', justifyContent: 'center'
            }}
        >
            <span style={{ position: 'absolute', top: '-25px', fontSize: '0.8rem', fontWeight: 600, color: active ? 'var(--primary-600)' : 'var(--slate-500)' }}>{score}</span>
        </motion.div>
        <span style={{ fontSize: '0.8rem', color: 'var(--slate-500)' }}>{label}</span>
    </div>
);

const StatItem = ({ label, value }: any) => (
    <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '0.875rem', color: 'var(--slate-500)', marginBottom: '0.25rem' }}>{label}</div>
        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--slate-900)' }}>{value}</div>
    </div>
);
