// PUT /api/cbt/attempts/[id]/answers
export async function onRequestPut(context) {
    const { request, env, params } = context;
    const attemptId = params.id;

    try {
        const { answers } = await request.json();
        if (!answers || typeof answers !== 'object') {
            return new Response(JSON.stringify({ success: false, message: '답안 형식이 올바르지 않습니다.' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const { results } = await env.DB.prepare(
            'SELECT status FROM cbt_attempts WHERE id = ?'
        ).bind(attemptId).all();

        if (!results.length) {
            return new Response(JSON.stringify({ success: false, message: '응시 정보를 찾을 수 없습니다.' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        if (results[0].status !== 'in_progress') {
            return new Response(JSON.stringify({ success: false, message: '이미 종료된 응시입니다.' }), {
                status: 409,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        await env.DB.prepare(`
            UPDATE cbt_attempts
            SET answers_json = ?, updated_at = ?
            WHERE id = ?
        `).bind(JSON.stringify(answers), new Date().toISOString(), attemptId).run();

        return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('cbt save answers error', error);
        return new Response(JSON.stringify({ success: false, message: '답안 저장 실패' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
