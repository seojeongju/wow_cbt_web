
export const SubjectService = {
    // Get all subjects (optionally filtered by course)
    getSubjects: async (courseId?: string): Promise<{ id: string; name: string; course_id: string }[]> => {
        try {
            const url = courseId ? `/api/subjects?courseId=${courseId}` : '/api/subjects';
            const response = await fetch(url);
            const data = await response.json();
            return data.success ? data.subjects : [];
        } catch (error) {
            console.error('getSubjects error:', error);
            return [];
        }
    },

    // Create a new subject
    addSubject: async (courseId: string, name: string): Promise<{ success: boolean; id?: string }> => {
        try {
            const response = await fetch('/api/subjects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ courseId, name })
            });
            const data = await response.json();
            return { success: data.success, id: data.id };
        } catch (error) {
            console.error('addSubject error:', error);
            return { success: false };
        }
    },

    // Update a subject's name
    updateSubject: async (id: string, name: string): Promise<boolean> => {
        try {
            const response = await fetch(`/api/subjects/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name })
            });
            const data = await response.json();
            return data.success;
        } catch (error) {
            console.error('updateSubject error:', error);
            return false;
        }
    },

    // Delete a subject
    deleteSubject: async (id: string): Promise<boolean> => {
        try {
            const response = await fetch(`/api/subjects/${id}`, {
                method: 'DELETE'
            });
            const data = await response.json();
            return data.success;
        } catch (error) {
            console.error('deleteSubject error:', error);
            return false;
        }
    }
};
