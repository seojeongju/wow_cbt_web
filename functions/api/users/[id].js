// PUT /api/users/[id] - Update user
export async function onRequestPut(context) {
    const { request, env, params } = context;
    const userId = params.id;

    try {
        const { name, phone, email, approved } = await request.json();

        // Check if user exists
        const { results: existing } = await env.DB.prepare(
            'SELECT id FROM users WHERE id = ?'
        ).bind(userId).all();

        if (existing.length === 0) {
            return new Response(JSON.stringify({
                success: false,
                message: '사용자를 찾을 수 없습니다.'
            }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Build update query
        const updates = [];
        const params = [];

        if (name !== undefined) {
            updates.push('name = ?');
            params.push(name);
        }
        if (phone !== undefined) {
            updates.push('phone = ?');
            params.push(phone);
        }
        if (email !== undefined) {
            updates.push('email = ?');
            params.push(email);
        }
        if (approved !== undefined) {
            updates.push('approved = ?');
            params.push(approved ? 1 : 0);
        }

        if (updates.length === 0) {
            return new Response(JSON.stringify({
                success: false,
                message: '수정할 내용이 없습니다.'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        params.push(userId);
        const query = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;

        await env.DB.prepare(query).bind(...params).run();

        return new Response(JSON.stringify({
            success: true,
            message: '사용자 정보가 수정되었습니다.'
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Update user error:', error);
        return new Response(JSON.stringify({
            success: false,
            message: '사용자 수정 중 오류가 발생했습니다.'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// DELETE /api/users/[id] - Delete user
export async function onRequestDelete(context) {
    const { env, params } = context;
    const userId = params.id;

    try {
        // Check if user exists
        const { results: existing } = await env.DB.prepare(
            'SELECT id FROM users WHERE id = ?'
        ).bind(userId).all();

        if (existing.length === 0) {
            return new Response(JSON.stringify({
                success: false,
                message: '사용자를 찾을 수 없습니다.'
            }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Delete user (CASCADE will handle related data)
        await env.DB.prepare('DELETE FROM users WHERE id = ?').bind(userId).run();

        return new Response(JSON.stringify({
            success: true,
            message: '사용자가 삭제되었습니다.'
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Delete user error:', error);
        return new Response(JSON.stringify({
            success: false,
            message: '사용자 삭제 중 오류가 발생했습니다.'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// POST /api/users/[id]/approve-course - Approve course enrollment
export async function onRequestPost(context) {
    const { request, env, params } = context;
    const userId = params.id;

    try {
        const { courseId, status } = await request.json(); // status: 'approved' or 'rejected'

        if (!courseId || !status) {
            return new Response(JSON.stringify({
                success: false,
                message: '과정 ID와 상태를 입력해주세요.'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Update enrollment status
        await env.DB.prepare(`
            UPDATE course_enrollments 
            SET status = ? 
            WHERE user_id = ? AND course_id = ?
        `).bind(status, userId, courseId).run();

        return new Response(JSON.stringify({
            success: true,
            message: status === 'approved' ? '과정이 승인되었습니다.' : '과정이 반려되었습니다.'
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Approve course error:', error);
        return new Response(JSON.stringify({
            success: false,
            message: '과정 승인 처리 중 오류가 발생했습니다.'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
