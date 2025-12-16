import { Course } from '../types';

export const CourseService = {
    getCourses: async (): Promise<Course[]> => {
        try {
            const response = await fetch('/api/courses');
            if (!response.ok) throw new Error('Failed to fetch courses');
            const data = await response.json();
            return data.courses || [];
        } catch (error) {
            console.error('getCourses error:', error);
            return [];
        }
    },

    addCourse: async (name: string, details?: any): Promise<{ success: boolean; courseId?: string; message?: string }> => {
        try {
            const response = await fetch('/api/courses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, details })
            });
            return await response.json();
        } catch (error) {
            console.error('addCourse error:', error);
            return { success: false, message: '과정 생성 중 오류가 발생했습니다.' };
        }
    },

    updateCourse: async (id: string, name: string, details?: any): Promise<void> => {
        try {
            await fetch(`/api/courses/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, details })
            });
        } catch (error) {
            console.error('updateCourse error:', error);
        }
    },

    deleteCourse: async (id: string): Promise<void> => {
        try {
            await fetch(`/api/courses/${id}`, { method: 'DELETE' });
        } catch (error) {
            console.error('deleteCourse error:', error);
        }
    },

    requestEnrollment: async (userId: string, courseId: string): Promise<{ success: boolean; message: string }> => {
        try {
            const response = await fetch('/api/enrollments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, courseId })
            });
            return await response.json();
        } catch (error) {
            console.error('requestEnrollment error:', error);
            return { success: false, message: '수강 신청 중 오류가 발생했습니다.' };
        }
    },

    // Legacy support or helper if needed (but currently we want strict objects)
    saveCourses: () => { console.warn('saveCourses is deprecated in D1 mode'); }
};
