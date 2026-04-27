import { AuthService } from './authService';
import { CbtAttempt, CbtExam, CbtExamQuestion, CbtResult } from '../types';

export const CbtService = {
    getExamList: async (courseName?: string): Promise<CbtExam[]> => {
        const query = courseName ? `?courseName=${encodeURIComponent(courseName)}` : '';
        const response = await fetch(`/api/cbt/exams${query}`);
        const data = await response.json();
        return data.exams || [];
    },

    getExamById: async (examId: string): Promise<(CbtExam & { questions: CbtExamQuestion[] }) | null> => {
        const response = await fetch(`/api/cbt/exams/${examId}`);
        if (!response.ok) return null;
        const data = await response.json();
        return data.exam || null;
    },

    startAttempt: async (examId: string): Promise<{ success: boolean; attempt?: CbtAttempt; message?: string }> => {
        const currentUser = AuthService.getCurrentUser();
        if (!currentUser) return { success: false, message: '로그인이 필요합니다.' };

        const response = await fetch('/api/cbt/attempts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ examId, userId: currentUser.id })
        });

        return await response.json();
    },

    getAttemptById: async (attemptId: string): Promise<CbtAttempt | null> => {
        const response = await fetch(`/api/cbt/attempts/${attemptId}`);
        if (!response.ok) return null;
        const data = await response.json();
        return data.attempt || null;
    },

    saveAnswers: async (attemptId: string, answers: { [key: string]: number | string }) => {
        await fetch(`/api/cbt/attempts/${attemptId}/answers`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ answers })
        });
    },

    submitAttempt: async (attemptId: string): Promise<{ success: boolean; result?: CbtResult; message?: string }> => {
        const response = await fetch(`/api/cbt/attempts/${attemptId}/submit`, {
            method: 'POST'
        });
        return await response.json();
    },

    getMyResults: async (): Promise<CbtResult[]> => {
        const currentUser = AuthService.getCurrentUser();
        if (!currentUser) return [];
        const response = await fetch(`/api/cbt/results?userId=${currentUser.id}`);
        const data = await response.json();
        return data.results || [];
    }
};
