// GET /api/support - Get support tickets
export async function onRequestGet(context) {
    const { env, request } = context;
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const status = url.searchParams.get('status'); // pending, answered

    try {
        let query = 'SELECT * FROM support_tickets';
        const conditions = [];
        const params = [];

        if (userId) {
            conditions.push('user_id = ?');
            params.push(userId);
        }

        if (status) {
            conditions.push('status = ?');
            params.push(status);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' ORDER BY created_at DESC';

        const { results: tickets } = await env.DB.prepare(query).bind(...params).all();

        return new Response(JSON.stringify({
            success: true,
            tickets
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Get support tickets error:', error);
        return new Response(JSON.stringify({
            success: false,
            message: '문의 목록을 불러오는 중 오류가 발생했습니다.'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// POST /api/support - Create support ticket
export async function onRequestPost(context) {
    const { request, env } = context;

    try {
        const { userId, userName, userEmail, category, title, content } = await request.json();

        if (!userName || !userEmail || !category || !title || !content) {
            return new Response(JSON.stringify({
                success: false,
                message: '필수 정보를 모두 입력해주세요.'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const ticketId = `ticket_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        await env.DB.prepare(`
            INSERT INTO support_tickets 
            (id, user_id, user_name, user_email, category, title, content, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
            ticketId,
            userId || null,
            userName,
            userEmail,
            category,
            title,
            content,
            'pending'
        ).run();

        return new Response(JSON.stringify({
            success: true,
            ticketId,
            message: '문의가 등록되었습니다.'
        }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Create support ticket error:', error);
        return new Response(JSON.stringify({
            success: false,
            message: '문의 등록 중 오류가 발생했습니다.'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
