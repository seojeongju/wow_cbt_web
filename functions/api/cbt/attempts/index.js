// POST /api/cbt/attempts
export async function onRequestPost(context) {
    const { request, env } = context;

    try {
        const { examId, userId } = await request.json();
        if (!examId || !userId) {
            return new Response(JSON.stringify({ success: false, message: '필수 값이 누락되었습니다.' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const { results: exams } = await env.DB.prepare(
            'SELECT id, time_limit FROM cbt_exams WHERE id = ? AND is_active = 1'
        ).bind(examId).all();

        if (!exams.length) {
            return new Response(JSON.stringify({ success: false, message: 'CBT 시험을 찾을 수 없습니다.' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const attemptId = `cbt_attempt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const now = new Date();
        const endAt = new Date(now.getTime() + (Number(exams[0].time_limit) || 60) * 60 * 1000);

        await env.DB.prepare(`
            INSERT INTO cbt_attempts (id, cbt_exam_id, user_id, started_at, end_at, status, answers_json)
            VALUES (?, ?, ?, ?, ?, 'in_progress', ?)
        `).bind(attemptId, examId, userId, now.toISOString(), endAt.toISOString(), JSON.stringify({})).run();

        return new Response(JSON.stringify({
            success: true,
            attempt: {
                id: attemptId,
                examId,
                userId,
                startedAt: now.toISOString(),
                endAt: endAt.toISOString(),
                status: 'in_progress',
                answers: {}
            }
        }), { status: 201, headers: { 'Content-Type': 'application/json' } });
    } catch (error) {
        console.error('cbt attempt create error', error);
        return new Response(JSON.stringify({ success: false, message: 'CBT 응시 시작 실패' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
