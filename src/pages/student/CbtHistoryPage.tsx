import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '../../layouts/MainLayout';
import { CbtService } from '../../services/cbtService';
import { CbtResult } from '../../types';

export const CbtHistoryPage = () => {
    const navigate = useNavigate();
    const [results, setResults] = useState<CbtResult[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const data = await CbtService.getMyResults();
                setResults(data);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    return (
        <MainLayout>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h1 style={{ fontSize: '1.7rem', fontWeight: 800 }}>CBT 응시 기록</h1>
                <button className="btn btn-secondary" onClick={() => navigate('/student/cbt/exams')}>다시 응시</button>
            </div>

            {loading ? (
                <div style={{ padding: '2rem', textAlign: 'center' }}>로딩중...</div>
            ) : results.length === 0 ? (
                <div className="glass-card" style={{ background: 'white', padding: '2rem' }}>CBT 응시 기록이 없습니다.</div>
            ) : (
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                    {results.map(r => (
                        <div key={r.id} className="glass-card" style={{ background: 'white', padding: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                                <div>
                                    <div style={{ fontWeight: 700 }}>{r.examTitle}</div>
                                    <div style={{ color: 'var(--slate-500)', fontSize: '0.9rem' }}>
                                        {new Date(r.submittedAt).toLocaleString()} · {r.totalQuestions}문항
                                    </div>
                                </div>
                                <div style={{ fontWeight: 800, color: r.passed ? '#15803d' : '#b91c1c' }}>
                                    {r.score}점 ({r.passed ? '합격' : '불합격'})
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </MainLayout>
    );
};
