import { ExamResult, User, Question } from '../types';

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
    wrongCount: number;
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
    count: number;
}

let _cache: Promise<{ users: User[], results: any[], questions: any[] }> | null = null;

const getSharedData = () => {
    if (!_cache) {
        _cache = Promise.all([
            fetch('/api/users').then(res => res.json()),
            fetch('/api/exam-results').then(res => res.json()),
            fetch('/api/questions').then(res => res.json())
        ]).then(([usersRes, resultsRes, questionsRes]) => ({
            users: usersRes.users || [],
            results: resultsRes.results || [],
            questions: questionsRes.questions || []
        })).catch(err => {
            console.error("Failed to fetch shared analytics data", err);
            return { users: [], results: [], questions: [] };
        });
    }
    return _cache;
};

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

    getOverviewStats: async (): Promise<OverviewStats> => {
        try {
            const { users, results, questions } = await getSharedData();

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
                totalQuestions: questions.length,
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

    getCoursePerformance: async (): Promise<CourseStat[]> => {
        const { results } = await getSharedData();
        const courses = new Map<string, { totalScore: number, count: number, students: Set<string> }>();

        results.forEach(r => {
            const name = r.course_name || 'Unknown';
            const current = courses.get(name) || { totalScore: 0, count: 0, students: new Set() };
            current.totalScore += r.score;
            current.count += 1;
            if (r.user_id) current.students.add(r.user_id);
            courses.set(name, current);
        });

        return Array.from(courses.entries()).map(([name, stats]) => ({
            name,
            avgScore: Math.round(stats.totalScore / stats.count),
            studentCount: stats.students.size
        }));
    },

    getCategoryPerformance: async (): Promise<CategoryStat[]> => {
        const { results, questions } = await getSharedData();
        const questionMap = new Map(questions.map((q: any) => [q.id, q]));
        const categoryStats = new Map<string, { correct: number, wrong: number }>();

        results.forEach(r => {
            const answers = typeof r.answers === 'string' ? JSON.parse(r.answers) : r.answers;
            if (!answers) return;

            Object.entries(answers).forEach(([qId, answerIdx]) => {
                const question = questionMap.get(qId);
                if (!question || !question.category) return;

                const catStats = categoryStats.get(question.category) || { correct: 0, wrong: 0 };
                // Assuming answerIdx matches correct_answer. Note: correct_answer might be index or string.
                // We need to compare loosely or strictly depending on backend.
                // Usually correct_answer is 0-3.
                const isCorrect = String(answerIdx) === String(question.correct_answer);

                if (isCorrect) catStats.correct++;
                else catStats.wrong++;

                categoryStats.set(question.category, catStats);
            });
        });

        return Array.from(categoryStats.entries()).map(([name, stats]) => {
            const total = stats.correct + stats.wrong;
            return {
                name,
                wrongCount: stats.wrong,
                count: total,
                score: total > 0 ? Math.round((stats.correct / total) * 100) : 0
            };
        }).sort((a, b) => b.wrongCount - a.wrongCount);
    },

    getStudentPerformance: async (): Promise<{ topPerformers: StudentStat[], atRiskStudents: StudentStat[] }> => {
        const { users, results } = await getSharedData();
        const userMap = new Map<string, User>(users.map((u: any) => [u.id, u]));
        const stats = new Map<string, { totalScore: number, count: number, lastActive: string }>();

        results.forEach(r => {
            if (!r.user_id) return;
            const current = stats.get(r.user_id) || { totalScore: 0, count: 0, lastActive: r.created_at };
            current.totalScore += r.score;
            current.count += 1;
            if (new Date(r.created_at) > new Date(current.lastActive)) {
                current.lastActive = r.created_at;
            }
            stats.set(r.user_id, current);
        });

        const studentStats: StudentStat[] = Array.from(stats.entries()).map(([userId, data]) => {
            const user = userMap.get(userId);
            return {
                id: userId,
                name: user ? user.name : 'Unknown',
                examCount: data.count,
                avgScore: Math.round(data.totalScore / data.count),
                lastActive: data.lastActive
            };
        });

        const topPerformers = [...studentStats].sort((a, b) => b.avgScore - a.avgScore).slice(0, 5);
        const atRiskStudents = studentStats.filter(s => s.avgScore < 60 || s.examCount < 2); // Example criteria

        return { topPerformers, atRiskStudents };
    },

    getWeeklyTrend: async (): Promise<WeeklyTrend[]> => {
        const { results } = await getSharedData();
        const dailyCounts = new Map<string, number>();

        // Initialize last 7 days with 0
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const key = d.toISOString().split('T')[0];
            dailyCounts.set(key, 0);
        }

        results.forEach(r => {
            const dateStr = new Date(r.created_at).toISOString().split('T')[0];
            if (dailyCounts.has(dateStr)) {
                dailyCounts.set(dateStr, (dailyCounts.get(dateStr) || 0) + 1);
            }
        });

        return Array.from(dailyCounts.entries()).map(([date, count]) => ({
            date: date.substring(5), // MM-DD format
            count
        }));
    }
};

