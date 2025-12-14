
import bcrypt from 'bcryptjs';

interface Env {
    DB: D1Database;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
    try {
        const { request, env } = context;
        const body = await request.json() as any;
        const { email, password } = body;

        if (!email || !password) {
            return new Response(JSON.stringify({ success: false, message: 'Email and password required' }), { status: 400 });
        }

        const user = await env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();

        if (!user) {
            return new Response(JSON.stringify({ success: false, message: '이메일 또는 비밀번호가 일치하지 않습니다.' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const dbPassword = user.password as string;
        let isValid = false;

        // Try bcrypt compare
        try {
            isValid = await bcrypt.compare(password, dbPassword);
        } catch (e) {
            // Ignore bcrypt errors (e.g. invalid salt), proceed to plaintext check
        }

        // Lazy Migration: Check plaintext if bcrypt failed
        if (!isValid && dbPassword === password) {
            isValid = true;
            console.log(`Migrating user ${email} to hashed password.`);
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash(password, salt);
            await env.DB.prepare('UPDATE users SET password = ? WHERE id = ?').bind(hash, user.id).run();
        }

        if (!isValid) {
            return new Response(JSON.stringify({ success: false, message: '이메일 또는 비밀번호가 일치하지 않습니다.' }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        if (!user.approved && user.role !== 'admin') {
            return new Response(JSON.stringify({ success: false, message: '아직 관리자의 승인을 기다리고 있습니다.' }), {
                status: 403,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Update login time
        const now = new Date().toISOString();
        await env.DB.prepare('UPDATE users SET last_login_at = ? WHERE id = ?').bind(now, user.id).run();

        // Return user info (exclude password!)
        // D1 returns objects, but we should be careful.
        const { password: _, ...userInfo } = user;

        // Add current login time to response for session
        (userInfo as any).lastLoginAt = now;

        return new Response(JSON.stringify({ success: true, user: userInfo }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (err: any) {
        return new Response(JSON.stringify({ success: false, message: err.message }), { status: 500 });
    }
}
