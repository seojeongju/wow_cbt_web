import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Trash2, Eye, EyeOff, CheckCircle, XCircle, AlertCircle, RefreshCw, PlayCircle } from 'lucide-react';
import { MainLayout } from '../../layouts/MainLayout';
import { ExamService } from '../../services/examService';
import { WrongProblem } from '../../types';

export const WrongAnswerNote = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [problems, setProblems] = useState<WrongProblem[]>([]);
    const [visibleExplanations, setVisibleExplanations] = useState<{ [key: string]: boolean }>({});

    useEffect(() => {
        loadWrongProblems();
    }, []);

    const loadWrongProblems = async () => {
        setLoading(true);
        try {
            const data = await ExamService.getWrongProblems();
            // Sort by date desc
            const sorted = data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setProblems(sorted);
        } catch (error) {
            console.error('Failed to load wrong problems', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRemove = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm('이 문제를 오답노트에서 삭제하시겠습니까?')) {
            await ExamService.removeWrongProblem(id);
            setProblems(prev => prev.filter(p => p.id !== id));
        }
    };

    const toggleExplanation = (id: string) => {
        setVisibleExplanations(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const handleReviewExam = () => {
        if (problems.length === 0) return;
        const examId = ExamService.createWrongAnswerExam(problems);
        if (window.confirm('오답 문제들로 구성된 복습 테스트를 시작하시겠습니까?\n테스트 도중 맞춘 문제는 오답노트에서 자동으로 삭제됩니다.')) {
            navigate(`/exam/${examId}`);
        }
    };

    if (loading) {
        return (
            <MainLayout>
                <div className="container flex-center" style={{ height: '60vh' }}>
                    <div style={{ textAlign: 'center', color: 'var(--slate-500)' }}>
                        <RefreshCw className="spin" size={32} style={{ marginBottom: '1rem' }} />
                        <p>오답 노트를 불러오는 중...</p>
                    </div>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="container" style={{ padding: '2rem 1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <button onClick={() => navigate('/student/dashboard')} style={{ display: 'flex', alignItems: 'center', color: 'var(--slate-500)' }}>
                            <ChevronLeft /> 뒤로가기
                        </button>
                        <h1 style={{ fontSize: '1.8rem', fontWeight: 700 }}>
                            오답 노트
                            <span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--slate-500)', marginLeft: '0.75rem' }}>
                                총 {problems.length}문제
                            </span>
                        </h1>
                    </div>
                    {problems.length > 0 && (
                        <button
                            onClick={handleReviewExam}
                            className="btn btn-primary"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                            <PlayCircle size={20} /> 오답 문제로 시험보기
                        </button>
                    )}
                </div>

                {problems.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '4rem 2rem', background: 'white', borderRadius: '1rem', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                        <CheckCircle size={64} color="var(--primary-300)" style={{ margin: '0 auto 1.5rem' }} />
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--slate-800)' }}>
                            오답 노트가 비어있습니다!
                        </h3>
                        <p style={{ color: 'var(--slate-500)' }}>
                            모든 문제를 완벽하게 이해하셨군요. 훌륭합니다! 🎉
                        </p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {problems.map((item) => {
                            const isExpanded = visibleExplanations[item.id];
                            return (
                                <div key={item.id} className="glass-card" style={{ padding: '2rem', background: 'white', position: 'relative' }}>
                                    {/* Header: Date and Controls */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', borderBottom: '1px solid var(--slate-100)', paddingBottom: '1rem' }}>
                                        <div style={{ fontSize: '0.9rem', color: 'var(--slate-500)' }}>
                                            발생일: {new Date(item.date).toLocaleDateString()}
                                        </div>
                                        <button
                                            onClick={(e) => handleRemove(item.id, e)}
                                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444', fontSize: '0.9rem' }}
                                        >
                                            <Trash2 size={16} /> 삭제
                                        </button>
                                    </div>

                                    {/* Question */}
                                    <div style={{ marginBottom: '2rem' }}>
                                        {item.question.category !== 'AI 추출' && (
                                            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                                <span style={{
                                                    padding: '0.25rem 0.5rem',
                                                    background: 'var(--slate-100)',
                                                    borderRadius: '4px',
                                                    fontSize: '0.8rem',
                                                    fontWeight: 600,
                                                    color: 'var(--slate-600)'
                                                }}>
                                                    {item.question.category || '기타'}
                                                </span>
                                            </div>
                                        )}
                                        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, lineHeight: 1.5, marginBottom: '1rem' }}>
                                            {item.question.text}
                                        </h3>
                                        {item.question.imageUrl && (
                                            <img
                                                src={item.question.imageUrl}
                                                alt="Question"
                                                style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '0.5rem', border: '1px solid var(--slate-200)', marginBottom: '1rem' }}
                                            />
                                        )}
                                    </div>

                                    {/* Options & Answers */}
                                    <div style={{ display: 'grid', gap: '0.75rem', marginBottom: '1.5rem' }}>
                                        {item.question.options?.map((opt, idx) => {
                                            const isUserWrong = item.wrongAnswer === idx;
                                            const isCorrect = item.question.correctAnswer === idx;

                                            let style = {
                                                padding: '1rem',
                                                borderRadius: '0.5rem',
                                                border: '1px solid var(--slate-200)',
                                                background: 'white',
                                                color: 'var(--slate-700)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '1rem'
                                            };

                                            if (isUserWrong) {
                                                style = { ...style, border: '1px solid #fca5a5', background: '#fef2f2', color: '#b91c1c' };
                                            } else if (isCorrect && isExpanded) {
                                                style = { ...style, border: '1px solid #86efac', background: '#f0fdf4', color: '#15803d' };
                                            }

                                            return (
                                                <div key={idx} style={style}>
                                                    <span style={{ fontWeight: 700, minWidth: '24px' }}>{idx + 1}</span>
                                                    <span>{opt}</span>
                                                    {isUserWrong && <XCircle size={20} style={{ marginLeft: 'auto' }} />}
                                                    {isCorrect && isExpanded && <CheckCircle size={20} style={{ marginLeft: 'auto' }} />}
                                                </div>
                                            );
                                        })}

                                        {/* Subjective Answer Display */}
                                        {(!item.question.options || item.question.options.length === 0) && (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                                <div style={{ padding: '1rem', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '0.5rem', color: '#b91c1c' }}>
                                                    <strong>내 답안:</strong> {item.wrongAnswer || '(미입력)'}
                                                </div>
                                                {isExpanded && (
                                                    <div style={{ padding: '1rem', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '0.5rem', color: '#15803d' }}>
                                                        <strong>정답:</strong> {item.question.correctAnswer}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Explanation Toggle */}
                                    <div>
                                        {!isExpanded ? (
                                            <button
                                                onClick={() => toggleExplanation(item.id)}
                                                className="btn btn-outline"
                                                style={{ width: '100%', justifyContent: 'center' }}
                                            >
                                                <Eye size={16} /> 정답 및 해설 보기
                                            </button>
                                        ) : (
                                            <div className="glass-card" style={{ background: 'var(--primary-50)', border: 'none', padding: '1.5rem' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                                    <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary-800)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        <AlertCircle size={18} /> 해설
                                                    </h4>
                                                    <button onClick={() => toggleExplanation(item.id)} style={{ color: 'var(--slate-500)', display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.85rem' }}>
                                                        <EyeOff size={14} /> 접기
                                                    </button>
                                                </div>
                                                <p style={{ lineHeight: 1.6, color: 'var(--primary-900)' }}>
                                                    {item.question.explanation || '해설이 제공되지 않는 문제입니다.'}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </MainLayout>
    );
};
