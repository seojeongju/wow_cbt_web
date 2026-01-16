import { Inquiry } from '../types';

export const SupportService = {
    getAllInquiries: async (): Promise<Inquiry[]> => {
        try {
            const response = await fetch('/api/support');
            const data = await response.json();
            return (data.tickets || []).map(mapToInquiry);
        } catch { return []; }
    },

    getInquiriesByUser: async (userId: string): Promise<Inquiry[]> => {
        try {
            const response = await fetch(`/api/support?userId=${userId}`);
            const data = await response.json();
            return (data.tickets || []).map(mapToInquiry);
        } catch { return []; }
    },

    createInquiry: async (inquiry: Omit<Inquiry, 'id' | 'createdAt' | 'status'>): Promise<void> => {
        try {
            await fetch('/api/support', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(inquiry)
            });
        } catch (error) { console.error(error); }
    },

    updateInquiry: async (id: string, answer: string): Promise<boolean> => {
        try {
            const response = await fetch(`/api/support/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    adminReply: answer,
                    status: 'answered'   // DB schema: CHECK(status IN ('pending', 'answered'))
                })
            });
            return response.ok;
        } catch { return false; }
    },

    deleteInquiry: async (id: string): Promise<boolean> => {
        try {
            // Assuming DELETE /api/support/:id exists
            const response = await fetch(`/api/support/${id}`, { method: 'DELETE' });
            return response.ok;
        } catch { return false; }
    }
};

const mapToInquiry = (data: any): Inquiry => ({
    id: data.id,
    userId: data.user_id,
    userName: data.user_name,
    userEmail: data.user_email,
    category: data.category,
    title: data.title,
    content: data.content,
    status: data.status === 'answered' ? 'RESOLVED' : (data.status || 'PENDING').toUpperCase() as any,
    createdAt: data.created_at,
    answer: data.admin_reply,
    answeredAt: data.updated_at
});
