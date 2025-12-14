import bcrypt from 'bcryptjs';

// POST /api/auth/reset-password - Reset password
export async function onRequestPost(context) {
    const { request, env } = context;

    try {
        const { email, name, phone, newPassword } = await request.json();

        if (!email || !name || !phone || !newPassword) {
            return new Response(JSON.stringify({
                success: false,
                message: '모든 정보를 입력해주세요.'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Verify user exists with matching info
        const { results } = await env.DB.prepare(`
            SELECT id FROM users WHERE email = ? AND name = ? AND phone = ?
        `).bind(email, name, phone).all();

        if (results.length === 0) {
            return new Response(JSON.stringify({
                success: false,
                message: '입력하신 정보와 일치하는 사용자를 찾을 수 없습니다.'
            }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const userId = results[0].id;

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update password
        await env.DB.prepare(`
            UPDATE users SET password = ? WHERE id = ?
        `).bind(hashedPassword, userId).run();

        return new Response(JSON.stringify({
            success: true,
            message: '비밀번호가 성공적으로 변경되었습니다.'
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Reset password error:', error);
        return new Response(JSON.stringify({
            success: false,
            message: '비밀번호 초기화 중 오류가 발생했습니다.'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
