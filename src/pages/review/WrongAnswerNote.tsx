import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, CheckCircle, Trash2, ChevronDown, ChevronUp, Play, ArrowRight, XCircle, RotateCcw } from 'lucide-react';
import { MainLayout } from '../../layouts/MainLayout';
import { ExamService } from '../../services/examService';
import { WrongProblem } from '../../types';

export const WrongAnswerNote = () => {
    const [problems, setProblems] = useState<WrongProblem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isQuizMode, setIsQuizMode] = useState(false);

    const loadData = async () => {
        try {
            const data = await ExamService.getWrongProblems();
            setProblems(data);
        } catch (error) {
            console.error('Failed to load wrong problems', error);
            // Fallback or empty
            setProblems([]);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleRemove = async (id: string) => {
        if (confirm('정말 삭제하시겠습니까?')) {
            try {
                await ExamService.removeWrongProblem(id);
                setProblems(prev => prev.filter(p => p.id !== id));
            } catch (error) {
                console.error('Failed to remove wrong problem', error);
                alert('삭제 중 오류가 발생했습니다.');
            }
        }
    };

    if (loading) return (
        <MainLayout>
            <div className="flex-center" style={{ height: '50vh' }}>로딩 중...</div>
        </MainLayout>
    );

    return (
        <MainLayout>
            {isQuizMode ? (
                <QuizView
                    problems={problems}
                    onExit={() => setIsQuizMode(false)}
                    onRemove={handleRemove}
                />
            ) : (
                <>
                    <section style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                        <div>
                            <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>오답 노트 📝</h1>
                            <p style={{ color: 'var(--slate-500)' }}>
                                총 <span style={{ color: 'var(--accent-600)', fontWeight: 700 }}>{problems.length}</span>개의 복습할 문제가 있습니다.
                            </p>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button onClick={loadData} className="btn btn-secondary">새로고침</button>
                            {problems.length > 0 && (
                                <button
                                    onClick={() => setIsQuizMode(true)}
                                    className="btn btn-primary"
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                >
                                    <Play size={20} /> 전체 다시 풀기
                                </button>
                            )}
                        </div>
                    </section>

                    {problems.length === 0 ? (
                        <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--slate-400)', background: 'white', borderRadius: '1rem' }}>
                            <CheckCircle size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                            <p>등록된 오답이 없습니다. 완벽하시네요! 🎉</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            {problems.map((item) => (
                                <NoteItem key={item.id} item={item} onRemove={() => {
                                    if (confirm('이 문제를 오답 노트에서 삭제하시겠습니까?')) handleRemove(item.id);
                                }} />
                            ))}
                        </div>
                    )}
                </>
            )}
        </MainLayout>
    );
};

const QuizView = ({ problems, onExit, onRemove }: { problems: WrongProblem[], onExit: () => void, onRemove: (id: string) => void }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const [showResult, setShowResult] = useState(false);
    const [correctCount, setCorrectCount] = useState(0);

    const currentProblem = problems[currentIndex];

    const handleAnswer = (idx: number) => {
        if (isAnswered) return;
        setSelectedAnswer(idx);
        setIsAnswered(true);

        if (idx === currentProblem.question.correctAnswer) {
            setCorrectCount(prev => prev + 1);
        }
    };

    const handleNext = () => {
        if (currentIndex < problems.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setSelectedAnswer(null);
            setIsAnswered(false);
        } else {
            setShowResult(true);
        }
    };

    const handleRemoveCurrent = () => {
        if (confirm('이 문제를 오답노트에서 삭제하시겠습니까?')) {
            onRemove(currentProblem.id);
            // If it was the last problem, finish
            if (problems.length === 1) {
                onExit();
                return;
            }
            // Move to next if available, or finish
            handleNext();
        }
    };

    if (showResult) {
        return (
            <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', background: 'white', maxWidth: '600px', margin: '2rem auto' }}>
                <CheckCircle size={64} color="#10b981" style={{ marginBottom: '1.5rem' }} />
                <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '1rem' }}>복습 완료!</h2>
                <p style={{ fontSize: '1.2rem', color: 'var(--slate-600)', marginBottom: '2rem' }}>
                    총 {problems.length}문제 중 <span style={{ color: '#10b981', fontWeight: 700 }}>{correctCount}</span>문제를 맞추셨습니다.
                </p>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                    <button onClick={onExit} className="btn btn-secondary">목록으로 돌아가기</button>
                    <button onClick={() => window.location.reload()} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <RotateCcw size={18} /> 다시 풀기
                    </button>
                </div>
            </div>
        );
    }

    if (!currentProblem) return null;

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'center' }}>
                <button onClick={onExit} style={{ background: 'none', border: 'none', color: 'var(--slate-500)', cursor: 'pointer', display: 'flex', gap: '0.5rem' }}>
                    <ArrowRight style={{ transform: 'rotate(180deg)' }} /> 나가기
                </button>
                <div style={{ fontWeight: 700, color: 'var(--primary-600)' }}>
                    문제 {currentIndex + 1} / {problems.length}
                </div>
            </div>

            <div className="glass-card" style={{ padding: '2rem', background: 'white' }}>
                <span style={{ display: 'inline-block', padding: '0.25rem 0.75rem', borderRadius: '1rem', background: 'var(--slate-100)', fontSize: '0.8rem', color: 'var(--slate-600)', marginBottom: '1rem' }}>
                    {currentProblem.question.category}
                </span>

                <h3 style={{ fontSize: '1.25rem', lineHeight: '1.6', marginBottom: '1.5rem', fontWeight: 600 }}>
                    {currentProblem.question.text}
                </h3>

                {currentProblem.question.imageUrl && (
                    <div style={{ marginBottom: '1.5rem', borderRadius: '0.5rem', overflow: 'hidden', border: '1px solid var(--slate-200)' }}>
                        <img src={currentProblem.question.imageUrl} alt="Problem" style={{ maxWidth: '100%', maxHeight: '300px', objectFit: 'contain' }} />
                    </div>
                )}

                <div style={{ display: 'grid', gap: '0.75rem', marginBottom: '2rem' }}>
                    {currentProblem.question.options.map((opt, idx) => {
                        let bgColor = 'white';
                        let borderColor = 'var(--slate-200)';
                        let textColor = 'var(--slate-700)';

                        if (isAnswered) {
                            if (idx === currentProblem.question.correctAnswer) {
                                bgColor = '#ecfdf5'; borderColor = '#10b981'; textColor = '#047857';
                            } else if (idx === selectedAnswer) {
                                bgColor = '#fef2f2'; borderColor = '#ef4444'; textColor = '#b91c1c';
                            }
                        } else if (selectedAnswer === idx) {
                            bgColor = 'var(--primary-50)'; borderColor = 'var(--primary-500)';
                        }

                        return (
                            <div
                                key={idx}
                                onClick={() => handleAnswer(idx)}
                                style={{
                                    padding: '1rem',
                                    borderRadius: '0.75rem',
                                    border: `2px solid ${borderColor}`,
                                    background: bgColor,
                                    color: textColor,
                                    cursor: isAnswered ? 'default' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '1rem',
                                    fontWeight: 500,
                                    transition: 'all 0.2s'
                                }}
                            >
                                <div style={{
                                    width: '24px', height: '24px', borderRadius: '50%', border: '1px solid currentColor',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem'
                                }}>
                                    {idx + 1}
                                </div>
                                {opt}
                                {isAnswered && idx === currentProblem.question.correctAnswer && <CheckCircle size={18} />}
                                {isAnswered && idx === selectedAnswer && idx !== currentProblem.question.correctAnswer && <XCircle size={18} />}
                            </div>
                        );
                    })}
                </div>

                {isAnswered && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{ padding: '1.5rem', background: '#f8fafc', borderRadius: '1rem', marginBottom: '1.5rem' }}
                    >
                        <h4 style={{ fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <BookOpen size={18} /> 해설
                        </h4>
                        <p style={{ color: 'var(--slate-600)', lineHeight: '1.6' }}>
                            {currentProblem.question.explanation || '해설이 없습니다.'}
                        </p>
                    </motion.div>
                )}

                {isAnswered && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <button
                            onClick={handleRemoveCurrent}
                            className="btn"
                            style={{ color: '#ef4444', background: 'none', border: 'none', padding: 0 }}
                        >
                            <Trash2 size={18} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
                            이 문제 삭제 (마스터함)
                        </button>
                        <button onClick={handleNext} className="btn btn-primary" style={{ padding: '0.75rem 2rem' }}>
                            {currentIndex < problems.length - 1 ? '다음 문제' : '결과 보기'} <ArrowRight size={18} style={{ marginLeft: '0.5rem' }} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

const NoteItem = ({ item, onRemove }: { item: WrongProblem, onRemove: () => void }) => {
    const [isOpen, setIsOpen] = useState(false);
    const { question } = item;

    return (
        <motion.div
            layout
            className="glass-card"
            style={{
                background: 'white',
                border: isOpen ? '1px solid var(--primary-200)' : '1px solid transparent',
                overflow: 'hidden'
            }}
        >
            {/* Header / Summary */}
            <div
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    padding: '1.5rem',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    background: isOpen ? 'var(--primary-50)' : 'white',
                    transition: 'background 0.2s'
                }}
            >
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'start', flex: 1 }}>
                    <span style={{
                        background: 'var(--slate-100)', color: 'var(--slate-600)', padding: '0.25rem 0.5rem',
                        borderRadius: '0.25rem', fontSize: '0.75rem', fontWeight: 600, flexShrink: 0, marginTop: '2px'
                    }}>
                        {question.category}
                    </span>
                    <div>
                        <h3 style={{ fontSize: '1.1rem', lineHeight: '1.4', marginBottom: '0.5rem' }}>{question.text}</h3>
                        <p style={{ fontSize: '0.85rem', color: 'var(--slate-400)' }}>
                            오답: {item.wrongAnswer !== null ? question.options[item.wrongAnswer as number] : '(미응시)'}
                        </p>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button
                        onClick={(e) => { e.stopPropagation(); onRemove(); }}
                        style={{ color: 'var(--slate-400)', padding: '0.5rem', background: 'none', border: 'none', cursor: 'pointer' }}
                        title="삭제 (복습 완료)"
                    >
                        <Trash2 size={18} />
                    </button>
                    {isOpen ? <ChevronUp size={20} color="var(--primary-600)" /> : <ChevronDown size={20} color="var(--slate-400)" />}
                </div>
            </div>

            {/* Details (Accordion) */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        style={{ borderTop: '1px solid var(--slate-100)' }}
                    >
                        <div style={{ padding: '1.5rem 1.5rem 2rem 1.5rem' }}>
                            {question.imageUrl && (
                                <div style={{ marginBottom: '1.5rem', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--slate-200)', maxWidth: '500px' }}>
                                    <img src={question.imageUrl} alt="Ref" style={{ width: '100%', objectFit: 'contain' }} />
                                </div>
                            )}

                            <div style={{ marginBottom: '1.5rem' }}>
                                {question.options.map((opt, idx) => (
                                    <div
                                        key={idx}
                                        style={{
                                            padding: '0.75rem',
                                            borderRadius: '0.5rem',
                                            marginBottom: '0.5rem',
                                            background: idx === question.correctAnswer ? '#ecfdf5' : (idx === item.wrongAnswer ? '#fef2f2' : 'var(--slate-50)'),
                                            border: idx === question.correctAnswer ? '1px solid #10b981' : (idx === item.wrongAnswer ? '1px solid #ef4444' : '1px solid transparent'),
                                            color: idx === question.correctAnswer ? '#047857' : (idx === item.wrongAnswer ? '#b91c1c' : 'var(--slate-700)'),
                                            display: 'flex', alignItems: 'center', gap: '0.75rem'
                                        }}
                                    >
                                        <div style={{
                                            width: '24px', height: '24px', borderRadius: '50%',
                                            background: 'white', border: '1px solid currentColor',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700
                                        }}>
                                            {idx + 1}
                                        </div>
                                        {opt}
                                        {idx === question.correctAnswer && <span style={{ marginLeft: 'auto', fontSize: '0.8rem', fontWeight: 600 }}>정답</span>}
                                        {idx === item.wrongAnswer && <span style={{ marginLeft: 'auto', fontSize: '0.8rem', fontWeight: 600 }}>선택한 답</span>}
                                    </div>
                                ))}
                            </div>

                            <div style={{ background: 'var(--primary-50)', padding: '1.5rem', borderRadius: '0.75rem' }}>
                                <h4 style={{ fontSize: '0.9rem', color: 'var(--primary-700)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <BookOpen size={16} /> 핵심 해설
                                </h4>
                                <p style={{ lineHeight: '1.6', color: 'var(--slate-700)' }}>
                                    {question.explanation}
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};
