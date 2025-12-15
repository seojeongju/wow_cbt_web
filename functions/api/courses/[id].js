// PUT /api/courses/[id] - Update course
export async function onRequestPut(context) {
    const { request, env, params } = context;
    const courseId = params.id;

    try {
        const { name, details } = await request.json();

        if (!name || !name.trim()) {
            return new Response(JSON.stringify({
                success: false,
                message: '과정 이름을 입력해주세요.'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Check if course exists
        const { results: existing } = await env.DB.prepare(
            'SELECT id FROM courses WHERE id = ?'
        ).bind(courseId).all();

        if (existing.length === 0) {
            return new Response(JSON.stringify({
                success: false,
                message: '과정을 찾을 수 없습니다.'
            }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Dynamic Query Construction
        let query = 'UPDATE courses SET name = ?';
        const bindParams = [name.trim()];

        // If details provided, update it (JSON stringify)
        if (details !== undefined) {
            query += ', details = ?';
            bindParams.push(JSON.stringify(details));
        }

        query += ' WHERE id = ?';
        bindParams.push(courseId);

        await env.DB.prepare(query).bind(...bindParams).run();

        return new Response(JSON.stringify({
            success: true,
            message: '과정이 수정되었습니다.'
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Update course error:', error);
        return new Response(JSON.stringify({
            success: false,
            message: '과정 수정 중 오류가 발생했습니다.'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// DELETE /api/courses/[id] - Delete course
export async function onRequestDelete(context) {
    const { env, params } = context;
    const courseId = params.id;

    try {
        // Check if course exists
        const { results: existing } = await env.DB.prepare(
            'SELECT id FROM courses WHERE id = ?'
        ).bind(courseId).all();

        if (existing.length === 0) {
            return new Response(JSON.stringify({
                success: false,
                message: '과정을 찾을 수 없습니다.'
            }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Delete course (CASCADE will delete related data)
        await env.DB.prepare('DELETE FROM courses WHERE id = ?').bind(courseId).run();

        return new Response(JSON.stringify({
            success: true,
            message: '과정이 삭제되었습니다.'
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Delete course error:', error);
        return new Response(JSON.stringify({
            success: false,
            message: '과정 삭제 중 오류가 발생했습니다.'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
