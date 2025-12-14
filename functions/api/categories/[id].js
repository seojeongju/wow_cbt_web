// PUT /api/categories/[id] - Update category
export async function onRequestPut(context) {
    const { request, env, params } = context;
    const categoryId = params.id;

    try {
        const { name } = await request.json();

        if (!name) {
            return new Response(JSON.stringify({
                success: false,
                message: '카테고리 이름을 입력해주세요.'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        await env.DB.prepare('UPDATE categories SET name = ? WHERE id = ?')
            .bind(name, categoryId).run();

        return new Response(JSON.stringify({
            success: true,
            message: '카테고리가 수정되었습니다.'
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        return new Response(JSON.stringify({ success: false, message: error.message }), { status: 500 });
    }
}

// DELETE /api/categories/[id]
export async function onRequestDelete(context) {
    const { env, params } = context;
    const categoryId = params.id;

    try {
        await env.DB.prepare('DELETE FROM categories WHERE id = ?').bind(categoryId).run();
        return new Response(JSON.stringify({
            success: true,
            message: '카테고리가 삭제되었습니다.'
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        return new Response(JSON.stringify({ success: false, message: error.message }), { status: 500 });
    }
}
