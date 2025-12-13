import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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
    const [answers, setAnswers] = useState<{ [key: string]: number }>({});
    const [showResult, setShowResult] = useState(false);

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

    const handleAnswer = (optionIdx: number) => {
        setAnswers(prev => ({
            ...prev,
            [exam.questions[currentIdx].id]: optionIdx
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
            const score = exam.questions.reduce((acc, q) => {
                return acc + (answers[q.id] === q.correctAnswer ? 1 : 0);
            }, 0);

            await ExamService.submitExamResult(exam.id, answers, score);
            setShowResult(true);
        }
    };

    if (showResult) {
        const score = exam.questions.reduce((acc, q) => {
            return acc + (answers[q.id] === q.correctAnswer ? 1 : 0);
        }, 0);
        return (
            <div className="container flex-center" style={{ minHeight: '100vh', flexDirection: 'column' }}>
                <div className="glass-card" style={{ padding: '3rem', textAlign: 'center', background: 'white' }}>
                    <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>시험 종료!</h1>
                    <p style={{ fontSize: '1.25rem', marginBottom: '2rem' }}>
                        당신의 점수는 <span className="text-primary" style={{ fontWeight: 700 }}>{Math.round(score * (100 / exam.questions.length))}점</span> 입니다.
                    </p>
                    <button onClick={() => navigate('/student/dashboard')} className="btn btn-primary">대시보드로 돌아가기</button>
                </div>
            </div>
        );
    }

    const question = exam.questions[currentIdx];

    return (
        <div style={{ minHeight: '100vh', background: 'var(--slate-50)', paddingBottom: '2rem' }}>
            {/* Header - Custom for Exam (No Layout) */}
            <header style={{ background: 'white', borderBottom: '1px solid var(--slate-200)', padding: '0.75rem 0', position: 'sticky', top: 0, zIndex: 10 }}>
                <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 700, fontSize: '1.25rem' }}>
                        {exam.title}
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <Timer initialTime={exam.timeLimit} onTimeUp={() => alert('시간 종료!')} />
                        <button className="btn btn-accent" onClick={submitExam} style={{ fontSize: '0.875rem' }}>제출하기</button>
                    </div>
                </div>
            </header>

            <main className="container" style={{ marginTop: '2rem', display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem' }}>

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
                            <span style={{ background: 'var(--primary-50)', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary-700)' }}>
                                {question.category}
                            </span>
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

                        {/* Options */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {question.options.map((option, idx) => (
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
                                        display: 'flex', alignItems: 'center', gap: '1rem',
                                        transition: 'all 0.1s'
                                    }}
                                >
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
                                    {option}
                                </button>
                            ))}
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
                </div>

                {/* Right: OMR */}
                <OMRGrid
                    total={exam.questions.length}
                    answers={answers}
                    current={currentIdx}
                    onJump={setCurrentIdx}
                />

            </main>
        </div>
    );
};
