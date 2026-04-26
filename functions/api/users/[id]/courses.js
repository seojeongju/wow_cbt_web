
export async function onRequestPut(context) {
    const { request, env, params } = context;
    const userId = params.id;

    try {
        const { courseId, expiresAt } = await request.json();

        if (!courseId || !expiresAt) {
            return new Response(JSON.stringify({
                success: false,
                message: '과정 ID와 만료일을 입력해주세요.'
            }), { status: 400 });
        }

        // courseId가 이름일 경우 ID 조회 (기존 로직과 일관성 유지)
        let actualCourseId = courseId;
        if (!courseId.startsWith('course_')) {
            const { results } = await env.DB.prepare('SELECT id FROM courses WHERE name = ?').bind(courseId).all();
            if (results.length > 0) actualCourseId = results[0].id;
        }

        const result = await env.DB.prepare(`
            UPDATE course_enrollments
            SET expires_at = ?
            WHERE user_id = ? AND course_id = ?
        `).bind(expiresAt, userId, actualCourseId).run();

        if (result.meta.changes > 0) {
            return new Response(JSON.stringify({ success: true, message: '수강 기간이 수정되었습니다.' }), { status: 200 });
        } else {
            return new Response(JSON.stringify({ success: false, message: '수강 내역을 찾을 수 없습니다.' }), { status: 404 });
        }
    } catch (e) {
        return new Response(JSON.stringify({ success: false, message: e.message }), { status: 500 });
    }
}

export async function onRequestDelete(context) {
    const { request, env, params } = context;
    const userId = params.id;

    try {
        const { courseId } = await request.json();

        if (!courseId) {
            return new Response(JSON.stringify({
                success: false,
                message: '과정 ID를 입력해주세요.'
            }), { status: 400 });
        }

        // courseId가 이름일 경우 ID 조회
        let actualCourseId = courseId;
        if (!courseId.startsWith('course_')) {
            const { results } = await env.DB.prepare('SELECT id FROM courses WHERE name = ?').bind(courseId).all();
            if (results.length > 0) actualCourseId = results[0].id;
        }

        // 실제로 삭제하거나 status를 'rejected'/'expired'로 변경?
        // "삭제" 기능이므로 데이터를 지우는 것이 맞지만, 이력 관리를 위해 status='rejected'로 처리하겠습니다.
        // 하지만 사용자가 '삭제'를 요청했으므로 아예 없던 걸로 하는게 깔끔할 수 있습니다.
        // 여기서는 DELETE 쿼리를 사용하여 완전히 삭제하겠습니다. (재신청 가능하도록)

        const result = await env.DB.prepare(`
            DELETE FROM course_enrollments
            WHERE user_id = ? AND course_id = ?
        `).bind(userId, actualCourseId).run();

        if (result.meta.changes > 0) {
            return new Response(JSON.stringify({ success: true, message: '수강 내역이 삭제되었습니다.' }), { status: 200 });
        } else {
            return new Response(JSON.stringify({ success: false, message: '수강 내역을 찾을 수 없습니다.' }), { status: 404 });
        }

    } catch (e) {
        return new Response(JSON.stringify({ success: false, message: e.message }), { status: 500 });
    }
}
