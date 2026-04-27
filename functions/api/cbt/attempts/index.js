// POST /api/cbt/attempts
export async function onRequestPost(context) {
    const { request, env } = context;

    try {
        const { examId, userId, forceNew } = await request.json();
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

        if (!forceNew) {
            const { results: existing } = await env.DB.prepare(`
                SELECT *
                FROM cbt_attempts
                WHERE cbt_exam_id = ? AND user_id = ? AND status = 'in_progress'
                ORDER BY started_at DESC
                LIMIT 1
            `).bind(examId, userId).all();

            if (existing.length) {
                const at = existing[0];
                return new Response(JSON.stringify({
                    success: true,
                    attempt: {
                        id: at.id,
                        examId: at.cbt_exam_id,
                        userId: at.user_id,
                        startedAt: at.started_at,
                        endAt: at.end_at,
                        status: at.status,
                        answers: at.answers_json ? JSON.parse(at.answers_json) : {}
                    },
                    resumed: true
                }), { status: 200, headers: { 'Content-Type': 'application/json' } });
            }
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

// GET /api/cbt/attempts?userId=...&examId=...&status=in_progress
export async function onRequestGet(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const examId = url.searchParams.get('examId');
    const status = url.searchParams.get('status');

    try {
        let query = `
            SELECT a.*
            FROM cbt_attempts a
            WHERE 1=1
        `;
        const params = [];

        if (userId) {
            query += ' AND a.user_id = ?';
            params.push(userId);
        }
        if (examId) {
            query += ' AND a.cbt_exam_id = ?';
            params.push(examId);
        }
        if (status) {
            query += ' AND a.status = ?';
            params.push(status);
        }

        query += ' ORDER BY a.started_at DESC';
        const { results } = await env.DB.prepare(query).bind(...params).all();

        return new Response(JSON.stringify({
            success: true,
            attempts: (results || []).map(a => ({
                id: a.id,
                examId: a.cbt_exam_id,
                userId: a.user_id,
                startedAt: a.started_at,
                endAt: a.end_at,
                submittedAt: a.submitted_at,
                status: a.status,
                answers: a.answers_json ? JSON.parse(a.answers_json) : {}
            }))
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    } catch (error) {
        console.error('cbt attempt list error', error);
        return new Response(JSON.stringify({ success: false, message: 'CBT 응시 목록 조회 실패' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
