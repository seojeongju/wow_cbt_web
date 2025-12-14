// /api/auth/login
export async function onRequestPost(context) {
    const { request, env } = context;

    try {
        const { email, password, role } = await request.json();

        // Validate input
        if (!email || !password || !role) {
            return new Response(JSON.stringify({
                success: false,
                message: '이메일, 비밀번호, 역할을 모두 입력해주세요.'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Query user from D1
        const { results } = await env.DB.prepare(
            'SELECT * FROM users WHERE email = ? AND role = ?'
        ).bind(email, role).all();

        if (results.length === 0) {
            return new Response(JSON.stringify({
                success: false,
                message: '사용자를 찾을 수 없습니다.'
            }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const user = results[0];

        // Check password (WARNING: Should use bcrypt in production)
        if (user.password !== password) {
            return new Response(JSON.stringify({
                success: false,
                message: '비밀번호가 일치하지 않습니다.'
            }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Check if user is approved
        if (!user.approved) {
            return new Response(JSON.stringify({
                success: false,
                message: '계정이 승인 대기 중입니다. 관리자 승인 후 이용 가능합니다.'
            }), {
                status: 403,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Update last login
        await env.DB.prepare(
            'UPDATE users SET last_login_at = datetime("now") WHERE id = ?'
        ).bind(user.id).run();

        // Get user's course enrollments
        const { results: enrollments } = await env.DB.prepare(`
            SELECT ce.*, c.name as course_name 
            FROM course_enrollments ce
            JOIN courses c ON ce.course_id = c.id
            WHERE ce.user_id = ? AND ce.status = 'approved'
        `).bind(user.id).all();

        // Get user's pending courses
        const { results: pending } = await env.DB.prepare(`
            SELECT ce.course_id, c.name as course_name 
            FROM course_enrollments ce
            JOIN courses c ON ce.course_id = c.id
            WHERE ce.user_id = ? AND ce.status = 'pending'
        `).bind(user.id).all();

        // Return user data (excluding password)
        const userData = {
            id: user.id,
            email: user.email,
            name: user.name,
            phone: user.phone,
            role: user.role,
            approved: user.approved,
            courseEnrollments: enrollments.map(e => ({
                courseId: e.course_id,
                courseName: e.course_name,
                status: e.status
            })),
            pendingCourses: pending.map(p => p.course_id)
        };

        return new Response(JSON.stringify({
            success: true,
            user: userData
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Login error:', error);
        return new Response(JSON.stringify({
            success: false,
            message: '로그인 처리 중 오류가 발생했습니다.'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
