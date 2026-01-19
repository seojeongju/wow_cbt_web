import { Exam, Question, ExamResult, WrongProblem } from '../types';
import { AuthService } from './authService';

export const ExamService = {
    // --------------------------------------------------------------------------
    // Exam Management
    // --------------------------------------------------------------------------
    createExam: async (data: { title: string; courseName: string; timeLimit: number; subjectId?: string; topic?: string; round?: string }): Promise<{ success: boolean; examId?: string; message?: string }> => {
        try {
            const response = await fetch('/api/exams', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: data.title,
                    courseId: data.courseName,
                    timeLimit: data.timeLimit,
                    subjectId: data.subjectId,
                    topic: data.topic,
                    round: data.round,
                    description: '',
                    passScore: 60
                })
            });
            return await response.json();
        } catch (error) {
            console.error('createExam error:', error);
            return { success: false, message: 'Server error' };
        }
    },

    getExamsByCourse: async (courseName: string): Promise<Exam[]> => {
        try {
            const response = await fetch(`/api/exams?courseId=${courseName}`);
            const data = await response.json();
            if (data.success && data.exams) {
                return data.exams.map((e: any) => ({
                    id: e.id,
                    title: e.title,
                    courseName: e.course_name || e.course_id,
                    courseId: e.course_id,
                    subjectName: e.subject_name,
                    subjectId: e.subject_id,
                    topic: e.topic,
                    round: e.round,
                    description: e.description,
                    timeLimit: e.time_limit,
                    passScore: e.pass_score,
                    questions: [],
                    questionsCount: e.question_count
                }));
            }
            return [];
        } catch { return []; }
    },

    updateExam: async (examId: string, data: Partial<Exam>): Promise<{ success: boolean; message?: string }> => {
        try {
            const response = await fetch(`/api/exams/${examId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            return await response.json();
        } catch (error) {
            return { success: false, message: 'Server error' };
        }
    },

    deleteExam: async (examId: string): Promise<{ success: boolean; message?: string }> => {
        try {
            const response = await fetch(`/api/exams/${examId}`, {
                method: 'DELETE'
            });
            return await response.json();
        } catch (error) {
            return { success: false, message: 'Server error' };
        }
    },

    // --------------------------------------------------------------------------
    // Question Management
    // --------------------------------------------------------------------------
    getAllQuestions: async (examId: string): Promise<Question[]> => {
        try {
            const response = await fetch(`/api/exams/${examId}/questions?t=${Date.now()}`);
            const data = await response.json();
            return (data.questions || []).map((q: any) => {
                // Parse correctAnswer properly - convert string numbers to actual numbers
                let parsedCorrectAnswer: number | string = q.correct_answer;

                // If it's a string that represents a number (0-3), convert to number
                if (typeof parsedCorrectAnswer === 'string') {
                    const num = parseInt(parsedCorrectAnswer, 10);
                    if (!isNaN(num) && num >= 0 && num <= 3) {
                        parsedCorrectAnswer = num;
                    }
                }

                return {
                    id: q.id,
                    category: q.category,
                    text: q.text,
                    imageUrl: q.image_url,
                    options: q.options || [],
                    optionImages: (() => {
                        const raw = q.optionImages || q.option_images;
                        if (Array.isArray(raw)) return raw;
                        if (typeof raw === 'string') {
                            try {
                                const parsed = JSON.parse(raw);
                                if (Array.isArray(parsed)) return parsed;
                            } catch { }
                        }
                        return undefined;
                    })(),
                    correctAnswer: parsedCorrectAnswer,
                    explanation: q.explanation
                };
            });
        } catch { return []; }
    },

    addQuestionToExam: async (examId: string, question: Question): Promise<void> => {
        try {
            const response = await fetch(`/api/exams/${examId}/questions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(question)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || '문제 추가 실패');
            }
        } catch (error) {
            console.error('Add question error:', error);
            throw error;
        }
    },

    updateQuestionInExam: async (_examId: string, question: Question): Promise<void> => {
        try {
            // imageUrl 처리: null이면 명시적으로 null 전달, undefined면 null로 변환, 그 외는 그대로
            const updateData: any = {
                ...question,
                imageUrl: question.imageUrl === null ? null : (question.imageUrl === undefined ? null : question.imageUrl)
            };

            const response = await fetch(`/api/questions/${question.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData)
            });

            if (!response.ok) {
                let errorMessage = '문제 수정 실패';
                try {
                    const err = await response.json();
                    errorMessage = err.error || err.message || errorMessage;
                } catch (e) {
                    errorMessage = await response.text() || errorMessage;
                }
                throw new Error(errorMessage);
            }
        } catch (error) {
            console.error('Update question error:', error);
            throw error;
        }
    },

    removeQuestionFromExam: async (_examId: string, questionId: string): Promise<void> => {
        try {
            await fetch(`/api/questions/${questionId}`, { method: 'DELETE' });
        } catch { }
    },

    // --------------------------------------------------------------------------
    // Wrong Answer Note
    // --------------------------------------------------------------------------

    // tempExam for Wrong Answer Review
    tempExam: null as Exam | null,

    createWrongAnswerExam: (wrongProblems: WrongProblem[]): string => {
        const examId = `wrong-answer-review-${Date.now()}`;
        const questions = wrongProblems.map(wp => wp.question);

        ExamService.tempExam = {
            id: examId,
            title: `오답 복습 테스트 (${new Date().toLocaleDateString()})`,
            courseName: '오답노트',
            description: '오답노트에서 생성된 복습용 테스트입니다.',
            timeLimit: Math.max(questions.length * 60, 600), // Min 10 mins or 1 min/question
            passScore: 60,
            questions: questions,
            questionsCount: questions.length
        };

        return examId;
    },

    getWrongProblems: async (): Promise<WrongProblem[]> => {
        const history = await ExamService.getExamHistory();
        const wrongProblems: WrongProblem[] = [];
        const ignoreList = JSON.parse(localStorage.getItem('wow_cbt_ignored_wrong_problems') || '[]');

        for (const result of history) {
            const exam = await ExamService.getExamById(result.examId);
            if (!exam || !result.answers) continue;

            const examQuestions = exam.questions || [];

            Object.entries(result.answers).forEach(([qId, answer]) => {
                const question = examQuestions.find(q => q.id === qId);
                if (question) {
                    const isCorrect = typeof question.correctAnswer === 'number'
                        ? answer === question.correctAnswer
                        : String(answer).trim() === String(question.correctAnswer).trim();

                    if (!isCorrect) {
                        const wpId = `wp-${result.id}-${qId}`;
                        if (!ignoreList.includes(wpId)) {
                            wrongProblems.push({
                                id: wpId,
                                examId: result.examId,
                                question: question,
                                wrongAnswer: answer,
                                date: result.date
                            });
                        }
                    }
                }
            });
        }
        return wrongProblems;
    },

    removeWrongProblem: async (id: string): Promise<void> => {
        const ignoreList = JSON.parse(localStorage.getItem('wow_cbt_ignored_wrong_problems') || '[]');
        if (!ignoreList.includes(id)) {
            ignoreList.push(id);
            localStorage.setItem('wow_cbt_ignored_wrong_problems', JSON.stringify(ignoreList));
        }
    },

    // Legacy method names used in some components map to above
    getExamList: async (): Promise<Exam[]> => {
        try {
            const response = await fetch('/api/exams');
            const data = await response.json();
            if (data.success && data.exams) {
                return data.exams.map((e: any) => ({
                    id: e.id,
                    title: e.title,
                    courseName: e.course_name || e.course_id,
                    courseId: e.course_id,
                    subjectName: e.subject_name,
                    subjectId: e.subject_id,
                    topic: e.topic,
                    round: e.round,
                    description: e.description,
                    timeLimit: e.time_limit,
                    passScore: e.pass_score,
                    questions: [],
                    questionsCount: e.question_count
                }));
            }
            return [];
        } catch (error) {
            console.error('getExamList error:', error);
            return [];
        }
    },

    getExamHistory: async (): Promise<ExamResult[]> => {
        const currentUser = AuthService.getCurrentUser();
        if (!currentUser) return [];

        try {
            const response = await fetch(`/api/exam-results?userId=${currentUser.id}`);
            const data = await response.json();
            return (data.results || []).map((r: any) => ({
                id: r.id,
                userId: r.user_id,
                examId: r.exam_id,
                examTitle: r.exam_title,
                courseName: r.course_name,
                score: r.score,
                totalQuestions: r.total_questions,
                wrongCount: r.total_questions - r.score,
                date: r.created_at,
                passed: r.status === 'pass',
                answers: r.answers,
                status: 'completed'
            }));
        } catch { return []; }
    },

    // --------------------------------------------------------------------------
    // Exam Results & History
    // --------------------------------------------------------------------------
    submitExamResult: async (examId: string, answers: { [key: string]: number | string }, score: number) => {

        // Handle Wrong Answer Review Exam (Local logic)
        if (examId.startsWith('wrong-answer-review-')) {
            const tempExam = ExamService.tempExam;
            if (tempExam) {
                // Remove correctly answered questions from the wrong answer note
                const wrongProblems = await ExamService.getWrongProblems();
                const correctQuestionIds = tempExam.questions.filter(q => {
                    const answer = answers[q.id];
                    return typeof q.correctAnswer === 'number'
                        ? answer === q.correctAnswer
                        : String(answer).trim() === String(q.correctAnswer).trim();
                }).map(q => q.id);

                // Find matching wrongProblems and remove them
                for (const wp of wrongProblems) {
                    if (correctQuestionIds.includes(wp.question.id)) {
                        await ExamService.removeWrongProblem(wp.id);
                    }
                }
            }
            return; // Don't save review exams to history for now
        }

        const currentUser = AuthService.getCurrentUser();
        if (!currentUser) return;

        const exam = await ExamService.getExamById(examId);
        const totalQuestions = exam?.questions.length || 0;

        try {
            await fetch('/api/exam-results', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: currentUser.id,
                    examId: examId,
                    score: Math.round(score * (100 / (totalQuestions || 1))),
                    totalQuestions,
                    answers: answers,
                    takeDuration: 0, // Should be tracked
                    status: score >= 60 ? 'pass' : 'fail'
                })
            });
        } catch (error) {
            console.error('submitExamResult error:', error);
        }
    },

    getExamById: async (examId: string): Promise<Exam | undefined> => {
        // Check for Temp Exam
        if (examId.startsWith('wrong-answer-review-')) {
            return ExamService.tempExam || undefined;
        }

        try {
            const response = await fetch(`/api/exams/${examId}`);
            const data = await response.json();
            if (data.success && data.exam) {
                const e = data.exam;
                return {
                    id: e.id,
                    title: e.title,
                    courseName: e.course_name || e.course_id,
                    courseId: e.course_id,
                    subjectName: e.subject_name,
                    subjectId: e.subject_id,
                    topic: e.topic,
                    round: e.round,
                    description: e.description,
                    timeLimit: e.time_limit,
                    passScore: e.pass_score,
                    questions: (e.questions || []).map((q: any) => {
                        // Parse correctAnswer properly - convert string numbers to actual numbers
                        let parsedCorrectAnswer: number | string = q.correct_answer;

                        // If it's a string that represents a number (0-3), convert to number
                        if (typeof parsedCorrectAnswer === 'string') {
                            const num = parseInt(parsedCorrectAnswer, 10);
                            if (!isNaN(num) && num >= 0 && num <= 3) {
                                parsedCorrectAnswer = num;
                            }
                        }

                        return {
                            id: q.id,
                            category: q.category,
                            text: q.text,
                            imageUrl: q.image_url,
                            options: q.options || [],
                            optionImages: (() => {
                                const raw = q.optionImages || q.option_images;
                                if (Array.isArray(raw)) return raw;
                                if (typeof raw === 'string') {
                                    try {
                                        const parsed = JSON.parse(raw);
                                        if (Array.isArray(parsed)) return parsed;
                                    } catch { }
                                }
                                return undefined;
                            })(),
                            correctAnswer: parsedCorrectAnswer,
                            explanation: q.explanation
                        };
                    }),
                    questionsCount: e.questions?.length || 0
                };
            }
        } catch { }
        return undefined;
    },

    // --------------------------------------------------------------------------
    // Mock Exam Generation
    // --------------------------------------------------------------------------
    generateMockExam: async (options: {
        title: string;
        courseId: string;
        subjectId?: string;
        timeLimit: number;
        passScore: number;
        description?: string;
        questionIds: string[];
        mode: 'manual' | 'random';
        randomOptions?: {
            totalQuestions: number;
            distributionType: 'random' | 'equal' | 'custom';
            categoryQuestions?: { [category: string]: number };
        };
        // 🔄 Advanced grading criteria
        averagePassScore?: number | null;
        useAverageScore?: boolean;
        categoryMinScores?: { [category: string]: number };
        useCategoryMinScore?: boolean;
    }): Promise<{ success: boolean; examId?: string; message?: string }> => {
        try {
            const response = await fetch('/api/exams/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(options)
            });
            return await response.json();
        } catch (error) {
            console.error('generateMockExam error:', error);
            return { success: false, message: 'Server error' };
        }
    },

    // ⭐️ Move Questions to another Exam
    moveQuestions: async (questionIds: string[], targetExamId: string): Promise<{ success: boolean; message?: string; failCount?: number }> => {
        let failCount = 0;
        try {
            // Process in parallel or sequence based on volume. Sequence is safer for now.
            for (const qId of questionIds) {
                const response = await fetch(`/api/questions/${qId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ examId: targetExamId })
                });
                if (!response.ok) failCount++;
            }

            if (failCount === 0) {
                return { success: true };
            } else if (failCount === questionIds.length) {
                return { success: false, message: '모든 문제 이동에 실패했습니다.' };
            } else {
                return { success: true, message: `${failCount}개의 문제는 이동 실패했습니다.`, failCount };
            }
        } catch (error) {
            console.error('moveQuestions error:', error);
            return { success: false, message: '서버 오류 발생' };
        }
    }
};
