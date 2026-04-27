// GET /api/cbt/attempts/[id]
export async function onRequestGet(context) {
    const { env, params } = context;
    const attemptId = params.id;

    try {
        const { results } = await env.DB.prepare(`
            SELECT *
            FROM cbt_attempts
            WHERE id = ?
        `).bind(attemptId).all();

        if (!results.length) {
            return new Response(JSON.stringify({ success: false, message: '응시 정보를 찾을 수 없습니다.' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const at = results[0];
        return new Response(JSON.stringify({
            success: true,
            attempt: {
                id: at.id,
                examId: at.cbt_exam_id,
                userId: at.user_id,
                startedAt: at.started_at,
                endAt: at.end_at,
                submittedAt: at.submitted_at,
                status: at.status,
                answers: at.answers_json ? JSON.parse(at.answers_json) : {}
            }
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    } catch (error) {
        console.error('cbt attempt get error', error);
        return new Response(JSON.stringify({ success: false, message: 'CBT 응시 조회 실패' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
