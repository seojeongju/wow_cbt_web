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

    addCourse: async (name: string): Promise<void> => {
        try {
            await fetch('/api/courses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name })
            });
        } catch (error) {
            console.error('addCourse error:', error);
        }
    },

    updateCourse: async (id: string, name: string): Promise<void> => {
        try {
            await fetch(`/api/courses/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name })
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

    // Legacy support or helper if needed (but currently we want strict objects)
    saveCourses: () => { console.warn('saveCourses is deprecated in D1 mode'); }
};
