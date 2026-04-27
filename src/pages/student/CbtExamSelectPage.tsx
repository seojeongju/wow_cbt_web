import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '../../layouts/MainLayout';
import { CbtService } from '../../services/cbtService';
import { CbtExam } from '../../types';

export const CbtExamSelectPage = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [exams, setExams] = useState<CbtExam[]>([]);

    useEffect(() => {
        const load = async () => {
            try {
                const data = await CbtService.getExamList();
                setExams(data);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const handleStart = async (examId: string) => {
        const res = await CbtService.startAttempt(examId);
        if (!res.success || !res.attempt) {
            alert(res.message || '응시 시작에 실패했습니다.');
            return;
        }
        navigate(`/student/cbt/exam/${examId}?attemptId=${res.attempt.id}`);
    };

    return (
        <MainLayout>
            <div style={{ marginBottom: '1rem' }}>
                <h1 style={{ fontSize: '1.7rem', fontWeight: 800 }}>CBT 필기시험 선택</h1>
            </div>

            {loading ? (
                <div style={{ padding: '2rem', textAlign: 'center' }}>로딩중...</div>
            ) : exams.length === 0 ? (
                <div className="glass-card" style={{ background: 'white', padding: '2rem' }}>
                    현재 응시 가능한 CBT 시험이 없습니다.
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
                    {exams.map(exam => (
                        <div key={exam.id} className="glass-card" style={{ background: 'white', padding: '1.25rem' }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem' }}>{exam.title}</h3>
                            <p style={{ color: 'var(--slate-600)', marginBottom: '0.75rem' }}>{exam.description || 'CBT 필기시험'}</p>
                            <div style={{ fontSize: '0.9rem', color: 'var(--slate-500)', marginBottom: '1rem' }}>
                                {exam.timeLimit}분 · {exam.questionCount}문항 · 합격기준 {exam.passScore}점
                            </div>
                            <button className="btn btn-primary" onClick={() => handleStart(exam.id)}>
                                응시 시작
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </MainLayout>
    );
};
