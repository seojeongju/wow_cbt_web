import { ExamResult } from '../types';

export interface OverviewStats {
    totalStudents: number;
    totalQuestions: number;
    avgPassRate: number;
    totalExams: number;
    avgScore: number;
    weeklyExams: number;
    pendingUsers: number;
    pendingCourses: number;
    // Added for compatibility
    passRate?: number;
    activeUsers?: number;
}

export interface CourseStat {
    name: string;
    studentCount: number;
    avgScore: number;
}

export interface CategoryStat {
    name: string;
    score: number;
    count: number;
    wrongCount?: number;
}

export interface StudentStat {
    id: string;
    name: string;
    examCount: number;
    avgScore: number;
    lastActive: string;
}

export interface WeeklyTrend {
    date: string;
    exams: number;
}

export const AnalyticsService = {
    // Get all global exam history from API
    getGlobalExamHistory: async (): Promise<ExamResult[]> => {
        try {
            const response = await fetch('/api/exam-results');
            const data = await response.json();
            return (data.results || []).map((r: any) => ({
                id: r.id,
                userId: r.user_id,
                examId: r.exam_id,
                examTitle: r.exam_title,
                courseName: r.course_name,
                score: r.score,
                totalQuestions: r.total_questions,
                date: r.created_at,
                passed: r.status === 'pass',
                answers: r.answers,
                status: 'completed'
            }));
        } catch { return []; }
    },

    // In a real D1 implementation, these aggregations should be done on the server side (SQL GROUP BY)
    // For MVP transition, we'll fetch full data and aggregate on client if API lacks specific endpoints,
    // OR ideally implement /api/analytics endpoints.

    // For now, let's keep client-side aggregation but fetch data from D1 via existing endpoints.
    // In future steps, we should add /api/analytics/overview, etc.

    getOverviewStats: async (): Promise<OverviewStats> => {
        // Fetch users and results to calculate stats
        // This is inefficient but works for MVP without new backend endpoints.
        try {
            const usersRes = await (await fetch('/api/users')).json();
            const resultsRes = await (await fetch('/api/exam-results')).json();

            const users = usersRes.users || [];
            const results = resultsRes.results || [];

            const totalStudents = users.length;
            const totalExams = results.length;
            const avgScore = totalExams > 0
                ? Math.round(results.reduce((acc: number, r: any) => acc + r.score, 0) / totalExams)
                : 0;
            const passed = results.filter((r: any) => r.status === 'pass').length;
            const passRate = totalExams > 0 ? Math.round((passed / totalExams) * 100) : 0;

            // Weekly exams (last 7 days)
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
            const weeklyExams = results.filter((r: any) => new Date(r.created_at) > oneWeekAgo).length;

            const pendingUsers = users.filter((u: any) => !u.approved).length;
            const pendingCourses = users.reduce((acc: number, u: any) => acc + (u.pendingCourses?.length || 0), 0);

            // Active users (logged in last 7 days)
            const activeUsers = users.filter((u: any) => u.last_login_at && new Date(u.last_login_at) > oneWeekAgo).length;

            return {
                totalStudents,
                totalQuestions: 0, // Not easily available without another query, skip
                avgPassRate: passRate,
                totalExams,
                avgScore,
                weeklyExams,
                pendingUsers,
                pendingCourses,
                passRate,
                activeUsers
            };
        } catch (e) {
            console.error(e);
            return {
                totalStudents: 0, totalQuestions: 0, avgPassRate: 0, totalExams: 0,
                avgScore: 0, weeklyExams: 0, pendingUsers: 0, pendingCourses: 0
            };
        }
    },

    // Placeholder implementations for charts until we add SQL endpoints
    getCoursePerformance: async (): Promise<CourseStat[]> => { return []; },
    getCategoryPerformance: async (): Promise<CategoryStat[]> => { return []; },
    getStudentPerformance: async (): Promise<{ topPerformers: StudentStat[], atRiskStudents: StudentStat[] }> => {
        return { topPerformers: [], atRiskStudents: [] };
    },
    getWeeklyTrend: async (): Promise<WeeklyTrend[]> => { return []; }
};

