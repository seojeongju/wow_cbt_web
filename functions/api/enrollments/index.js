
// POST /api/enrollments - Request course enrollment
export async function onRequestPost(context) {
    const { request, env } = context;

    try {
        const { userId, courseId } = await request.json();

        if (!userId || !courseId) {
            return new Response(JSON.stringify({
                success: false,
                message: '사용자 ID와 과정 ID가 필요합니다.'
            }), { status: 400 });
        }

        // Ensure clean data types
        const cleanUserId = String(userId).trim();
        // Keep courseId as comes (likely number or string), let SQLite handle loose typing for ID but created_at is explicit

        // Check if already enrolled
        const existing = await env.DB.prepare(
            'SELECT * FROM course_enrollments WHERE user_id = ? AND course_id = ?'
        ).bind(cleanUserId, courseId).first();

        if (existing) {
            // If already exists but status is something weird, maybe update?
            // For now, just return conflict behavior
            return new Response(JSON.stringify({
                success: false,
                message: '이미 신청했거나 수강 중인 과정입니다.'
            }), { status: 409 });
        }

        // Check system settings for auto-approval
        const setting = await env.DB.prepare(
            "SELECT value FROM system_settings WHERE key = 'requireCourseApproval'"
        ).first();

        const requireApproval = setting ? setting.value === 'true' : true;
        const status = requireApproval ? 'pending' : 'active'; // active if no approval needed

        // Insert enrollment with explicit created_at
        const enrollmentId = `enroll_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await env.DB.prepare(
            'INSERT INTO course_enrollments (id, user_id, course_id, status, created_at) VALUES (?, ?, ?, ?, datetime("now"))'
        ).bind(enrollmentId, cleanUserId, courseId, status).run();

        return new Response(JSON.stringify({
            success: true,
            enrollmentId,
            status,
            message: status === 'pending' ? '수강 신청이 완료되었습니다. 관리자 승인을 기다려주세요.' : '수강 신청이 승인되었습니다.'
        }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Enrollment error:', error);
        return new Response(JSON.stringify({
            success: false,
            message: '수강 신청 중 오류가 발생했습니다.'
        }), { status: 500 });
    }
}
