import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Users, AlertTriangle, Award, Activity, BookOpen, Target, CheckCircle, XCircle, BarChart2 } from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import { AnalyticsService, type OverviewStats, type CourseStat, type CategoryStat, type StudentStat, type WeeklyTrend } from '../../services/analyticsService';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];

export const AnalyticsPage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'exams' | 'courses'>('overview');

    // Data States
    const [overview, setOverview] = useState<OverviewStats | null>(null);
    const [courseStats, setCourseStats] = useState<CourseStat[]>([]);
    const [categoryStats, setCategoryStats] = useState<CategoryStat[]>([]);
    const [studentStats, setStudentStats] = useState<{ topPerformers: StudentStat[], atRiskStudents: StudentStat[] }>({ topPerformers: [], atRiskStudents: [] });
    const [weeklyTrend, setWeeklyTrend] = useState<WeeklyTrend[]>([]);

    useEffect(() => {
        const loadData = async () => {
            try {
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
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh', flexDirection: 'column', gap: '1rem' }}>
                <div className="loading-spinner"></div>
                <span style={{ fontSize: '1.2rem', color: '#64748b' }}>데이터 분석 중...</span>
            </div>
        );
    }

    const passRate = overview?.passRate || 0;
    const avgScore = overview?.avgScore || 0;
    const totalExams = overview?.totalExams || 0;

    return (
        <div style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '3rem' }}>
            {/* Header */}
            <div style={{ marginBottom: '2rem' }}>
                <button onClick={() => navigate('/admin/dashboard')} style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    color: '#64748b', border: 'none', background: 'none', cursor: 'pointer', fontSize: '0.9rem', marginBottom: '1rem'
                }}>
                    <ChevronLeft size={18} /> 대시보드로 돌아가기
                </button>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.5rem' }}>
                            📊 통합 학습 분석 대시보드
                        </h2>
                        <p style={{ color: '#64748b' }}>
                            교육 현황을 실시간으로 모니터링하고, 데이터 기반 의사결정을 지원합니다
                        </p>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#94a3b8', textAlign: 'right' }}>
                        <div>마지막 업데이트</div>
                        <div style={{ fontWeight: 600, color: '#64748b' }}>{new Date().toLocaleString('ko-KR')}</div>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', borderBottom: '2px solid #f1f5f9' }}>
                {[
                    { id: 'overview', label: '전체 현황', icon: <BarChart2 size={18} /> },
                    { id: 'students', label: '학습자 분석', icon: <Users size={18} /> },
                    { id: 'exams', label: '시험 분석', icon: <BookOpen size={18} /> },
                    { id: 'courses', label: '과정 분석', icon: <Target size={18} /> }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        style={{
                            padding: '0.75rem 1.5rem',
                            border: 'none',
                            background: activeTab === tab.id ? '#6366f1' : 'transparent',
                            color: activeTab === tab.id ? 'white' : '#64748b',
                            fontWeight: 600,
                            cursor: 'pointer',
                            borderRadius: '0.5rem 0.5rem 0 0',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            transition: 'all 0.2s'
                        }}
                    >
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
                <>
                    {/* KPI Cards */}
                    <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
                        <KPICard
                            title="총 응시 횟수"
                            value={totalExams}
                            unit="회"
                            icon={<BookOpen size={24} />}
                            color="#6366f1"
                        />
                        <KPICard
                            title="전체 평균 점수"
                            value={Math.round(avgScore)}
                            unit="점"
                            icon={<Award size={24} />}
                            color={avgScore >= 70 ? "#10b981" : "#f59e0b"}
                        />
                        <KPICard
                            title="평균 합격률"
                            value={Math.round(passRate)}
                            unit="%"
                            icon={passRate >= 60 ? <CheckCircle size={24} /> : <XCircle size={24} />}
                            color={passRate >= 60 ? "#10b981" : "#ef4444"}
                        />
                        <KPICard
                            title="활성 학습자"
                            value={overview?.activeUsers || 0}
                            unit="명"
                            icon={<Users size={24} />}
                            color="#ec4899"
                            subtitle="최근 30일"
                        />
                    </section>

                    {/* Charts Row 1 */}
                    <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', gap: '2rem', marginBottom: '2.5rem' }}>
                        {/* Weekly Trend */}
                        <ChartCard title="📈 주간 학습 추이" subtitle="최근 7일간 응시 현황">
                            {weeklyTrend.length > 0 ? (
                                <ResponsiveContainer width="100%" height={300}>
                                    <AreaChart data={weeklyTrend}>
                                        <defs>
                                            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0.1} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="date" stroke="#94a3b8" style={{ fontSize: '0.85rem' }} />
                                        <YAxis allowDecimals={false} stroke="#94a3b8" style={{ fontSize: '0.85rem' }} />
                                        <Tooltip contentStyle={{ borderRadius: '0.75rem', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }} />
                                        <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorCount)" name="응시 횟수" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <EmptyState message="주간 학습 데이터가 없습니다" />
                            )}
                        </ChartCard>

                        {/* Course Performance */}
                        <ChartCard title="🎯 과정별 평균 성취도" subtitle="과정별 학습 효율성">
                            {courseStats.length > 0 ? (
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={courseStats} layout="vertical" margin={{ left: 90 }}>
                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                        <XAxis type="number" domain={[0, 100]} stroke="#94a3b8" />
                                        <YAxis type="category" dataKey="name" width={85} style={{ fontSize: '0.8rem' }} stroke="#94a3b8" />
                                        <Tooltip cursor={{ fill: 'rgba(99, 102, 241, 0.1)' }} contentStyle={{ borderRadius: '0.75rem', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }} />
                                        <Bar dataKey="avgScore" fill="#6366f1" radius={[0, 8, 8, 0]} barSize={24} name="평균 점수">
                                            {courseStats.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.avgScore >= 60 ? '#6366f1' : '#ef4444'} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <EmptyState message="과정별 데이터가 없습니다" />
                            )}
                        </ChartCard>
                    </section>

                    {/* Weakness Analysis */}
                    <section style={{ marginBottom: '2.5rem' }}>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <AlertTriangle color="#f59e0b" size={28} /> 취약점 집중 분석
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>
                            {/* Pie Chart */}
                            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                                <h4 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', color: '#475569' }}>카테고리별 오답 분포</h4>
                                <ResponsiveContainer width="100%" height={280}>
                                    <PieChart>
                                        <Pie
                                            data={categoryStats.slice(0, 6) as any[]}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={70}
                                            outerRadius={110}
                                            paddingAngle={3}
                                            dataKey="wrongCount"
                                            label={({ name, percent }: any) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                                            labelLine={{ stroke: '#94a3b8', strokeWidth: 1 }}
                                        >
                                            {categoryStats.map((_, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Top Weak Categories */}
                            <div style={{ background: 'white', padding: '1.5rem', borderRadius: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                                <h4 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem', color: '#ef4444' }}>🔥 집중 케어 필요 과목 TOP 5</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                                    {categoryStats.slice(0, 5).map((cat, idx) => (
                                        <div key={idx} style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            padding: '1rem', background: 'linear-gradient(135deg, #fef3f2 0%, #fff 100%)',
                                            borderRadius: '0.75rem', border: '1px solid #fee2e2'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <div style={{
                                                    width: '32px', height: '32px', borderRadius: '50%',
                                                    background: COLORS[idx % COLORS.length], color: 'white',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontSize: '0.9rem', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                                }}>{idx + 1}</div>
                                                <span style={{ fontWeight: 600, color: '#334155', fontSize: '0.95rem' }}>{cat.name}</span>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontSize: '1rem', color: '#ef4444', fontWeight: 700 }}>{cat.wrongCount}회</div>
                                                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>평균 {cat.score}점</div>
                                            </div>
                                        </div>
                                    ))}
                                    {categoryStats.length === 0 && <div style={{ color: '#94a3b8', textAlign: 'center', padding: '2rem' }}>데이터가 충분하지 않습니다</div>}
                                </div>
                            </div>
                        </div>
                    </section>
                </>
            )}

            {/* Students Tab */}
            {activeTab === 'students' && (
                <section>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '1.5rem' }}>
                        {/* Top Performers */}
                        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                            <h4 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.5rem', color: '#16a34a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Award size={22} /> 🏆 성적 우수자 TOP 5
                            </h4>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid #f1f5f9', textAlign: 'left', color: '#94a3b8', fontSize: '0.875rem' }}>
                                        <th style={{ padding: '0.75rem 0.5rem' }}>순위</th>
                                        <th style={{ padding: '0.75rem 0.5rem' }}>이름</th>
                                        <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>응시</th>
                                        <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>평균</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {studentStats.topPerformers.map((s, idx) => (
                                        <tr key={s.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                                            <td style={{ padding: '1rem 0.5rem' }}>
                                                <span style={{
                                                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                                    width: '28px', height: '28px', borderRadius: '50%',
                                                    background: idx === 0 ? '#fbbf24' : idx === 1 ? '#cbd5e1' : idx === 2 ? '#d97706' : '#f1f5f9',
                                                    color: idx < 3 ? 'white' : '#64748b', fontWeight: 700, fontSize: '0.85rem'
                                                }}>{idx + 1}</span>
                                            </td>
                                            <td style={{ padding: '1rem 0.5rem', fontWeight: 600, color: '#1e293b' }}>{s.name}</td>
                                            <td style={{ padding: '1rem 0.5rem', color: '#64748b', textAlign: 'center' }}>{s.examCount}회</td>
                                            <td style={{ padding: '1rem 0.5rem', color: '#16a34a', fontWeight: 700, fontSize: '1.05rem', textAlign: 'right' }}>{s.avgScore}점</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* At Risk */}
                        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                            <h4 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.5rem', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Activity size={22} /> ⚠️ 집중 관리 필요 대상
                            </h4>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: '2px solid #f1f5f9', textAlign: 'left', color: '#94a3b8', fontSize: '0.875rem' }}>
                                        <th style={{ padding: '0.75rem 0.5rem' }}>이름</th>
                                        <th style={{ padding: '0.75rem 0.5rem', textAlign: 'center' }}>응시</th>
                                        <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>평균</th>
                                        <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>상태</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {studentStats.atRiskStudents.length > 0 ? (
                                        studentStats.atRiskStudents.map((s) => (
                                            <tr key={s.id} style={{ borderBottom: '1px solid #f8fafc' }}>
                                                <td style={{ padding: '1rem 0.5rem', fontWeight: 600, color: '#1e293b' }}>{s.name}</td>
                                                <td style={{ padding: '1rem 0.5rem', color: '#64748b', textAlign: 'center' }}>{s.examCount}회</td>
                                                <td style={{ padding: '1rem 0.5rem', color: '#ef4444', fontWeight: 700, fontSize: '1.05rem', textAlign: 'right' }}>{s.avgScore}점</td>
                                                <td style={{ padding: '1rem 0.5rem', textAlign: 'right' }}>
                                                    <span style={{ padding: '0.25rem 0.75rem', background: '#fef2f2', color: '#dc2626', borderRadius: '1rem', fontSize: '0.8rem', fontWeight: 600 }}>
                                                        관리필요
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={4} style={{ padding: '3rem', textAlign: 'center' }}>
                                                <div style={{ color: '#10b981', fontSize: '2rem', marginBottom: '0.5rem' }}>🎉</div>
                                                <div style={{ color: '#64748b' }}>현재 집중 관리가 필요한 학습자가 없습니다</div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>
            )}

            {/* Exams Tab */}
            {activeTab === 'exams' && (
                <section>
                    <EmptyState
                        icon={<BookOpen size={64} color="#cbd5e1" />}
                        title="시험 상세 분석"
                        message="시험별 난이도, 문제 분석 등의 기능이 곧 추가됩니다"
                    />
                </section>
            )}

            {/* Courses Tab */}
            {activeTab === 'courses' && (
                <section>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>
                        {courseStats.map((course, idx) => (
                            <div key={idx} style={{
                                background: 'white', padding: '1.5rem', borderRadius: '1rem',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: '2px solid #f1f5f9'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                                    <div>
                                        <h4 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.25rem' }}>{course.name}</h4>
                                        <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>자격증 과정</p>
                                    </div>
                                    <div style={{
                                        padding: '0.5rem 1rem', background: course.avgScore >= 60 ? '#f0fdf4' : '#fef2f2',
                                        color: course.avgScore >= 60 ? '#16a34a' : '#dc2626',
                                        borderRadius: '1rem', fontSize: '1.1rem', fontWeight: 700
                                    }}>
                                        {course.avgScore}점
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1.5rem' }}>
                                    <MetricBox label="평균 점수" value={`${Math.round(course.avgScore)}점`} color="#6366f1" />
                                    <MetricBox label="합격률" value={`${Math.round((course.avgScore / 100) * 100) || 0}%`} color="#10b981" />
                                </div>
                            </div>
                        ))}
                        {courseStats.length === 0 && (
                            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                                등록된 과정이 없습니다
                            </div>
                        )}
                    </div>
                </section>
            )}
        </div>
    );
};

const KPICard = ({ title, value, unit, icon, color, trend, subtitle }: any) => (
    <div style={{
        background: 'white', padding: '1.5rem', borderRadius: '1rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: '2px solid #f8fafc', position: 'relative', overflow: 'hidden'
    }}>
        <div style={{
            position: 'absolute', top: -20, right: -20, width: '120px', height: '120px',
            borderRadius: '50%', background: `${color}10`, opacity: 0.5
        }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem', position: 'relative' }}>
            <div style={{ padding: '0.875rem', borderRadius: '0.875rem', background: `${color}15`, color: color }}>
                {icon}
            </div>
            {trend && (
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '0.25rem',
                    color: trend.isUp ? '#10b981' : '#ef4444', fontSize: '0.85rem', fontWeight: 600
                }}>
                    {trend.isUp ? '↑' : '↓'} {trend.value}%
                </div>
            )}
        </div>
        <div style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '0.5rem' }}>{title}</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
            <span style={{ fontSize: '2rem', fontWeight: 800, color: '#1e293b' }}>{value}</span>
            <span style={{ fontSize: '1.1rem', fontWeight: 600, color: '#94a3b8' }}>{unit}</span>
        </div>
        {subtitle && <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.25rem' }}>{subtitle}</div>}
    </div>
);

const ChartCard = ({ title, subtitle, children }: any) => (
    <div style={{ background: 'white', padding: '1.5rem', borderRadius: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
        <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.25rem' }}>{title}</h4>
            {subtitle && <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>{subtitle}</p>}
        </div>
        {children}
    </div>
);

const MetricBox = ({ label, value, color }: any) => (
    <div style={{ padding: '0.875rem', background: '#f8fafc', borderRadius: '0.75rem', border: '1px solid #f1f5f9' }}>
        <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.25rem' }}>{label}</div>
        <div style={{ fontSize: '1.25rem', fontWeight: 700, color: color }}>{value}</div>
    </div>
);

const EmptyState = ({ icon, title, message }: { icon?: React.ReactNode, title?: string, message: string }) => (
    <div style={{
        background: 'white', padding: '4rem 2rem', borderRadius: '1rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)', textAlign: 'center'
    }}>
        {icon && <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'center' }}>{icon}</div>}
        {title && <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b', marginBottom: '0.75rem' }}>{title}</h3>}
        <p style={{ color: '#94a3b8', fontSize: '1rem', lineHeight: 1.6 }}>{message}</p>
    </div>
);
