interface Env {
    DB: D1Database;
}

// Approve User (PATCH)
export const onRequestPatch: PagesFunction<Env> = async (context) => {
    const { env, params } = context;
    const id = params.id;

    await env.DB.prepare('UPDATE users SET approved = 1 WHERE id = ?').bind(id).run();

    return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
}

// Update User Info (PUT)
export const onRequestPut: PagesFunction<Env> = async (context) => {
    const { request, env, params } = context;
    const id = params.id;
    const body = await request.json() as any;
    const { name, email, phone, role, approved } = body;

    // Build dymamic query
    // Simple version: Update all allowed fields if provided
    // Note: Email uniqueness check omitted for simplicity in this MVP step, but recommended in prod.

    await env.DB.prepare(
        'UPDATE users SET name = ?, email = ?, phone = ?, role = ?, approved = ? WHERE id = ?'
    ).bind(name, email, phone, role, approved ? 1 : 0, id).run();

    return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
}

// Delete User (DELETE)
export const onRequestDelete: PagesFunction<Env> = async (context) => {
    const { env, params } = context;
    const id = params.id;

    await env.DB.prepare('DELETE FROM users WHERE id = ?').bind(id).run();

    return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json' } });
}
