
import bcrypt from 'bcryptjs';

interface Env {
    DB: D1Database;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
    try {
        const { request, env } = context;
        const body = await request.json() as any;
        const { email, password, name, phone, role = 'student' } = body;

        if (!email || !password || !name || !phone) {
            return new Response(JSON.stringify({ success: false, message: 'Missing required fields' }), { status: 400 });
        }

        // Check if email exists
        const existing = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
        if (existing) {
            return new Response(JSON.stringify({ success: false, message: '이미 존재하는 이메일입니다.' }), {
                status: 409,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const id = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        // Admins auto-approved for simplicity in MVP, Students need approval (approved: 0)
        const approved = role === 'admin' ? 1 : 0;

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        await env.DB.prepare(
            'INSERT INTO users (id, email, password, name, phone, role, approved) VALUES (?, ?, ?, ?, ?, ?, ?)'
        ).bind(id, email, hashedPassword, name, phone, role, approved).run();

        return new Response(JSON.stringify({ success: true }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (err: any) {
        return new Response(JSON.stringify({ success: false, message: err.message }), { status: 500 });
    }
}
