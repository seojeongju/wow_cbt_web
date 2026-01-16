// /api/auth/register
export async function onRequestPost(context) {
    const { request, env } = context;

    try {
        const { email, password, name, phone, selectedCourses, role } = await request.json();

        // Validate input
        if (!email || !password || !name) {
            return new Response(JSON.stringify({
                success: false,
                message: '필수 정보를 모두 입력해주세요.'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Check if email already exists
        const { results: existing } = await env.DB.prepare(
            'SELECT id FROM users WHERE email = ?'
        ).bind(email).all();

        if (existing.length > 0) {
            return new Response(JSON.stringify({
                success: false,
                message: '이미 사용 중인 이메일입니다.'
            }), {
                status: 409,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Get system settings for course approval
        const { results: settings } = await env.DB.prepare(
            'SELECT * FROM system_settings WHERE key = ?'
        ).bind('requireCourseApproval').all();

        const settingsMap = {};
        settings.forEach(s => {
            settingsMap[s.key] = s.value === 'true';
        });

        // Course approval still required (default: true)
        const requireCourseApproval = settingsMap.requireCourseApproval !== false;

        // Generate user ID
        const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Create user
        // SECURITY UPDATE:
        // Admin: approved = 0 (Requires manual approval)
        // Student: approved = 1 (Immediate dashboard access)
        const userApproved = (role === 'admin') ? 0 : 1;

        await env.DB.prepare(`
            INSERT INTO users (id, email, password, name, phone, role, approved)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).bind(userId, email, password, name, phone || '', role || 'student', userApproved).run();

        // Create course enrollments if student
        if (role === 'student' && selectedCourses && selectedCourses.length > 0) {
            // Get course IDs by names
            const placeholders = selectedCourses.map(() => '?').join(',');
            const { results: courses } = await env.DB.prepare(
                `SELECT id, name FROM courses WHERE name IN (${placeholders})`
            ).bind(...selectedCourses).all();

            // Course enrollments require admin approval to access exams
            const enrollmentStatus = requireCourseApproval ? 'pending' : 'approved';

            for (const course of courses) {
                const enrollmentId = `enroll_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                await env.DB.prepare(`
                    INSERT INTO course_enrollments (id, user_id, course_id, status)
                    VALUES (?, ?, ?, ?)
                `).bind(enrollmentId, userId, course.id, enrollmentStatus).run();
            }
        }

        return new Response(JSON.stringify({
            success: true,
            message: '회원가입이 완료되었습니다!'
        }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Register error:', error);
        return new Response(JSON.stringify({
            success: false,
            message: '회원가입 처리 중 오류가 발생했습니다.'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
