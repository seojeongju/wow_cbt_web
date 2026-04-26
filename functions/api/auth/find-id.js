// POST /api/auth/find-id - Find user ID by name and phone
export async function onRequestPost(context) {
    const { request, env } = context;

    try {
        const { name, phone } = await request.json();

        if (!name || !phone) {
            return new Response(JSON.stringify({
                success: false,
                message: '이름과 전화번호를 입력해주세요.'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const { results } = await env.DB.prepare(`
            SELECT email FROM users WHERE name = ? AND phone = ?
        `).bind(name, phone).all();

        if (results.length === 0) {
            return new Response(JSON.stringify({
                success: false,
                message: '일치하는 사용자를 찾을 수 없습니다.'
            }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Mask email for security (e.g., test@example.com -> t***@example.com)
        const email = results[0].email;
        const [local, domain] = email.split('@');
        const maskedEmail = local.length > 2
            ? local[0] + '***' + local[local.length - 1] + '@' + domain
            : '***@' + domain;

        return new Response(JSON.stringify({
            success: true,
            email: maskedEmail,
            message: `고객님의 이메일은 ${maskedEmail} 입니다.`
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Find ID error:', error);
        return new Response(JSON.stringify({
            success: false,
            message: '아이디 찾기 중 오류가 발생했습니다.'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
