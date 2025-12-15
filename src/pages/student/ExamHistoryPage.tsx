import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Calendar, CheckCircle, XCircle } from 'lucide-react';
import { MainLayout } from '../../layouts/MainLayout';
import { ExamService } from '../../services/examService';
import { ExamResult } from '../../types';

export const ExamHistoryPage = () => {
    const navigate = useNavigate();
    const [history, setHistory] = useState<ExamResult[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        const data = await ExamService.getExamHistory();
        setHistory(data);
        setLoading(false);
    };

    return (
        <MainLayout>
            <div className="container" style={{ padding: '2rem 1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                    <button onClick={() => navigate('/student/dashboard')} style={{ display: 'flex', alignItems: 'center', color: 'var(--slate-500)' }}>
                        <ChevronLeft /> 뒤로가기
                    </button>
                    <h1 style={{ fontSize: '1.8rem', fontWeight: 700 }}>나의 학습 기록</h1>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '3rem' }}>로딩중...</div>
                ) : history.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', background: 'white', borderRadius: '1rem', boxShadow: 'var(--shadow-sm)' }}>
                        <div style={{ fontSize: '1.1rem', color: 'var(--slate-600)', marginBottom: '1rem' }}>아직 응시한 시험 기록이 없습니다.</div>
                        <button onClick={() => navigate('/student/practice')} className="btn btn-primary">
                            첫 시험으로 실력 쌓기
                        </button>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gap: '1rem' }}>
                        {history.map((record) => (
                            <div key={record.id} className="glass-card" style={{
                                padding: '1.5rem',
                                background: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                flexWrap: 'wrap',
                                gap: '1rem'
                            }}>
                                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                                    {/* Score Circle */}
                                    <div style={{
                                        width: '80px', height: '80px', borderRadius: '50%',
                                        background: record.passed ? 'var(--primary-50)' : '#fff1f2',
                                        color: record.passed ? 'var(--primary-600)' : '#e11d48',
                                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                        fontWeight: 800, fontSize: '1.5rem', border: `2px solid ${record.passed ? 'var(--primary-200)' : '#fecdd3'}`
                                    }}>
                                        {record.score}
                                        <span style={{ fontSize: '0.7rem', fontWeight: 500 }}>점</span>
                                    </div>

                                    <div>
                                        <div style={{ fontSize: '0.9rem', color: 'var(--slate-500)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                            <span style={{
                                                padding: '0.2rem 0.5rem',
                                                background: 'var(--slate-100)',
                                                borderRadius: '4px',
                                                fontSize: '0.75rem',
                                                fontWeight: 600,
                                                color: 'var(--slate-700)'
                                            }}>
                                                {record.courseName || '기타'}
                                            </span>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                                <Calendar size={14} /> {new Date(record.date).toLocaleDateString()}
                                            </div>
                                        </div>
                                        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.25rem' }}>{record.examTitle}</h3>
                                        <div style={{ display: 'flex', gap: '0.8rem', fontSize: '0.9rem', color: 'var(--slate-600)' }}>
                                            <span>총 {record.totalQuestions}문제</span>
                                            <span style={{ color: '#e11d48' }}>오답 {record.wrongCount}문제</span>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    {record.passed ? (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-600)', fontWeight: 700, fontSize: '1.1rem', background: '#ecfdf5', padding: '0.5rem 1rem', borderRadius: '2rem' }}>
                                            <CheckCircle size={20} /> 합격
                                        </div>
                                    ) : (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#e11d48', fontWeight: 700, fontSize: '1.1rem', background: '#fff1f2', padding: '0.5rem 1rem', borderRadius: '2rem' }}>
                                            <XCircle size={20} /> 불합격
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </MainLayout>
    );
};
