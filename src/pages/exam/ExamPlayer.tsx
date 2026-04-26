import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, LogOut } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';

import { Exam } from '../../types';
import { ExamService } from '../../services/examService';
import { Timer } from '../../components/exam/Timer';
import { OMRGrid } from '../../components/exam/OMRGrid';

export const ExamPlayer = () => {
    const { examId } = useParams<{ examId: string }>();
    const navigate = useNavigate();

    const [exam, setExam] = useState<Exam | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentIdx, setCurrentIdx] = useState(0);
    const [answers, setAnswers] = useState<{ [key: string]: number | string }>({});
    const [isMobile, setIsMobile] = useState(false);

    // Load Exam Data
    useEffect(() => {
        const fetchExam = async () => {
            if (!examId) return;
            const data = await ExamService.getExamById(examId);
            if (data) {
                setExam(data);
            } else {
                alert('시험을 불러올 수 없습니다.');
                navigate('/student/dashboard');
            }
            setLoading(false);
        };
        fetchExam();

        // Screen size detection
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [examId, navigate]);

    // Keyboard navigation
    useEffect(() => {
        if (!exam) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight') nextQuestion();
            if (e.key === 'ArrowLeft') prevQuestion();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentIdx, exam]);

    if (loading) return <div className="flex-center" style={{ height: '100vh' }}>시험지를 가져오는 중입니다...</div>;
    if (!exam) return null;

    // Check if exam has questions
    if (!exam.questions || exam.questions.length === 0) {
        return (
            <div className="flex-center" style={{ height: '100vh', flexDirection: 'column', gap: '1rem' }}>
                <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', background: 'white' }}>
                    <h1 style={{ fontSize: '2rem', marginBottom: '1rem', color: 'var(--slate-700)' }}>시험 문제가 없습니다</h1>
                    <p style={{ fontSize: '1.1rem', color: 'var(--slate-500)', marginBottom: '2rem' }}>
                        이 시험지에는 아직 등록된 문제가 없습니다.
                    </p>
                    <button onClick={() => navigate(-1)} className="btn btn-primary">이전 페이지로 돌아가기</button>
                </div>
            </div>
        );
    }

    const handleAnswer = (answer: number | string) => {
        setAnswers(prev => ({
            ...prev,
            [exam.questions[currentIdx].id]: answer
        }));
    };

    const nextQuestion = () => {
        if (currentIdx < exam.questions.length - 1) setCurrentIdx(c => c + 1);
    };

    const prevQuestion = () => {
        if (currentIdx > 0) setCurrentIdx(c => c - 1);
    };

    const submitExam = async () => {
        if (window.confirm('시험을 종료하고 답안을 제출하시겠습니까?')) {
            try {
                const score = exam.questions.reduce((acc, q) => {
                    const isCorrect = typeof q.correctAnswer === 'number'
                        ? answers[q.id] === q.correctAnswer
                        : (answers[q.id] as string)?.trim() === (q.correctAnswer as unknown as string)?.trim();
                    return acc + (isCorrect ? 1 : 0);
                }, 0);

                await ExamService.submitExamResult(exam.id, answers, score);
                navigate(-1);
            } catch (error) {
                console.error('Failed to submit exam', error);
                alert('답안 제출 중 오류가 발생했습니다. 다시 시도해주세요.');
            }
        }
    };

    // New Exit Handler
    const handleExit = () => {
        if (window.confirm('시험을 종료하고 나가시겠습니까?\n작성 중인 답안은 저장되지 않습니다.')) {
            navigate(-1);
        }
    };


    const question = exam.questions[currentIdx];

    // Safety check for question data
    if (!question) {
        return (
            <div className="flex-center" style={{ height: '100vh', flexDirection: 'column', gap: '1rem' }}>
                <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', background: 'white' }}>
                    <h1 style={{ fontSize: '2rem', marginBottom: '1rem', color: 'var(--slate-700)' }}>문제를 불러올 수 없습니다</h1>
                    <p style={{ fontSize: '1.1rem', color: 'var(--slate-500)', marginBottom: '2rem' }}>
                        현재 문제 데이터를 가져올 수 없습니다.
                    </p>
                    <button onClick={() => navigate(-1)} className="btn btn-primary">이전 페이지로 돌아가기</button>
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', background: 'var(--slate-50)', paddingBottom: '2rem' }}>
            {/* Header - Custom for Exam (No Layout) */}
            <header style={{ background: 'white', borderBottom: '1px solid var(--slate-200)', padding: isMobile ? '0.75rem 0' : '1rem 0', position: 'sticky', top: 0, zIndex: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: isMobile ? '0 0.75rem' : '0 1.5rem', flexWrap: isMobile ? 'wrap' : 'nowrap', gap: isMobile ? '0.5rem' : '0' }}>
                    <div style={{ fontWeight: 700, fontSize: isMobile ? '0.95rem' : '1.25rem', color: '#334155', flex: isMobile ? '1 1 100%' : 'initial' }}>
                        {isMobile ? (exam.title.length > 20 ? exam.title.substring(0, 20) + '...' : exam.title) : exam.title}
                    </div>
                    <div style={{ display: 'flex', gap: isMobile ? '0.5rem' : '0.75rem', alignItems: 'center' }}>
                        {exam.timeLimit > 0 && <Timer initialTime={exam.timeLimit} onTimeUp={() => alert('시간 종료!')} />}
                        <button
                            onClick={handleExit}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                padding: isMobile ? '0.5rem 0.875rem' : '0.625rem 1.25rem',
                                border: '1.5px solid var(--slate-300)',
                                background: 'white',
                                color: 'var(--slate-600)',
                                fontSize: isMobile ? '0.75rem' : '0.875rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                borderRadius: '0.5rem',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'var(--slate-50)';
                                e.currentTarget.style.borderColor = 'var(--slate-400)';
                                e.currentTarget.style.color = 'var(--slate-700)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'white';
                                e.currentTarget.style.borderColor = 'var(--slate-300)';
                                e.currentTarget.style.color = 'var(--slate-600)';
                            }}
                        >
                            <LogOut size={isMobile ? 14 : 16} />
                            {isMobile ? '나가' : '나가기'}
                        </button>
                        <button
                            className="btn btn-accent"
                            onClick={submitExam}
                            style={{
                                fontSize: isMobile ? '0.75rem' : '0.875rem',
                                padding: isMobile ? '0.5rem 1rem' : '0.625rem 1.5rem',
                                fontWeight: 600
                            }}
                        >
                            제출하기
                        </button>
                    </div>
                </div>
            </header>

            <main className="container" style={{ marginTop: isMobile ? '1rem' : '2rem', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 300px', gap: isMobile ? '1rem' : '2rem', padding: isMobile ? '0 0.75rem' : '0 1.5rem' }}>

                {/* Left: Question Area */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <motion.div
                        key={currentIdx}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3 }}
                        className="glass-card"
                        style={{ padding: '2.5rem', background: 'white', minHeight: '500px' }}
                    >
                        {/* Question Info */}
                        <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem' }}>
                            <span style={{ background: 'var(--slate-100)', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--slate-600)' }}>
                                {currentIdx + 1}번
                            </span>
                            {/* Hide 'AI 추출' badge if category matches */}
                            {question.category && question.category !== 'AI 추출' && (
                                <span style={{ background: 'var(--primary-50)', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary-700)' }}>
                                    {question.category}
                                </span>
                            )}
                        </div>

                        {/* Question Text */}
                        <h2 style={{ fontSize: '1.5rem', lineHeight: '1.4', marginBottom: '2rem' }}>
                            {question.text}
                        </h2>

                        {/* Question Image (If exists) */}
                        {question.imageUrl && (
                            <div style={{ marginBottom: '2rem', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--slate-200)' }}>
                                <img src={question.imageUrl} alt="Question Reference" style={{ width: '100%', maxHeight: '400px', objectFit: 'contain', background: '#f8f9fa' }} />
                            </div>
                        )}

                        {/* Options or Subjective Input */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {question.options && question.options.length > 0 ? (
                                question.options.map((option, idx) => {
                                    const optionImage = question.optionImages?.[idx];
                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => handleAnswer(idx)}
                                            style={{
                                                padding: '1rem 1.25rem',
                                                borderRadius: '0.75rem',
                                                border: answers[question.id] === idx ? '2px solid var(--primary-600)' : '1px solid var(--slate-200)',
                                                background: answers[question.id] === idx ? 'var(--primary-50)' : 'white',
                                                color: answers[question.id] === idx ? 'var(--primary-800)' : 'var(--text-main)',
                                                textAlign: 'left',
                                                fontSize: '1.1rem',
                                                display: 'flex', 
                                                flexDirection: 'column',
                                                alignItems: 'flex-start', 
                                                gap: '0.75rem',
                                                transition: 'all 0.1s'
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', width: '100%' }}>
                                                <span style={{
                                                    width: '28px', height: '28px', borderRadius: '50%',
                                                    border: `2px solid ${answers[question.id] === idx ? 'var(--primary-600)' : 'var(--slate-300)'}`,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontSize: '0.9rem', fontWeight: 700,
                                                    color: answers[question.id] === idx ? 'var(--primary-600)' : 'var(--slate-400)',
                                                    flexShrink: 0
                                                }}>
                                                    {idx + 1}
                                                </span>
                                                <span style={{ flex: 1 }}>{option || ''}</span>
                                            </div>
                                            {optionImage && (
                                                <div style={{ 
                                                    width: '100%', 
                                                    borderRadius: '0.5rem', 
                                                    overflow: 'hidden', 
                                                    border: '1px solid var(--slate-200)',
                                                    background: '#f8f9fa'
                                                }}>
                                                    <img 
                                                        src={optionImage} 
                                                        alt={`Option ${idx + 1}`} 
                                                        style={{ 
                                                            width: '100%', 
                                                            maxHeight: '300px', 
                                                            objectFit: 'contain' 
                                                        }} 
                                                    />
                                                </div>
                                            )}
                                        </button>
                                    );
                                })
                            ) : (
                                <div style={{ marginTop: '1rem' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>주관식 정답 입력</label>
                                    <textarea
                                        value={(answers[question.id] as string) || ''}
                                        onChange={(e) => handleAnswer(e.target.value)}
                                        placeholder="정답을 입력하세요"
                                        style={{
                                            width: '100%',
                                            padding: '1rem',
                                            borderRadius: '0.75rem',
                                            border: '1px solid var(--slate-200)',
                                            fontSize: '1.1rem',
                                            minHeight: '120px',
                                            resize: 'vertical'
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                    </motion.div>

                    {/* Navigation Buttons */}
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <button
                            onClick={prevQuestion}
                            disabled={currentIdx === 0}
                            className="btn btn-secondary"
                            style={{ visibility: currentIdx === 0 ? 'hidden' : 'visible' }}
                        >
                            <ChevronLeft size={20} /> 이전 문제
                        </button>
                        <button
                            onClick={nextQuestion}
                            className="btn btn-primary"
                            style={{ visibility: currentIdx === exam.questions.length - 1 ? 'hidden' : 'visible' }}
                        >
                            다음 문제 <ChevronRight size={20} />
                        </button>
                    </div>
                    
                    {/* Last Question Notice */}
                    {currentIdx === exam.questions.length - 1 && (
                        <div style={{ 
                            textAlign: 'center', 
                            padding: '1.5rem', 
                            color: 'var(--slate-600)', 
                            fontSize: '1rem',
                            fontWeight: 500,
                            marginTop: '1rem'
                        }}>
                            더이상 문제가 없습니다.
                        </div>
                    )}
                </div>

                {/* Right: OMR */}
                <OMRGrid
                    questions={exam.questions}
                    answers={answers}
                    current={currentIdx}
                    onJump={setCurrentIdx}
                />

            </main>
        </div>
    );
};
