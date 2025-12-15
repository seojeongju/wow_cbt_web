import { User } from '../types';

const STORAGE_KEY_SESSION = 'wow_cbt_session';

const mapUser = (data: any): User => {
    return {
        id: data.id,
        email: data.email,
        name: data.name,
        phone: data.phone,
        role: data.role,
        approved: typeof data.approved === 'number' ? data.approved === 1 : data.approved,
        courseEnrollments: data.courseEnrollments || [],
        pendingCourses: data.pendingCourses || [],
        createdAt: data.created_at || data.createdAt,
        lastLoginAt: data.last_login_at || data.lastLoginAt,
        debug: data.debug // Pass through debug info
    };
};

export const AuthService = {
    // Get all users (Admin only)
    getAllUsers: async (): Promise<User[]> => {
        try {
            const response = await fetch('/api/users');
            if (!response.ok) throw new Error('Failed to fetch users');
            const data = await response.json();
            return (data.users || []).map(mapUser);
        } catch (error) {
            console.error('getAllUsers error:', error);
            return [];
        }
    },

    // Get Single User (for fresh data)
    getUserById: async (id: string): Promise<User | null> => {
        try {
            const response = await fetch(`/api/users/${id}`);
            if (!response.ok) throw new Error('Failed to fetch user');
            const data = await response.json();
            return mapUser(data.user);
        } catch (error) {
            console.error('getUserById error:', error);
            return null;
        }
    },

    // Refresh Session from Server
    refreshSession: async (): Promise<User | null> => {
        const localUser = AuthService.getCurrentUser();
        if (!localUser) return null;

        const freshUser = await AuthService.getUserById(localUser.id);
        if (freshUser) {
            if (localStorage.getItem(STORAGE_KEY_SESSION)) {
                localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(freshUser));
            } else {
                sessionStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(freshUser));
            }
            return freshUser;
        }
        return localUser;
    },

    // Get current user from session (sessionStorage priority, then localStorage)
    getCurrentUser: (): User | null => {
        try {
            const sessionData = sessionStorage.getItem(STORAGE_KEY_SESSION);
            if (sessionData) return JSON.parse(sessionData);

            const localData = localStorage.getItem(STORAGE_KEY_SESSION);
            if (localData) return JSON.parse(localData);

            return null;
        } catch {
            return null;
        }
    },

    // Login
    login: async (email: string, password: string, role: string, rememberMe: boolean = false): Promise<User | null> => {
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, role })
            });

            if (!response.ok) {
                const err = await response.json();
                console.error('Login failed:', err.message);
                throw new Error(err.message || '로그인에 실패했습니다.');
            }

            const data = await response.json();
            if (data.success && data.user) {
                const user = mapUser(data.user);

                // Save session based on rememberMe
                if (rememberMe) {
                    localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(user));
                    sessionStorage.removeItem(STORAGE_KEY_SESSION);
                } else {
                    sessionStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(user));
                    localStorage.removeItem(STORAGE_KEY_SESSION);
                }

                return user;
            }
            return null;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    },

    // Logout
    logout: () => {
        localStorage.removeItem(STORAGE_KEY_SESSION);
        sessionStorage.removeItem(STORAGE_KEY_SESSION);
        window.location.href = '/';
    },

    // Register
    register: async (userData: User): Promise<{ success: boolean; message: string }> => {
        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });

            const data = await response.json();
            return {
                success: data.success,
                message: data.message || (data.success ? '회원가입이 완료되었습니다.' : '회원가입 실패')
            };
        } catch (error) {
            console.error('Register error:', error);
            return { success: false, message: '서버 오류가 발생했습니다.' };
        }
    },

    // Update User
    updateUser: async (user: User): Promise<void> => {
        try {
            const response = await fetch(`/api/users/${user.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(user)
            });

            if (response.ok) {
                // Update session if it's current user
                const currentUser = AuthService.getCurrentUser();
                if (currentUser && currentUser.id === user.id) {
                    // Update cache responsibly (merge?)
                    const updatedUser = { ...currentUser, ...user };
                    if (localStorage.getItem(STORAGE_KEY_SESSION)) {
                        localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(updatedUser));
                    } else {
                        sessionStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(updatedUser));
                    }
                }
            } else {
                console.error('Update user failed');
            }
        } catch (error) {
            console.error('Update user error:', error);
        }
    },

    // Delete User
    deleteUser: async (id: string): Promise<void> => {
        try {
            await fetch(`/api/users/${id}`, { method: 'DELETE' });
        } catch (error) {
            console.error('Delete user error:', error);
        }
    },

    // Find ID
    findId: async (name: string, phone: string): Promise<string | null> => {
        try {
            const response = await fetch('/api/auth/find-id', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, phone })
            });

            const data = await response.json();
            if (data.success && data.email) {
                return data.email;
            }
            return null;
        } catch (error) {
            console.error('Find ID error:', error);
            return null;
        }
    },

    // Reset Password
    resetPassword: async (name: string, email: string, phone: string, newPassword?: string): Promise<string | null> => {
        try {
            // Use provided password or generate a random temporary password
            const passwordToSet = newPassword || Math.random().toString(36).slice(-8);

            const response = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, phone, newPassword: passwordToSet })
            });

            const data = await response.json();
            if (data.success) {
                return passwordToSet;
            }
            return null;
        } catch (error) {
            console.error('Reset password error:', error);
            return null;
        }
    },

    // Approve User
    approveUser: async (userId: string): Promise<void> => {
        try {
            await fetch(`/api/users/${userId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ approved: true })
            });
        } catch (error) {
            console.error('Approve user error:', error);
        }
    },

    // Approve Course Request
    approveCourseRequest: async (userId: string, courseName: string, durationMonths?: number): Promise<void> => {
        try {
            // Note: explicit courseId is required by backend, using courseName as ID if simple, or mapping logic needed?
            // Schema has courses table with ID. Backend expects courseId. 
            // LocalStorage implementation used courseName directly.
            // Assumption: Frontend passes courseName which effectively acts as ID or we need to look it up.
            // For now, passing courseName as courseId (MVP simplification)

            // Wait, local storage implementation used 'courseName' as key. 
            // In D1, we have a courses table.

            // Re-use courseName as courseId for now to avoid breaking changes, 
            // BUT strict schema might require valid FK.
            // If courseName matches course.id (e.g. 'course_3d_printer'), it works.

            await fetch(`/api/users/${userId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    courseId: courseName, // Assuming courseName is the ID for now
                    status: 'approved',
                    durationMonths
                })
            });
        } catch (error) {
            console.error('Approve course error:', error);
        }
    },

    // Reject Course Request
    rejectCourseRequest: async (userId: string, courseName: string): Promise<void> => {
        try {
            await fetch(`/api/users/${userId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    courseId: courseName,
                    status: 'rejected'
                })
            });
        } catch (error) {
            console.error('Reject course error:', error);
        }
    },

    // Modify Course Expiration
    modifyCourseExpiration: async (userId: string, courseName: string, expiresAt: string): Promise<void> => {
        try {
            const res = await fetch(`/api/users/${userId}/courses`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ courseId: courseName, expiresAt })
            });
            if (!res.ok) throw new Error('Failed to modify');
        } catch (error) {
            console.error('Modify course error:', error);
            throw error;
        }
    },

    // Revoke Course Access (Delete)
    revokeCourse: async (userId: string, courseName: string): Promise<void> => {
        try {
            const res = await fetch(`/api/users/${userId}/courses`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ courseId: courseName })
            });
            if (!res.ok) throw new Error('Failed to revoke');
        } catch (error) {
            console.error('Revoke course error:', error);
            throw error;
        }
    }
};
