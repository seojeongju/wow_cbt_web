import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, TrendingUp, Users, AlertTriangle, Award, Activity } from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import { AnalyticsService, type OverviewStats, type CourseStat, type CategoryStat, type StudentStat, type WeeklyTrend } from '../../services/analyticsService';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export const AnalyticsPage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);

    // Data States
    const [overview, setOverview] = useState<OverviewStats | null>(null);
    const [courseStats, setCourseStats] = useState<CourseStat[]>([]);
    const [categoryStats, setCategoryStats] = useState<CategoryStat[]>([]);
    const [studentStats, setStudentStats] = useState<{ topPerformers: StudentStat[], atRiskStudents: StudentStat[] }>({ topPerformers: [], atRiskStudents: [] });
    const [weeklyTrend, setWeeklyTrend] = useState<WeeklyTrend[]>([]);

    useEffect(() => {
        const loadData = async () => {
            try {
                // const history = await AnalyticsService.getGlobalExamHistory(); // Not used currently
                // const wrongProblems: any[] = []; 

                await AnalyticsService.getGlobalExamHistory(); // Just trigger if needed? No, purely get.
                // Actually, if we don't uses them, don't call them.
                // But AnalyticsService caches? No.
                // Just remove them.
                setOverview(await AnalyticsService.getOverviewStats());
                setCourseStats(await AnalyticsService.getCoursePerformance());
                setCategoryStats(await AnalyticsService.getCategoryPerformance());
                setStudentStats(await AnalyticsService.getStudentPerformance());
                setWeeklyTrend(await AnalyticsService.getWeeklyTrend());

                setLoading(false);
            } catch (error) {
                console.error("Failed to load analytics:", error);
                setLoading(false);
            }
        };
        loadData();
    }, []);

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                <div className="loading-spinner"></div>
                <span style={{ marginLeft: '1rem', fontSize: '1.2rem', color: '#64748b' }}>데이터 분석 중...</span>
            </div>
        );
    }

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '3rem' }}>
            {/* Header */}
            <div style={{ marginBottom: '2rem' }}>
                <button onClick={() => navigate('/admin/dashboard')} style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    color: '#64748b', border: 'none', background: 'none', cursor: 'pointer', fontSize: '0.9rem', marginBottom: '1rem'
                }}>
                    <ChevronLeft size={18} /> 대시보드로 돌아가기
                </button>
                <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#1e293b' }}>
                    📈 학습 데이터 분석
                </h2>
                <p style={{ color: '#64748b', marginTop: '0.5rem' }}>
                    교육센터의 전체 학습 현황과 성취도를 심층 분석합니다.
                </p>
            </div>

            {/* 1. Overview Cards */}
            <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
                <StatCard
                    title="총 응시 횟수"
                    value={`${overview?.totalExams || 0}회`}
                    icon={<FileTextIcon />}
                    color="#3b82f6"
                />
                <StatCard
                    title="전체 평균 점수"
                    value={`${overview?.avgScore || 0}점`}
                    icon={<Award size={24} />}
                    color={overview?.avgScore && overview.avgScore >= 70 ? "#10b981" : "#f59e0b"}
                />
                <StatCard
                    title="평균 합격률"
                    value={`${overview?.passRate || 0}%`}
                    icon={<TrendingUp size={24} />}
                    color="#8b5cf6"
                />
                <StatCard
                    title="활성 학습자"
                    value={`${overview?.activeUsers || 0}명`}
                    sub="(최근 30일)"
                    icon={<Users size={24} />}
                    color="#ec4899"
                />
            </section>

            {/* 2. Charts Row 1: Trends & Course Performance */}
            <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '2rem', marginBottom: '2.5rem' }}>
                {/* Weekly Trend */}
                <ChartCard title="주간 학습 추이 (최근 7일)">
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={weeklyTrend}>
                            <defs>
                                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="date" />
                            <YAxis allowDecimals={false} />
                            <Tooltip contentStyle={{ borderRadius: '0.5rem', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                            <Area type="monotone" dataKey="count" stroke="#8884d8" fillOpacity={1} fill="url(#colorCount)" name="응시 횟수" />
                        </AreaChart>
                    </ResponsiveContainer>
                </ChartCard>

                {/* Course Performance */}
                <ChartCard title="과정별 평균 성취도">
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={courseStats} layout="vertical" margin={{ left: 40 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                            <XAxis type="number" domain={[0, 100]} />
                            <YAxis type="category" dataKey="name" width={100} style={{ fontSize: '0.8rem' }} />
                            <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '0.5rem' }} />
                            <Bar dataKey="avgScore" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} name="평균 점수" >
                                {courseStats.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.avgScore >= 60 ? '#3b82f6' : '#ef4444'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </ChartCard>
            </section>

            {/* 3. Weakness Analysis */}
            <section style={{ marginBottom: '2.5rem' }}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertTriangle color="#f59e0b" /> 취약 카테고리 분석
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                    <div style={{ background: 'white', padding: '1.5rem', borderRadius: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                        <h4 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', color: '#475569' }}>카테고리별 오답 비율</h4>
                        <div style={{ height: '300px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={categoryStats.slice(0, 5) as any[]} // Show top 5 weakness
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="wrongCount"
                                    >
                                        {categoryStats.map((_, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend layout="vertical" verticalAlign="middle" align="right" />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div style={{ background: 'white', padding: '1.5rem', borderRadius: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                        <h4 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', color: '#475569' }}>집중 케어 필요 과목 (오답 많은 순)</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {categoryStats.slice(0, 5).map((cat, idx) => (
                                <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: '#f8fafc', borderRadius: '0.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: COLORS[idx % COLORS.length], color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold' }}>{idx + 1}</div>
                                        <span style={{ fontWeight: 600, color: '#334155' }}>{cat.name}</span>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '0.9rem', color: '#ef4444', fontWeight: 700 }}>{cat.wrongCount}회 오답</div>
                                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>난이도 점수: {cat.score}점</div>
                                    </div>
                                </div>
                            ))}
                            {categoryStats.length === 0 && <div style={{ color: '#94a3b8', textAlign: 'center' }}>데이터가 충분하지 않습니다.</div>}
                        </div>
                    </div>
                </div>
            </section>

            {/* 4. Student Performance */}
            <section>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Users color="#6366f1" /> 학습자 분석
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
                    {/* Top Performers */}
                    <div style={{ background: 'white', padding: '1.5rem', borderRadius: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                        <h4 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', color: '#16a34a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Award size={20} /> 성적 우수자 TOP 5
                        </h4>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid #f1f5f9', textAlign: 'left', color: '#94a3b8', fontSize: '0.875rem' }}>
                                    <th style={{ padding: '0.5rem' }}>이름</th>
                                    <th style={{ padding: '0.5rem' }}>응시 횟수</th>
                                    <th style={{ padding: '0.5rem' }}>평균 점수</th>
                                </tr>
                            </thead>
                            <tbody>
                                {studentStats.topPerformers.map((s) => (
                                    <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>{s.name}</td>
                                        <td style={{ padding: '0.75rem 0.5rem', color: '#64748b' }}>{s.examCount}회</td>
                                        <td style={{ padding: '0.75rem 0.5rem', color: '#16a34a', fontWeight: 700 }}>{s.avgScore}점</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* At Risk */}
                    <div style={{ background: 'white', padding: '1.5rem', borderRadius: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                        <h4 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Activity size={20} /> 집중 관리 필요 대상
                        </h4>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid #f1f5f9', textAlign: 'left', color: '#94a3b8', fontSize: '0.875rem' }}>
                                    <th style={{ padding: '0.5rem' }}>이름</th>
                                    <th style={{ padding: '0.5rem' }}>응시 횟수</th>
                                    <th style={{ padding: '0.5rem' }}>평균 점수</th>
                                </tr>
                            </thead>
                            <tbody>
                                {studentStats.atRiskStudents.length > 0 ? (
                                    studentStats.atRiskStudents.map((s) => (
                                        <tr key={s.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                            <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>{s.name}</td>
                                            <td style={{ padding: '0.75rem 0.5rem', color: '#64748b' }}>{s.examCount}회</td>
                                            <td style={{ padding: '0.75rem 0.5rem', color: '#ef4444', fontWeight: 700 }}>{s.avgScore}점</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={3} style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                                            현재 관리 필요 학생이 없습니다. 🎉
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>
        </div>
    );
};

const StatCard = ({ title, value, sub, icon, color }: any) => (
    <div style={{ background: 'white', padding: '1.5rem', borderRadius: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #f1f5f9' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
            <div style={{ padding: '0.75rem', borderRadius: '0.75rem', background: `${color}15`, color: color }}>
                {icon}
            </div>
            {sub && <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{sub}</span>}
        </div>
        <div style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '0.25rem' }}>{title}</div>
        <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1e293b' }}>{value}</div>
    </div>
);

const ChartCard = ({ title, children }: any) => (
    <div style={{ background: 'white', padding: '1.5rem', borderRadius: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h4 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1.5rem', color: '#1e293b' }}>{title}</h4>
        {children}
    </div>
);

const FileTextIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /></svg>
);
