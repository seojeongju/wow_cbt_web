// GET /api/cbt/exams
export async function onRequestGet(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const courseName = url.searchParams.get('courseName');
    const includeInactive = url.searchParams.get('includeInactive') === 'true';

    try {
        let query = `
            SELECT
                ce.*,
                COALESCE(c.name, ce.course_id) AS course_name,
                s.name AS subject_name,
                COUNT(ceq.question_id) AS question_count
            FROM cbt_exams ce
            LEFT JOIN courses c ON ce.course_id = c.id
            LEFT JOIN subjects s ON ce.subject_id = s.id
            LEFT JOIN cbt_exam_questions ceq ON ce.id = ceq.cbt_exam_id
            WHERE 1=1
        `;
        const params = [];

        if (!includeInactive) {
            query += ` AND ce.is_active = 1`;
        }

        if (courseName) {
            query += ` AND (c.name = ? OR ce.course_id = ?)`;
            params.push(courseName, courseName);
        }

        query += ` GROUP BY ce.id ORDER BY ce.created_at DESC`;

        const { results } = await env.DB.prepare(query).bind(...params).all();

        return new Response(JSON.stringify({
            success: true,
            exams: (results || []).map(e => ({
                id: e.id,
                title: e.title,
                courseId: e.course_id,
                courseName: e.course_name,
                subjectId: e.subject_id,
                subjectName: e.subject_name,
                topic: e.topic,
                round: e.round,
                description: e.description,
                timeLimit: e.time_limit,
                passScore: e.pass_score,
                isActive: Number(e.is_active) === 1,
                questionCount: e.question_count || 0
            }))
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    } catch (error) {
        console.error('cbt exams list error', error);
        return new Response(JSON.stringify({ success: false, message: 'CBT 시험 목록 조회 실패' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// POST /api/cbt/exams
export async function onRequestPost(context) {
    const { request, env } = context;
    try {
        const {
            title, courseId, subjectId, topic, round, description,
            timeLimit, passScore, questionIds
        } = await request.json();

        if (!title || !Array.isArray(questionIds) || questionIds.length === 0) {
            return new Response(JSON.stringify({
                success: false,
                message: '시험 제목과 문제를 확인해주세요.'
            }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }

        const examId = `cbt_exam_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const now = new Date().toISOString();

        await env.DB.prepare(`
            INSERT INTO cbt_exams
            (id, title, course_id, subject_id, topic, round, description, time_limit, pass_score, is_active, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
        `).bind(
            examId,
            title,
            courseId || null,
            subjectId || null,
            topic || null,
            round || null,
            description || '',
            Number(timeLimit) || 60,
            Number(passScore) || 60,
            now
        ).run();

        const statements = questionIds.map((questionId, idx) =>
            env.DB.prepare(`
                INSERT INTO cbt_exam_questions (id, cbt_exam_id, question_id, order_no, created_at)
                VALUES (?, ?, ?, ?, ?)
            `).bind(
                `cbt_eq_${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 6)}`,
                examId,
                questionId,
                idx + 1,
                now
            )
        );
        await env.DB.batch(statements);

        return new Response(JSON.stringify({
            success: true,
            examId,
            message: 'CBT 시험이 생성되었습니다.'
        }), { status: 201, headers: { 'Content-Type': 'application/json' } });
    } catch (error) {
        console.error('cbt exams create error', error);
        return new Response(JSON.stringify({ success: false, message: 'CBT 시험 생성 실패' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
