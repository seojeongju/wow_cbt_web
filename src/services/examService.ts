import { Exam } from '../types';
import { MOCK_EXAM_1 } from '../data/mockExam';

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const ExamService = {
    getExamById: async (examId: string): Promise<Exam | undefined> => {
        await delay(500); // Simulate network latency
        // In a real app, this would fetch from an API
        if (examId === 'exam-001') return MOCK_EXAM_1;
        return undefined;
    },

    submitExamResult: async (examId: string, answers: { [key: string]: number }, score: number) => {
        await delay(1000);
        console.log(`Submitting results for ${examId}: Score ${score}`, answers);
        return { success: true };
    }
};
