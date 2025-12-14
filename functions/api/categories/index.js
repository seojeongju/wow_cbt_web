// GET /api/categories?courseId=xxx - Get categories for a course
export async function onRequestGet(context) {
    const { env, request } = context;
    const url = new URL(request.url);
    const courseId = url.searchParams.get('courseId');

    try {
        if (!courseId) {
            return new Response(JSON.stringify({
                success: false,
                message: '과정 ID를 입력해주세요.'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const { results: categories } = await env.DB.prepare(`
            SELECT * FROM categories 
            WHERE course_id = ? 
            ORDER BY created_at ASC
        `).bind(courseId).all();

        return new Response(JSON.stringify({
            success: true,
            categories: categories.map(c => ({ id: c.id, name: c.name }))
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Get categories error:', error);
        return new Response(JSON.stringify({
            success: false,
            message: '카테고리 목록을 불러오는 중 오류가 발생했습니다.'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// POST /api/categories - Create category
export async function onRequestPost(context) {
    const { request, env } = context;

    try {
        const { courseId, name } = await request.json();

        if (!courseId || !name) {
            return new Response(JSON.stringify({
                success: false,
                message: '과정 ID와 카테고리 이름을 입력해주세요.'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const categoryId = `cat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        await env.DB.prepare(`
            INSERT INTO categories (id, course_id, name) 
            VALUES (?, ?, ?)
        `).bind(categoryId, courseId, name).run();

        return new Response(JSON.stringify({
            success: true,
            categoryId,
            message: '카테고리가 추가되었습니다.'
        }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Create category error:', error);
        return new Response(JSON.stringify({
            success: false,
            message: '카테고리 추가 중 오류가 발생했습니다.'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
