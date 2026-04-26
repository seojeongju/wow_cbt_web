import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, TrendingUp, Award, AlertCircle, CheckCircle, BarChart2 } from 'lucide-react';
import { MainLayout } from '../../layouts/MainLayout';
import { ExamService } from '../../services/examService';
import { ExamResult } from '../../types';

export const StudentAnalyticsPage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [history, setHistory] = useState<ExamResult[]>([]);
    // const [wrongProblems, setWrongProblems] = useState<WrongProblem[]>([]);
    const [stats, setStats] = useState({
        avgScore: 0,
        maxScore: 0,
        passRate: 0,
        totalExams: 0,
        weakestCategory: '분석 중...'
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [historyData, wrongData] = await Promise.all([
                ExamService.getExamHistory(),
                ExamService.getWrongProblems()
            ]);

            setHistory(historyData);
            setHistory(historyData);
            // setWrongProblems(wrongData);

            // Calculate Stats
            if (historyData.length > 0) {
                const scores = historyData.map(h => h.score);
                const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
                const max = Math.max(...scores);
                const passed = historyData.filter(h => h.passed).length;
                const rate = Math.round((passed / historyData.length) * 100);

                // Category Analysis
                const categoryCounts: { [key: string]: number } = {};
                wrongData.forEach(p => {
                    const cat = p.question.category || '기타';
                    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
                });

                let maxWrong = 0;
                let weakCat = '없음';
                Object.entries(categoryCounts).forEach(([cat, count]) => {
                    if (count > maxWrong) {
                        maxWrong = count;
                        weakCat = cat;
                    }
                });

                setStats({
                    avgScore: avg,
                    maxScore: max,
                    passRate: rate,
                    totalExams: historyData.length,
                    weakestCategory: weakCat
                });
            }
        } catch (error) {
            console.error('Analytics load error:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <MainLayout>
                <div className="container flex-center" style={{ height: '60vh' }}>
                    <div>분석 데이터를 불러오는 중...</div>
                </div>
            </MainLayout>
        );
    }

    // Prepare Chart Data (Last 10 exams)
    const recentHistory = [...history].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(-10);

    return (
        <MainLayout>
            <div className="container" style={{ padding: '2rem 1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                    <button onClick={() => navigate('/student/dashboard')} style={{ display: 'flex', alignItems: 'center', color: 'var(--slate-500)' }}>
                        <ChevronLeft /> 뒤로가기
                    </button>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 700 }}>성적 분석</h1>
                </div>

                {/* Summary Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
                    <StatCard
                        label="평균 점수"
                        value={`${stats.avgScore}점`}
                        icon={<BarChart2 size={24} color="#6366f1" />}
                        sub={`최고 점수: ${stats.maxScore}점`}
                        bg="#e0e7ff"
                    />
                    <StatCard
                        label="합격률"
                        value={`${stats.passRate}%`}
                        icon={<Award size={24} color="#10b981" />}
                        sub={`총 ${stats.totalExams}회 응시`}
                        bg="#d1fae5"
                    />
                    <StatCard
                        label="취약 유형"
                        value={stats.weakestCategory}
                        icon={<AlertCircle size={24} color="#f59e0b" />}
                        sub="오답이 가장 많은 과목"
                        bg="#fef3c7"
                    />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>

                    {/* Recent Score Trend Chart */}
                    <div className="glass-card" style={{ padding: '2rem', background: 'white' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <TrendingUp size={20} color="#6366f1" /> 최근 성적 흐름
                        </h3>

                        <div style={{ height: '250px', display: 'flex', alignItems: 'flex-end', gap: '1rem', paddingBottom: '2rem', borderBottom: '1px solid #e2e8f0' }}>
                            {recentHistory.length > 0 ? recentHistory.map((exam, idx) => (
                                <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                                    <div
                                        style={{
                                            width: '100%',
                                            maxWidth: '40px',
                                            height: `${Math.max(exam.score * 2, 4)}px`, // Scale for visual
                                            background: exam.passed ? 'var(--primary-400)' : '#fca5a5',
                                            borderRadius: '4px 4px 0 0',
                                            transition: 'height 0.5s ease',
                                            position: 'relative'
                                        }}
                                        title={`${exam.score}점`}
                                    >
                                        <div style={{ position: 'absolute', top: '-25px', width: '100%', textAlign: 'center', fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>
                                            {exam.score}
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', transform: 'rotate(-45deg)', marginTop: '0.5rem', whiteSpace: 'nowrap' }}>
                                        {new Date(exam.date).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' })}
                                    </div>
                                </div>
                            )) : (
                                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                                    데이터가 없습니다.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Pass/Fail Distribution */}
                    <div className="glass-card" style={{ padding: '2rem', background: 'white' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <CheckCircle size={20} color="#10b981" /> 합격 분석
                        </h3>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '250px' }}>
                            {stats.totalExams > 0 ? (
                                <div style={{ position: 'relative', width: '200px', height: '200px', borderRadius: '50%', background: `conic-gradient(#10b981 0% ${stats.passRate}%, #fca5a5 ${stats.passRate}% 100%)` }}>
                                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '160px', height: '160px', background: 'white', borderRadius: '50%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                        <div style={{ fontSize: '2rem', fontWeight: 800, color: '#1e293b' }}>{stats.passRate}%</div>
                                        <div style={{ fontSize: '0.9rem', color: '#64748b' }}>합격률</div>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ color: '#94a3b8' }}>데이터가 없습니다.</div>
                            )}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', marginTop: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <div style={{ width: '12px', height: '12px', background: '#10b981', borderRadius: '50%' }} />
                                <span>합격</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <div style={{ width: '12px', height: '12px', background: '#fca5a5', borderRadius: '50%' }} />
                                <span>불합격</span>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </MainLayout>
    );
};

const StatCard = ({ label, value, icon, sub, bg }: any) => (
    <div style={{ background: 'white', padding: '1.5rem', borderRadius: '1.25rem', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <div style={{ width: '56px', height: '56px', borderRadius: '1rem', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {icon}
        </div>
        <div>
            <div style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 500, marginBottom: '0.25rem' }}>{label}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e293b', lineHeight: 1.2 }}>{value}</div>
            {sub && <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.25rem' }}>{sub}</div>}
        </div>
    </div>
);
