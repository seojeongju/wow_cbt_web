// PUT /api/support/[id] - Update support ticket (reply)
export async function onRequestPut(context) {
    const { request, env, params } = context;
    const ticketId = params.id;

    try {
        const { adminReply, status } = await request.json();

        // Check if ticket exists
        const { results: existing } = await env.DB.prepare(
            'SELECT id FROM support_tickets WHERE id = ?'
        ).bind(ticketId).all();

        if (existing.length === 0) {
            return new Response(JSON.stringify({
                success: false,
                message: '문의를 찾을 수 없습니다.'
            }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const updates = [];
        const bindParams = []; // Changed from 'params' to avoid conflict with route params

        if (adminReply !== undefined) {
            updates.push('admin_reply = ?');
            bindParams.push(adminReply);
        }

        if (status !== undefined) {
            updates.push('status = ?');
            bindParams.push(status);
        }

        updates.push('updated_at = datetime("now")');
        bindParams.push(ticketId);

        const query = `UPDATE support_tickets SET ${updates.join(', ')} WHERE id = ?`;
        await env.DB.prepare(query).bind(...bindParams).run();

        return new Response(JSON.stringify({
            success: true,
            message: '문의가 수정되었습니다.'
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Update support ticket error:', error);
        return new Response(JSON.stringify({
            success: false,
            message: '문의 수정 중 오류가 발생했습니다.'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// DELETE /api/support/[id] - Delete support ticket
export async function onRequestDelete(context) {
    const { env, params } = context;
    const ticketId = params.id;

    try {
        const { results: existing } = await env.DB.prepare(
            'SELECT id FROM support_tickets WHERE id = ?'
        ).bind(ticketId).all();

        if (existing.length === 0) {
            return new Response(JSON.stringify({
                success: false,
                message: '문의를 찾을 수 없습니다.'
            }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        await env.DB.prepare('DELETE FROM support_tickets WHERE id = ?').bind(ticketId).run();

        return new Response(JSON.stringify({
            success: true,
            message: '문의가 삭제되었습니다.'
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Delete support ticket error:', error);
        return new Response(JSON.stringify({
            success: false,
            message: '문의 삭제 중 오류가 발생했습니다.'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
