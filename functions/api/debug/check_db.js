
export async function onRequestGet(context) {
    const { env, request } = context;
    const url = new URL(request.url);
    const email = url.searchParams.get('email');

    if (!email) {
        return new Response("Please provide email param", { status: 400 });
    }

    try {
        const { results: user } = await env.DB.prepare("SELECT * FROM users WHERE email = ?").bind(email).all();

        if (user.length === 0) {
            return new Response("User not found", { status: 404 });
        }

        const userId = user[0].id;

        const { results: enrollments } = await env.DB.prepare(`
            SELECT ce.*, c.name as course_name 
            FROM course_enrollments ce
            LEFT JOIN courses c ON ce.course_id = c.id
            WHERE ce.user_id = ?
        `).bind(userId).all();

        return new Response(JSON.stringify({
            user: user[0],
            enrollments: enrollments
        }, null, 2), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (e) {
        return new Response(e.message, { status: 500 });
    }
}
