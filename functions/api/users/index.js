// GET /api/users - Get all users with enrollment info
export async function onRequestGet(context) {
    const { env } = context;

    try {
        // Get all users
        const { results: users } = await env.DB.prepare(`
            SELECT 
                id, email, name, phone, role, approved, last_login_at, created_at
            FROM users
            ORDER BY created_at DESC
        `).all();

        // Get enrollments for all users
        const { results: enrollments } = await env.DB.prepare(`
            SELECT 
                ce.user_id,
                ce.course_id,
                ce.status,
                ce.expires_at,
                c.name as course_name_from_db
            FROM course_enrollments ce
            LEFT JOIN courses c ON ce.course_id = c.id
        `).all();

        // Group enrollments by user
        const enrollmentsByUser = {};
        enrollments.forEach(e => {
            if (!enrollmentsByUser[e.user_id]) {
                enrollmentsByUser[e.user_id] = { approved: [], pending: [] };
            }

            const enrollment = {
                courseId: e.course_id,
                courseName: e.course_name_from_db || e.course_id, // Fallback
                status: e.status,
                expiresAt: e.expires_at
            };

            if (e.status === 'active' || e.status === 'approved') {
                enrollmentsByUser[e.user_id].approved.push(enrollment);
            } else if (e.status === 'pending') {
                enrollmentsByUser[e.user_id].pending.push(enrollment);
            }
        });

        // Combine user data with enrollments
        const usersWithEnrollments = users.map(u => ({
            ...u,
            approved: Boolean(u.approved),
            courseEnrollments: enrollmentsByUser[u.id]?.approved || [],
            pendingCourses: enrollmentsByUser[u.id]?.pending.map(p => p.courseName) || []
        }));

        return new Response(JSON.stringify({
            success: true,
            users: usersWithEnrollments
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Get users error:', error);
        return new Response(JSON.stringify({
            success: false,
            message: '사용자 목록을 불러오는 중 오류가 발생했습니다.'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
