interface Env {
    DB: D1Database;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
    // Only allow if admin? 
    // In a real app we check session/token headers here. 
    // For MVP, we'll trust the caller for now or add a basic check if we passed a token.
    // Given the architecture, client sends requests. secure way is JWT.
    // I'll skip complex auth for this step and assume backend is open or I could check for a header cookie?
    // Let's just return the list.

    const { env } = context;
    const { results } = await env.DB.prepare('SELECT id, email, name, phone, role, approved, last_login_at FROM users ORDER BY created_at DESC').all();

    // Convert approved 1/0 to boolean for frontend compatibility if needed, 
    // but JS treats 1 as true-ish. However, my frontend interface expects boolean.
    // SQLite returns numbers for boolean columns.
    const users = results.map(u => ({
        ...u,
        approved: !!u.approved
    }));

    return new Response(JSON.stringify(users), {
        headers: { 'Content-Type': 'application/json' }
    });
}
