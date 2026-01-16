import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, CheckCircle, XCircle, ArrowRight, ChevronLeft } from 'lucide-react';
import { MainLayout } from '../../layouts/MainLayout';
import { ExamService } from '../../services/examService';
import { Question } from '../../types';

export const PracticeMode = () => {
    const [categories, setCategories] = useState<string[]>([]);
    const [allQuestions, setAllQuestions] = useState<Question[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [currentQuestions, setCurrentQuestions] = useState<Question[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const [loading, setLoading] = useState(true);

    // Load Questions from all exams
    useEffect(() => {
        const loadQuestions = async () => {
            try {
                const exams = await ExamService.getExamList();
                const questions = exams.flatMap(e => e.questions || []);
                setAllQuestions(questions);

                const uniqueCategories = Array.from(new Set(questions.map(q => q.category)));
                setCategories(uniqueCategories);
                setLoading(false);
            } catch (error) {
                console.error('Failed to load practice questions:', error);
                setLoading(false);
            }
        };
        loadQuestions();
    }, []);

    // Select Category and Load Questions
    const startPractice = (category: string) => {
        const filtered = allQuestions.filter(q => q.category === category);
        // Shuffle questions
        const shuffled = [...filtered].sort(() => Math.random() - 0.5);

        setCurrentQuestions(shuffled);
        setSelectedCategory(category);
        setCurrentIndex(0);
        resetQuestionState();
    };

    const resetQuestionState = () => {
        setSelectedOption(null);
        setIsAnswered(false);
    };

    const handleAnswer = (idx: number) => {
        if (isAnswered) return;
        setSelectedOption(idx);
        setIsAnswered(true);
    };

    const nextQuestion = () => {
        if (currentIndex < currentQuestions.length - 1) {
            setCurrentIndex(c => c + 1);
            resetQuestionState();
        } else {
            // End of practice session
            alert('모든 문제를 다 풀었습니다! 다른 유형도 도전해보세요.');
            setSelectedCategory(null);
        }
    };

    // --- View: Category Selection ---
    if (!selectedCategory) {
        if (loading) {
            return (
                <MainLayout>
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                        <div className="spinner"></div> 로딩 중...
                    </div>
                </MainLayout>
            );
        }

        if (categories.length === 0) {
            return (
                <MainLayout>
                    <section style={{ marginBottom: '2rem' }}>
                        <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>유형별 연습 🎯</h1>
                        <p style={{ color: 'var(--slate-500)' }}>등록된 문제가 없습니다. 관리자에게 문의하세요.</p>
                    </section>
                </MainLayout>
            );
        }

        return (
            <MainLayout>
                <section style={{ marginBottom: '2rem' }}>
                    <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>유형별 연습 🎯</h1>
                    <p style={{ color: 'var(--slate-500)' }}>취약한 과목을 선택하여 집중적으로 학습하세요. 문제는 즉시 정답을 확인할 수 있습니다.</p>
                </section>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
                    {categories.map(category => (
                        <motion.button
                            key={category}
                            whileHover={{ y: -5 }}
                            onClick={() => startPractice(category)}
                            className="glass-card"
                            style={{
                                padding: '2rem',
                                textAlign: 'left',
                                background: 'white',
                                display: 'flex', flexDirection: 'column', gap: '1rem',
                                cursor: 'pointer',
                                border: '1px solid transparent'
                            }}
                        >
                            <div style={{
                                width: '48px', height: '48px', borderRadius: '12px',
                                background: 'var(--primary-100)', color: 'var(--primary-600)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <BookOpen size={24} />
                            </div>
                            <div>
                                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>{category}</h3>
                                <p style={{ fontSize: '0.9rem', color: 'var(--slate-500)' }}>
                                    {allQuestions.filter(q => q.category === category).length} 문제
                                </p>
                            </div>
                        </motion.button>
                    ))}
                </div>
            </MainLayout>
        );
    }

    // --- View: Question Player ---
    const question = currentQuestions[currentIndex];

    // 안전 장치: 문제가 없을 경우
    if (!question) return <div>문제를 불러올 수 없습니다.</div>;

    return (
        <div style={{ minHeight: '100vh', background: 'var(--slate-50)', paddingBottom: '2rem' }}>
            {/* Simple Header */}
            <header style={{ background: 'white', borderBottom: '1px solid var(--slate-200)', padding: '1rem 0' }}>
                <div className="container" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button onClick={() => setSelectedCategory(null)} style={{ display: 'flex', alignItems: 'center', color: 'var(--slate-500)' }}>
                        <ChevronLeft /> 나가기
                    </button>
                    <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{selectedCategory} 연습</span>
                    <span style={{ marginLeft: 'auto', fontSize: '0.9rem', color: 'var(--slate-500)' }}>
                        {currentIndex + 1} / {currentQuestions.length}
                    </span>
                </div>
            </header>

            <main className="container" style={{ marginTop: '2rem', maxWidth: '800px' }}>
                <motion.div
                    key={currentIndex}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="glass-card"
                    style={{ padding: '2.5rem', background: 'white', marginBottom: '2rem' }}
                >
                    <h2 style={{ fontSize: '1.4rem', lineHeight: '1.5', marginBottom: '2rem' }}>{question.text}</h2>

                    {question.imageUrl && (
                        <div style={{ marginBottom: '2rem', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--slate-200)' }}>
                            <img src={question.imageUrl} alt="Question Reference" style={{ width: '100%', maxHeight: '400px', objectFit: 'contain' }} />
                        </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {question.options.map((option, idx) => {
                            // Style logic for immediate feedback
                            let bg = 'white';
                            let border = '1px solid var(--slate-200)';
                            let color = 'var(--text-main)';
                            let icon = null;

                            if (isAnswered) {
                                if (idx === question.correctAnswer) {
                                    bg = '#ecfdf5'; border = '1px solid #10b981'; color = '#047857';
                                    icon = <CheckCircle size={18} />;
                                } else if (idx === selectedOption) {
                                    bg = '#fef2f2'; border = '1px solid #ef4444'; color = '#b91c1c';
                                    icon = <XCircle size={18} />;
                                }
                            }

                            return (
                                <button
                                    key={idx}
                                    onClick={() => handleAnswer(idx)}
                                    disabled={isAnswered}
                                    style={{
                                        padding: '1rem 1.25rem',
                                        borderRadius: '0.75rem',
                                        border, background: bg, color,
                                        textAlign: 'left',
                                        fontSize: '1.05rem',
                                        display: 'flex', alignItems: 'center', gap: '1rem',
                                        transition: 'all 0.1s',
                                        cursor: isAnswered ? 'default' : 'pointer'
                                    }}
                                >
                                    <span style={{ width: '24px', opacity: 0.5 }}>{idx + 1}.</span>
                                    {option}
                                    {icon && <span style={{ marginLeft: 'auto' }}>{icon}</span>}
                                </button>
                            );
                        })}
                    </div>
                </motion.div>

                {/* Explanation Card (Shows only after answering) */}
                <AnimatePresence>
                    {isAnswered && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="glass-card"
                            style={{ padding: '2rem', background: 'var(--primary-50)', border: '1px solid var(--primary-100)', marginBottom: '2rem' }}
                        >
                            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--primary-800)', fontWeight: 700 }}>
                                💡 해설
                            </h3>
                            <p style={{ lineHeight: '1.6', color: 'var(--slate-700)' }}>{question.explanation}</p>

                            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                                <button onClick={nextQuestion} className="btn btn-primary">
                                    {currentIndex < currentQuestions.length - 1 ? '다음 문제' : '연습 종료'} <ArrowRight size={18} />
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
};
