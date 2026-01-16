// POST /api/exam-results - Submit exam result
export async function onRequestPost(context) {
    const { request, env } = context;

    try {
        const { userId, examId, score, totalQuestions, status, takeDuration, answers } = await request.json();

        if (!userId || !examId || score === undefined || !totalQuestions) {
            return new Response(JSON.stringify({
                success: false,
                message: '필수 정보가 누락되었습니다.'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const resultId = `result_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const answersJson = JSON.stringify(answers || {});

        await env.DB.prepare(`
            INSERT INTO exam_results 
            (id, user_id, exam_id, score, total_questions, status, take_duration, answers)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
            resultId,
            userId,
            examId,
            score,
            totalQuestions,
            status || (score >= 60 ? 'pass' : 'fail'),
            takeDuration || 0,
            answersJson
        ).run();

        return new Response(JSON.stringify({
            success: true,
            resultId,
            message: '시험 결과가 제출되었습니다.'
        }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Submit exam result error:', error);
        return new Response(JSON.stringify({
            success: false,
            message: '시험 결과 제출 중 오류가 발생했습니다.'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// GET /api/exam-results?userId=xxx&examId=yyy
export async function onRequestGet(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const examId = url.searchParams.get('examId');

    try {
        let query = `
            SELECT 
                er.*,
                e.title as exam_title,
                e.course_id,
                c.name as course_name,
                u.name as user_name
            FROM exam_results er
            JOIN exams e ON er.exam_id = e.id
            JOIN courses c ON e.course_id = c.id
            JOIN users u ON er.user_id = u.id
        `;

        const conditions = [];
        const params = [];

        if (userId) {
            conditions.push('er.user_id = ?');
            params.push(userId);
        }

        if (examId) {
            conditions.push('er.exam_id = ?');
            params.push(examId);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' ORDER BY er.created_at DESC';

        const { results } = await env.DB.prepare(query).bind(...params).all();

        // Parse JSON fields
        const parsedResults = results.map(r => ({
            ...r,
            answers: r.answers ? JSON.parse(r.answers) : {}
        }));

        return new Response(JSON.stringify({
            success: true,
            results: parsedResults
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Get exam results error:', error);
        return new Response(JSON.stringify({
            success: false,
            message: '시험 결과를 불러오는 중 오류가 발생했습니다.'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
