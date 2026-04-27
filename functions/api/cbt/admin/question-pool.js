// GET /api/cbt/admin/question-pool?courseId=...&subjectId=...
export async function onRequestGet(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const courseId = url.searchParams.get('courseId');
    const subjectId = url.searchParams.get('subjectId');

    try {
        let query = `
            SELECT q.*
            FROM questions q
            JOIN exams e ON e.id = q.exam_id
            WHERE 1=1
        `;
        const params = [];

        if (courseId) {
            query += ' AND e.course_id = ?';
            params.push(courseId);
        }
        if (subjectId) {
            query += ' AND e.subject_id = ?';
            params.push(subjectId);
        }
        query += ' ORDER BY q.created_at DESC';

        const { results } = await env.DB.prepare(query).bind(...params).all();
        return new Response(JSON.stringify({
            success: true,
            questions: (results || []).map(q => ({
                id: q.id,
                category: q.category,
                text: q.text,
                options: q.options ? JSON.parse(q.options) : [],
                correctAnswer: isNaN(Number(q.correct_answer)) ? q.correct_answer : Number(q.correct_answer)
            }))
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    } catch (error) {
        console.error('cbt admin question pool error', error);
        return new Response(JSON.stringify({ success: false, message: '문항 조회 실패' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
