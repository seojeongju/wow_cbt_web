// GET /api/cbt/results?userId=xxx
export async function onRequestGet(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    try {
        let query = `
            SELECT
                r.*,
                e.title AS exam_title,
                COALESCE(c.name, e.course_id) AS course_name
            FROM cbt_results r
            JOIN cbt_exams e ON e.id = r.cbt_exam_id
            LEFT JOIN courses c ON c.id = e.course_id
        `;
        const params = [];
        if (userId) {
            query += ' WHERE r.user_id = ?';
            params.push(userId);
        }
        query += ' ORDER BY r.submitted_at DESC';

        const { results } = await env.DB.prepare(query).bind(...params).all();
        return new Response(JSON.stringify({
            success: true,
            results: (results || []).map(r => ({
                id: r.id,
                examId: r.cbt_exam_id,
                examTitle: r.exam_title,
                courseName: r.course_name,
                score: r.score,
                totalQuestions: r.total_questions,
                passed: r.status === 'pass',
                submittedAt: r.submitted_at
            }))
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    } catch (error) {
        console.error('cbt results error', error);
        return new Response(JSON.stringify({ success: false, message: 'CBT 결과 조회 실패' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
