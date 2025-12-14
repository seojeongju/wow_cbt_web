// ============================================
// Settings Service (Hybrid: LocalStorage + D1 Sync)
// ============================================

export interface SystemSettings {
    requireUserApproval: boolean;
    requireCourseApproval?: boolean;
    allowSelfRegistration?: boolean;
    maintenanceMode?: boolean;
    sessionTimeout?: number;
    passingScore?: number;
}

const STORAGE_KEY = 'wow_cbt_settings';

const DEFAULT_SETTINGS: SystemSettings = {
    requireUserApproval: true,
    requireCourseApproval: true,
    allowSelfRegistration: true,
    maintenanceMode: false,
    sessionTimeout: 30, // minutes
    passingScore: 60
};

export const SettingsService = {
    // 1. Get Settings (Async from D1)
    getSettings: async (): Promise<SystemSettings> => {
        try {
            const response = await fetch('/api/settings');
            if (!response.ok) throw new Error('Failed to fetch settings');
            const data = await response.json();
            return { ...DEFAULT_SETTINGS, ...data.settings };
        } catch (error) {
            console.error('getSettings error:', error);
            // Fallback to defaults
            return DEFAULT_SETTINGS;
        }
    },

    // 2. Update Settings (Async to D1)
    updateSettings: async (newSettings: SystemSettings): Promise<void> => {
        try {
            await fetch('/api/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newSettings)
            });
        } catch (error) {
            console.error('updateSettings error:', error);
        }
    },

    // =========================================
    // Backup & Restore Features (Deprecated or Need DB migration logic)
    // =========================================

    createBackup: (selection: string[]): string => {
        const backupData: any = {
            timestamp: new Date().toISOString(),
            version: '1.0'
        };

        try {
            if (selection.includes('settings')) {
                backupData.settings = localStorage.getItem(STORAGE_KEY);
            }
            if (selection.includes('users')) {
                backupData.users = localStorage.getItem('wow_cbt_users');
            }
            if (selection.includes('exams')) {
                backupData.exams = localStorage.getItem('wow_cbt_exam_data');
            }

            return JSON.stringify(backupData, null, 2);
        } catch (error) {
            console.error('Backup creation failed', error);
            return '{}';
        }
    },

    getBackupStats: (jsonContent: string) => {
        try {
            const data = JSON.parse(jsonContent);
            const stats: any = {};

            if (data.settings) stats.settings = 1;
            if (data.users) stats.users = Object.keys(JSON.parse(data.users || '{}')).length;
            if (data.exams) stats.exams = Object.keys(JSON.parse(data.exams || '{}')).length;

            return stats;
        } catch (error) {
            console.error('Invalid backup file', error);
            return null;
        }
    },

    restoreBackup: async (jsonContent: string, selection: string[]) => {
        try {
            const data = JSON.parse(jsonContent);
            let restoreCount = 0;

            if (selection.includes('settings') && data.settings) {
                localStorage.setItem(STORAGE_KEY, data.settings);
                restoreCount++;
            }

            if (selection.includes('users') && data.users) {
                localStorage.setItem('wow_cbt_users', data.users);
                restoreCount++;
            }

            if (selection.includes('exams') && data.exams) {
                localStorage.setItem('wow_cbt_exam_data', data.exams);
                restoreCount++;
            }

            return { success: true, count: restoreCount, message: `Restored ${restoreCount} items successfully.` };
        } catch (error) {
            console.error('Restore failed', error);
            return { success: false, message: 'Restore failed: Invalid file format' };
        }
    }
};
