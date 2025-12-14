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

    getExamById: async (examId: string): Promise<Exam | undefined> => {
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

    updateExam: async (examId: string, data: Partial<Exam>): Promise<{ success: boolean; message?: string }> => {
        try {
            const response = await fetch(`/api/exams/${examId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: data.title,
                    timeLimit: data.timeLimit,
                    passScore: data.passScore
                })
            });
            return await response.json();
        } catch { return { success: false, message: 'Server error' }; }
    },

    deleteExam: async (examId: string): Promise<{ success: boolean }> => {
        try {
            const response = await fetch(`/api/exams/${examId}`, { method: 'DELETE' });
            return await response.json();
        } catch { return { success: false }; }
    },

    // --------------------------------------------------------------------------
    // Question Management
    // --------------------------------------------------------------------------
    getAllQuestions: async (examId: string): Promise<Question[]> => {
        try {
            const response = await fetch(`/api/exams/${examId}/questions`);
            const data = await response.json();
            return (data.questions || []).map((q: any) => ({
                id: q.id,
                category: q.category,
                text: q.text,
                imageUrl: q.image_url,
                options: q.options || [],
                correctAnswer: Number(q.correct_answer),
                explanation: q.explanation
            }));
        } catch { return []; }
    },

    addQuestionToExam: async (examId: string, question: Question): Promise<void> => {
        try {
            await fetch(`/api/exams/${examId}/questions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(question)
            });
        } catch { }
    },

    updateQuestionInExam: async (_examId: string, question: Question): Promise<void> => {
        try {
            await fetch(`/api/questions/${question.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(question)
            });
        } catch { }
    },

    removeQuestionFromExam: async (_examId: string, questionId: string): Promise<void> => {
        try {
            await fetch(`/api/questions/${questionId}`, { method: 'DELETE' });
        } catch { }
    },

    // --------------------------------------------------------------------------
    // Exam Results & History
    // --------------------------------------------------------------------------
    submitExamResult: async (examId: string, answers: { [key: string]: number }, score: number) => {
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
                wrongCount: r.total_questions - r.score, // Approximation if not tracked
                date: r.created_at,
                passed: r.status === 'pass',
                answers: r.answers,
                status: 'completed'
            }));
        } catch { return []; }
    },

    // --------------------------------------------------------------------------
    // Wrong Answer Note
    // --------------------------------------------------------------------------
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

            Object.entries(result.answers).forEach(([qId, answerIdx]) => {
                const question = examQuestions.find(q => q.id === qId);
                if (question && question.correctAnswer !== answerIdx) {
                    const wpId = `wp-${result.id}-${qId}`;
                    if (!ignoreList.includes(wpId)) {
                        wrongProblems.push({
                            id: wpId,
                            examId: result.examId,
                            question: question,
                            wrongAnswer: answerIdx,
                            date: result.date
                        });
                    }
                }
            });
        }
        return wrongProblems;
    },

    removeWrongProblem: async (id: string): Promise<void> => {
        // Since we are generating wrong problems on the fly from history,
        // "deleting" one means marking it as ignored. 
        // For MVP, we might need a local storage "ignore list" or D1 table.
        // Let's implement a simple local storage ignore list for hybrid.
        const ignoreList = JSON.parse(localStorage.getItem('wow_cbt_ignored_wrong_problems') || '[]');
        ignoreList.push(id);
        localStorage.setItem('wow_cbt_ignored_wrong_problems', JSON.stringify(ignoreList));
    },

    // Legacy method names used in some components map to above
    getExamList: async (): Promise<Exam[]> => {
        // For compatibility getting all exams
        const courses = await (await fetch('/api/courses')).json();
        let allExams: Exam[] = [];
        if (courses.courses) {
            for (const c of courses.courses) {
                const exams = await ExamService.getExamsByCourse(c.id);
                allExams = [...allExams, ...exams];
            }
        }
        return allExams;
    }
};
