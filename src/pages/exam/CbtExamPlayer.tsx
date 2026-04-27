import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Timer } from '../../components/exam/Timer';
import { OMRGrid } from '../../components/exam/OMRGrid';
import { CbtService } from '../../services/cbtService';
import { CbtAttempt, CbtExamQuestion } from '../../types';

export const CbtExamPlayer = () => {
    const { examId } = useParams<{ examId: string }>();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const attemptId = searchParams.get('attemptId');

    const [loading, setLoading] = useState(true);
    const [title, setTitle] = useState('');
    const [timeLimit, setTimeLimit] = useState(60);
    const [questions, setQuestions] = useState<CbtExamQuestion[]>([]);
    const [attempt, setAttempt] = useState<CbtAttempt | null>(null);
    const [currentIdx, setCurrentIdx] = useState(0);
    const [answers, setAnswers] = useState<{ [key: string]: number | string }>({});

    useEffect(() => {
        const load = async () => {
            if (!examId || !attemptId) {
                alert('잘못된 접근입니다.');
                navigate('/student/cbt/exams');
                return;
            }
            const [exam, at] = await Promise.all([
                CbtService.getExamById(examId),
                CbtService.getAttemptById(attemptId)
            ]);

            if (!exam || !at) {
                alert('CBT 시험 정보를 불러올 수 없습니다.');
                navigate('/student/cbt/exams');
                return;
            }
            if (at.status !== 'in_progress') {
                navigate('/student/cbt/history');
                return;
            }

            setTitle(exam.title);
            setTimeLimit(exam.timeLimit);
            setQuestions(exam.questions);
            setAttempt(at);
            setAnswers(at.answers || {});
            setLoading(false);
        };
        load();
    }, [examId, attemptId, navigate]);

    useEffect(() => {
        if (!attemptId) return;
        const interval = setInterval(() => {
            CbtService.saveAnswers(attemptId, answers);
        }, 15000);
        return () => clearInterval(interval);
    }, [attemptId, answers]);

    const question = useMemo(() => questions[currentIdx], [questions, currentIdx]);

    const handleAnswer = (value: number | string) => {
        if (!question) return;
        setAnswers(prev => ({ ...prev, [question.id]: value }));
    };

    const submit = async () => {
        if (!attemptId) return;
        await CbtService.saveAnswers(attemptId, answers);
        const res = await CbtService.submitAttempt(attemptId);
        if (!res.success) {
            alert(res.message || '제출에 실패했습니다.');
            return;
        }
        alert(`제출 완료: ${res.result?.score ?? 0}점`);
        navigate('/student/cbt/history');
    };

    if (loading) return <div className="flex-center" style={{ height: '100vh' }}>CBT 시험 준비중...</div>;
    if (!attempt || !question) return null;

    return (
        <div style={{ minHeight: '100vh', background: 'var(--slate-50)', paddingBottom: '2rem' }}>
            <header style={{ background: 'white', borderBottom: '1px solid var(--slate-200)', padding: '1rem 0', position: 'sticky', top: 0, zIndex: 10 }}>
                <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ fontWeight: 700 }}>{title}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Timer initialTime={timeLimit} onTimeUp={submit} />
                        <button className="btn btn-accent" onClick={submit}>제출하기</button>
                    </div>
                </div>
            </header>

            <main className="container" style={{ marginTop: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 280px', gap: '1rem' }}>
                <div className="glass-card" style={{ padding: '1.5rem', background: 'white' }}>
                    <div style={{ marginBottom: '0.5rem', color: 'var(--slate-500)' }}>{currentIdx + 1}번</div>
                    <h2 style={{ marginBottom: '1rem' }}>{question.text}</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {(question.options || []).map((opt, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleAnswer(idx)}
                                style={{
                                    padding: '0.8rem',
                                    borderRadius: '0.6rem',
                                    border: answers[question.id] === idx ? '2px solid var(--primary-600)' : '1px solid var(--slate-200)',
                                    background: answers[question.id] === idx ? 'var(--primary-50)' : 'white',
                                    textAlign: 'left'
                                }}
                            >
                                {idx + 1}. {opt}
                            </button>
                        ))}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
                        <button className="btn btn-secondary" onClick={() => setCurrentIdx(v => Math.max(0, v - 1))}>이전</button>
                        <button className="btn btn-primary" onClick={() => setCurrentIdx(v => Math.min(questions.length - 1, v + 1))}>다음</button>
                    </div>
                </div>
                <OMRGrid questions={questions} answers={answers} current={currentIdx} onJump={setCurrentIdx} />
            </main>
        </div>
    );
};
