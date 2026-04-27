// GET /api/cbt/admin/question-pool?courseId=...&subjectId=...
export async function onRequestGet(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const courseId = url.searchParams.get('courseId');
    const subjectId = url.searchParams.get('subjectId');
    const scope = url.searchParams.get('scope');

    try {
        if (scope === 'courses') {
            const { results } = await env.DB.prepare(`
                SELECT
                    c.id,
                    c.name,
                    COUNT(DISTINCT e.id) AS exam_count,
                    COUNT(DISTINCT q.id) AS question_count
                FROM courses c
                LEFT JOIN exams e ON (e.course_id = c.id OR e.course_id = c.name)
                LEFT JOIN questions q ON q.exam_id = e.id
                GROUP BY c.id, c.name
                HAVING COUNT(DISTINCT q.id) > 0
                ORDER BY question_count DESC, c.created_at DESC
            `).all();

            return new Response(JSON.stringify({
                success: true,
                courses: (results || []).map(c => ({
                    id: c.id,
                    name: c.name,
                    examCount: Number(c.exam_count || 0),
                    questionCount: Number(c.question_count || 0)
                }))
            }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }
        if (scope === 'subjects') {
            if (!courseId) {
                return new Response(JSON.stringify({
                    success: true,
                    subjects: []
                }), { status: 200, headers: { 'Content-Type': 'application/json' } });
            }

            const { results: courseRows } = await env.DB.prepare(
                'SELECT id, name FROM courses WHERE id = ?'
            ).bind(courseId).all();
            const resolvedCourseName = courseRows?.[0]?.name || null;

            let subjectQuery = `
                SELECT
                    s.id,
                    s.name,
                    COUNT(DISTINCT q.id) AS question_count
                FROM subjects s
                LEFT JOIN exams e ON e.subject_id = s.id
                LEFT JOIN questions q ON q.exam_id = e.id
                WHERE (e.course_id = ?
            `;
            const subjectParams = [courseId];
            if (resolvedCourseName) {
                subjectQuery += ' OR e.course_id = ?';
                subjectParams.push(resolvedCourseName);
            }
            subjectQuery += `)
                GROUP BY s.id, s.name
                HAVING COUNT(DISTINCT q.id) > 0
                ORDER BY s.created_at DESC
            `;

            const { results } = await env.DB.prepare(subjectQuery).bind(...subjectParams).all();
            return new Response(JSON.stringify({
                success: true,
                subjects: (results || []).map(s => ({
                    id: s.id,
                    name: s.name,
                    questionCount: Number(s.question_count || 0)
                }))
            }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }

        let query = `
            SELECT
                q.*,
                e.subject_id
            FROM questions q
            JOIN exams e ON e.id = q.exam_id
            WHERE 1=1
        `;
        const params = [];

        if (courseId) {
            const { results: courseRows } = await env.DB.prepare(
                'SELECT id, name FROM courses WHERE id = ?'
            ).bind(courseId).all();
            const resolvedCourseName = courseRows?.[0]?.name || null;

            query += ' AND (e.course_id = ?';
            params.push(courseId);
            if (resolvedCourseName) {
                query += ' OR e.course_id = ?';
                params.push(resolvedCourseName);
            }
            query += ')';
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
                subjectId: q.subject_id || null,
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
