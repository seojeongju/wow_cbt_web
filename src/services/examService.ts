import { Exam, Question, ExamResult, WrongProblem } from '../types';
import { AuthService } from './authService';

export const ExamService = {
    // --------------------------------------------------------------------------
    // Exam Management
    // --------------------------------------------------------------------------
    createExam: async (data: { title: string; courseName: string; timeLimit: number }): Promise<{ success: boolean; examId?: string; message?: string }> => {
        try {
            // Note: courseName is mapped to courseId in frontend now, or backend expects ID.
            // Assumption: data.courseName holds the ID or we need to find it.
            // Simplified: Passing courseName as courseId
            const response = await fetch('/api/exams', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: data.title,
                    courseId: data.courseName, // Using name as ID for now based on previous context
                    timeLimit: data.timeLimit,
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
                    description: e.description,
                    timeLimit: e.time_limit,
                    passScore: e.pass_score,
                    questions: [], // Shallow list doesn't need full questions usually
                    questionsCount: e.question_count
                }));
            }
            return [];
        } catch { return []; }
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
        // Mock implementation for now, or need a new API endpoint for aggregated wrong answers
        // Filtering from history on client side for MVP to save API complexity
        const history = await ExamService.getExamHistory();
        const wrongProblems: WrongProblem[] = [];

        // This is heavy, in real app should be a SQL query
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
                    description: e.description,
                    timeLimit: e.time_limit,
                    passScore: e.pass_score,
                    questions: (e.questions || []).map((q: any) => ({
                        id: q.id,
                        category: q.category,
                        text: q.text,
                        imageUrl: q.image_url,
                        options: q.options || [],
                        correctAnswer: Number(q.correct_answer),
                        explanation: q.explanation
                    })),
                    questionsCount: e.questions?.length || 0
                };
            }
        } catch { }
        return undefined;
    },
};
