import { Inquiry } from '../types';

const STORAGE_KEY = 'wow_cbt_inquiries';

export const SupportService = {
    getAllInquiries: async (): Promise<Inquiry[]> => {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch { return []; }
    },

    getInquiriesByUser: async (userId: string): Promise<Inquiry[]> => {
        const all = await SupportService.getAllInquiries();
        return all.filter(i => i.userId === userId);
    },

    createInquiry: async (inquiry: Omit<Inquiry, 'id' | 'createdAt' | 'status'>): Promise<void> => {
        const inquiries = await SupportService.getAllInquiries();
        const newInquiry: Inquiry = {
            ...inquiry,
            id: Date.now().toString(),
            status: 'PENDING',
            createdAt: new Date().toISOString()
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify([newInquiry, ...inquiries]));
    },

    updateInquiry: async (id: string, answer: string): Promise<boolean> => {
        const inquiries = await SupportService.getAllInquiries();
        const idx = inquiries.findIndex(i => i.id === id);
        if (idx === -1) return false;

        inquiries[idx] = {
            ...inquiries[idx],
            answer,
            answeredAt: new Date().toISOString(),
            status: 'RESOLVED'
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(inquiries));
        return true;
    },

    deleteInquiry: async (id: string): Promise<boolean> => {
        const inquiries = await SupportService.getAllInquiries();
        const filtered = inquiries.filter(i => i.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
        return true;
    }
};
