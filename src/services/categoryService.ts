import { Category } from '../types';

export const CategoryService = {
    getCategories: async (courseId: string): Promise<Category[]> => {
        try {
            const response = await fetch(`/api/categories?courseId=${courseId}`);
            if (!response.ok) throw new Error('Failed to fetch categories');
            const data = await response.json();
            return data.categories || [];
        } catch (error) {
            console.error('getCategories error:', error);
            return [];
        }
    },

    saveCategories: () => { console.warn('Deprecated'); },

    addCategory: async (categoryName: string, courseId: string): Promise<boolean> => {
        try {
            const response = await fetch('/api/categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: categoryName, courseId })
            });
            return response.ok;
        } catch { return false; }
    },

    updateCategory: async (id: string, newName: string): Promise<boolean> => {
        try {
            const response = await fetch(`/api/categories/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newName })
            });
            return response.ok;
        } catch { return false; }
    },

    deleteCategory: async (id: string): Promise<boolean> => {
        try {
            const response = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
            return response.ok;
        } catch { return false; }
    }
};

