// GET /api/courses - Get all courses
export async function onRequestGet(context) {
    const { env } = context;

    try {
        const { results: courses } = await env.DB.prepare(`
            SELECT 
                c.*,
                COUNT(DISTINCT e.id) as exam_count
            FROM courses c
            LEFT JOIN exams e ON c.id = e.course_id
            GROUP BY c.id
            ORDER BY c.created_at DESC
        `).all();

        return new Response(JSON.stringify({
            success: true,
            courses
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Get courses error:', error);
        return new Response(JSON.stringify({
            success: false,
            message: '과정 목록을 불러오는 중 오류가 발생했습니다.'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// POST /api/courses - Create course
export async function onRequestPost(context) {
    const { request, env } = context;

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

        // Check if course already exists
        const { results: existing } = await env.DB.prepare(
            'SELECT id FROM courses WHERE name = ?'
        ).bind(name.trim()).all();

        if (existing.length > 0) {
            return new Response(JSON.stringify({
                success: false,
                message: '이미 존재하는 과정입니다.'
            }), {
                status: 409,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const courseId = `course_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        await env.DB.prepare(`
            INSERT INTO courses (id, name, details) VALUES (?, ?, ?)
        `).bind(courseId, name.trim(), details ? JSON.stringify(details) : null).run();

        return new Response(JSON.stringify({
            success: true,
            courseId,
            message: '과정이 생성되었습니다.'
        }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Create course error:', error);
        return new Response(JSON.stringify({
            success: false,
            message: '과정 생성 중 오류가 발생했습니다.'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
