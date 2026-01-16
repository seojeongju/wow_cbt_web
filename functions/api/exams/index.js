// GET /api/exams - Get all exams (optionally filtered by course)
export async function onRequestGet(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const courseId = url.searchParams.get('courseId');

    try {
        let query = `
            SELECT 
                e.*,
                COALESCE(c.name, e.course_id) as course_name,
                s.name as subject_name,
                COUNT(DISTINCT q.id) as question_count,
                e.round
            FROM exams e
            LEFT JOIN courses c ON e.course_id = c.id
            LEFT JOIN subjects s ON e.subject_id = s.id
            LEFT JOIN questions q ON e.id = q.exam_id
        `;

        const params = [];
        if (courseId) {
            query += ' WHERE e.course_id = ?';
            params.push(courseId);
        }

        query += ' GROUP BY e.id ORDER BY e.created_at DESC';

        const { results: exams } = await env.DB.prepare(query).bind(...params).all();

        return new Response(JSON.stringify({
            success: true,
            exams
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Get exams error:', error);
        return new Response(JSON.stringify({
            success: false,
            message: '시험 목록을 불러오는 중 오류가 발생했습니다.'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// POST /api/exams - Create exam
export async function onRequestPost(context) {
    const { request, env } = context;

    try {
        const { title, courseId, subjectId, topic, round, description, timeLimit, passScore } = await request.json();

        if (!title || !courseId) {
            return new Response(JSON.stringify({
                success: false,
                message: '시험 제목과 과정을 입력해주세요.'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const examId = `exam_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        await env.DB.prepare(`
            INSERT INTO exams (id, title, course_id, subject_id, description, time_limit, pass_score, topic, round)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
            examId,
            title,
            courseId,
            subjectId || null,
            description || '',
            timeLimit || 60,
            passScore || 60,
            topic || null,
            round || null
        ).run();

        return new Response(JSON.stringify({
            success: true,
            examId,
            message: '시험이 생성되었습니다.'
        }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Create exam error:', error);
        return new Response(JSON.stringify({
            success: false,
            message: '시험 생성 중 오류가 발생했습니다.'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
