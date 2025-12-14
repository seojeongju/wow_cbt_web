import { User } from '../types';

const STORAGE_KEY_USERS = 'wow_cbt_users';
const STORAGE_KEY_SESSION = 'wow_cbt_session';

export const AuthService = {
    getAllUsers: async (): Promise<User[]> => {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY_USERS) || '[]');
        } catch {
            return [];
        }
    },

    getCurrentUser: (): User | null => {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY_SESSION) || 'null');
        } catch {
            return null;
        }
    },

    login: async (email: string, password: string): Promise<User | null> => {
        const users = await AuthService.getAllUsers();
        const user = users.find(u => u.email === email && u.password === password);

        if (user) {
            // Update last login
            user.lastLoginAt = new Date().toISOString();
            // Save updated user to list
            const updatedUsers = users.map(u => u.id === user.id ? user : u);
            localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(updatedUsers));
            // Set session
            localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(user));
            return user;
        }
        return null;
    },

    logout: () => {
        localStorage.removeItem(STORAGE_KEY_SESSION);
        window.location.href = '/login';
    },

    register: async (userData: User): Promise<{ success: boolean; message: string }> => {
        const users = await AuthService.getAllUsers();
        if (users.some(u => u.email === userData.email)) return { success: false, message: '이미 존재하는 이메일입니다.' };

        const newUser = { ...userData, id: Date.now().toString(), createdAt: new Date().toISOString(), courseEnrollments: [] };
        // Determine role (first user is admin)
        if (users.length === 0) newUser.role = 'admin';

        localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify([...users, newUser]));
        return { success: true, message: '회원가입이 완료되었습니다.' };
    },

    updateUser: async (user: User): Promise<void> => {
        const users = await AuthService.getAllUsers();
        const updatedUsers = users.map(u => u.id === user.id ? user : u);
        localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(updatedUsers));

        // Update session if it's current user
        const currentUser = AuthService.getCurrentUser();
        if (currentUser && currentUser.id === user.id) {
            localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(user));
        }
    },

    deleteUser: async (id: string): Promise<void> => {
        const users = await AuthService.getAllUsers();
        const filtered = users.filter(u => u.id !== id);
        localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(filtered));
    },

    findId: async (name: string, phone: string): Promise<string | null> => {
        const users = await AuthService.getAllUsers();
        const user = users.find(u => u.name === name && u.phone === phone);
        return user ? user.email : null;
    },

    resetPassword: async (name: string, email: string, phone: string): Promise<string | null> => {
        const users = await AuthService.getAllUsers();
        const user = users.find(u => u.name === name && u.email === email && u.phone === phone);
        if (user) {
            const tempPass = Math.random().toString(36).slice(-8);
            user.password = tempPass; // Should hash in real app
            localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users.map(u => u.id === user.id ? user : u)));
            return tempPass;
        }
        return null;
    },

    approveUser: async (userId: string): Promise<void> => {
        const users = await AuthService.getAllUsers();
        const updatedUsers = users.map(u => u.id === userId ? { ...u, approved: true } : u);
        localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(updatedUsers));
    },

    approveCourseRequest: async (userId: string, courseName: string, durationMonths?: number): Promise<void> => {
        const users = await AuthService.getAllUsers();
        const userIdx = users.findIndex(u => u.id === userId);
        if (userIdx !== -1) {
            const enrollments = users[userIdx].courseEnrollments || [];
            const targetIdx = enrollments.findIndex(e => e.courseName === courseName);
            if (targetIdx !== -1) {
                enrollments[targetIdx].status = 'active';
                enrollments[targetIdx].enrolledAt = new Date().toISOString();
                if (durationMonths) {
                    const d = new Date();
                    d.setMonth(d.getMonth() + durationMonths);
                    enrollments[targetIdx].expiresAt = d.toISOString();
                }
                users[userIdx].courseEnrollments = enrollments;
                localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
            }
        }
    },

    rejectCourseRequest: async (userId: string, courseName: string): Promise<void> => {
        const users = await AuthService.getAllUsers();
        const userIdx = users.findIndex(u => u.id === userId);
        if (userIdx !== -1) {
            const enrollments = users[userIdx].courseEnrollments || [];
            const targetIdx = enrollments.findIndex(e => e.courseName === courseName);
            if (targetIdx !== -1) {
                enrollments[targetIdx].status = 'rejected';
                users[userIdx].courseEnrollments = enrollments;
                localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
            }
        }
    }
};
