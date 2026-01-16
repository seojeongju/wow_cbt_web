export async function onRequestPut(context) {
    const { request, env, params } = context;
    const id = params.id;

    try {
        const { name } = await request.json();
        await env.DB.prepare('UPDATE subjects SET name = ? WHERE id = ?').bind(name, id).run();

        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (error) {
        return new Response(JSON.stringify({ success: false, message: error.message }), { status: 500 });
    }
}

export async function onRequestDelete(context) {
    const { env, params } = context;
    const id = params.id;

    try {
        await env.DB.prepare('DELETE FROM subjects WHERE id = ?').bind(id).run();

        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (error) {
        return new Response(JSON.stringify({ success: false, message: error.message }), { status: 500 });
    }
}
