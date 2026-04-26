// GET /api/users/[id] - Get single user with details
export async function onRequestGet(context) {
    const { env, params } = context;
    const userId = params.id;

    try {
        const user = await env.DB.prepare(`
            SELECT id, email, name, phone, role, approved, last_login_at, created_at
            FROM users WHERE id = ?
        `).bind(userId).first();

        if (!user) {
            return new Response(JSON.stringify({
                success: false,
                message: 'User not found'
            }), { status: 404 });
        }

        const { results: enrollments } = await env.DB.prepare(`
            SELECT 
                ce.course_id, ce.status, ce.expires_at,
                c.name as course_name_from_db
            FROM course_enrollments ce
            LEFT JOIN courses c ON ce.course_id = c.id
            WHERE ce.user_id = ?
        `).bind(userId).all();

        const approvedCourses = [];
        const pendingCourses = [];

        enrollments.forEach(e => {
            const enrollment = {
                courseId: e.course_id,
                courseName: e.course_name_from_db || e.course_id, // Fallback to ID if name join failed
                status: e.status,
                expiresAt: e.expires_at
            };

            if (e.status === 'active' || e.status === 'approved') {
                approvedCourses.push(enrollment);
            } else if (e.status === 'pending') {
                // Return full object for pending courses if possible, but frontend expects string[]?
                // Looking at frontend AuthService: pendingCourses: data.pendingCourses || []
                // If data.pendingCourses is string[], we should push string.
                // But let's check frontend usage.
                pendingCourses.push(enrollment.courseName);
            }
        });

        const userWithDetails = {
            ...user,
            approved: Boolean(user.approved),
            courseEnrollments: approvedCourses,
            pendingCourses: pendingCourses
        };

        return new Response(JSON.stringify({
            success: true,
            user: userWithDetails
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        return new Response(JSON.stringify({
            success: false,
            message: 'Error fetching user'
        }), { status: 500 });
    }
}

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

    console.log(`[Approve] Request for User: ${userId}`);

    try {
        const body = await request.json();
        const { courseId, status, durationMonths } = body;

        console.log(`[Approve] Body:`, body);

        if (!courseId || !status) {
            return new Response(JSON.stringify({
                success: false,
                message: '과정 ID와 상태를 입력해주세요.'
            }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }

        // Use 'approved' instead of 'active' because of DB CHECK constraint
        const dbStatus = status === 'approved' ? 'approved' : 'rejected';

        // Helper to run update
        const runUpdate = async (targetCourseId) => {
            let expiresAt = null;
            if (dbStatus === 'approved' && durationMonths) {
                const expireDate = new Date();
                expireDate.setMonth(expireDate.getMonth() + durationMonths);
                expiresAt = expireDate.toISOString();
            }

            console.log(`[Approve] Updating ${targetCourseId}, Status: ${dbStatus}, Expires: ${expiresAt}`);

            let query, queryParams;
            if (expiresAt) {
                query = `UPDATE course_enrollments SET status = ?, expires_at = ? WHERE user_id = ? AND course_id = ?`;
                queryParams = [dbStatus, expiresAt, userId, targetCourseId];
            } else {
                query = `UPDATE course_enrollments SET status = ? WHERE user_id = ? AND course_id = ?`;
                queryParams = [dbStatus, userId, targetCourseId];
            }

            return await env.DB.prepare(query).bind(...queryParams).run();
        };

        // 1. Try treating courseId as an actual ID (or whatever was passed)
        let result = await runUpdate(courseId);
        console.log(`[Approve] First attempt changes: ${result.meta.changes}`);

        // 2. If no rows changed, treat courseId as a Name and lookup the real ID
        if (result.meta.changes === 0) {
            console.log(`[Approve] No changes. Looking up course by name: ${courseId}`);
            const { results: courses } = await env.DB.prepare(
                'SELECT id FROM courses WHERE name = ?'
            ).bind(courseId).all();

            if (courses.length > 0) {
                const actualCourseId = courses[0].id;
                console.log(`[Approve] Found actual ID: ${actualCourseId}`);
                result = await runUpdate(actualCourseId);
                console.log(`[Approve] Second attempt changes: ${result.meta.changes}`);
            } else {
                console.log(`[Approve] Course name not found.`);
            }
        }

        if (result.meta.changes > 0) {
            return new Response(JSON.stringify({
                success: true,
                message: dbStatus === 'approved' ? '과정이 승인되었습니다.' : '과정이 반려되었습니다.'
            }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        } else {
            return new Response(JSON.stringify({
                success: false,
                message: '해당 과정의 수강 신청 내역을 찾을 수 없거나 이미 처리되었습니다.'
            }), { status: 404, headers: { 'Content-Type': 'application/json' } });
        }

    } catch (error) {
        console.error('[Approve] Error:', error);
        return new Response(JSON.stringify({
            success: false,
            message: '과정 승인 처리 중 오류가 발생했습니다: ' + error.message
        }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }
}
