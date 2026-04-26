// PUT /api/support/[id] - Update support ticket (reply)
export async function onRequestPut(context) {
    const { request, env, params } = context;
    const ticketId = params.id;

    try {
        const body = await request.json();
        const adminReply = body.adminReply;
        const newStatus = body.status;

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

        // Build update query dynamically
        // Note: status should match DB values (e.g., 'pending', 'resolved')
        const statusValue = newStatus ? newStatus.toLowerCase() : null;

        if (adminReply && statusValue) {
            // Both reply and status
            await env.DB.prepare(
                'UPDATE support_tickets SET admin_reply = ?, status = ?, updated_at = datetime("now") WHERE id = ?'
            ).bind(adminReply, statusValue, ticketId).run();
        } else if (adminReply) {
            // Only reply
            await env.DB.prepare(
                'UPDATE support_tickets SET admin_reply = ?, updated_at = datetime("now") WHERE id = ?'
            ).bind(adminReply, ticketId).run();
        } else if (statusValue) {
            // Only status
            await env.DB.prepare(
                'UPDATE support_tickets SET status = ?, updated_at = datetime("now") WHERE id = ?'
            ).bind(statusValue, ticketId).run();
        } else {
            // Nothing to update
            return new Response(JSON.stringify({
                success: false,
                message: '업데이트할 내용이 없습니다.'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

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
            message: '문의 수정 중 오류가 발생했습니다: ' + error.message
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
