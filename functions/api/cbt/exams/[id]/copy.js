// POST /api/cbt/exams/[id]/copy
export async function onRequestPost(context) {
    const { env, params, request } = context;
    const sourceExamId = params.id;

    try {
        const body = await request.json().catch(() => ({}));
        const titleSuffix = body.titleSuffix || '복제본';

        const { results: exams } = await env.DB.prepare(`
            SELECT * FROM cbt_exams WHERE id = ?
        `).bind(sourceExamId).all();

        if (!exams.length) {
            return new Response(JSON.stringify({ success: false, message: '원본 CBT 시험을 찾을 수 없습니다.' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const source = exams[0];
        const { results: mappings } = await env.DB.prepare(`
            SELECT question_id, order_no
            FROM cbt_exam_questions
            WHERE cbt_exam_id = ?
            ORDER BY order_no ASC
        `).bind(sourceExamId).all();

        const newExamId = `cbt_exam_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const now = new Date().toISOString();

        const statements = [
            env.DB.prepare(`
                INSERT INTO cbt_exams
                (id, title, course_id, subject_id, topic, round, description, time_limit, pass_score, is_active, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).bind(
                newExamId,
                `${source.title} (${titleSuffix})`,
                source.course_id,
                source.subject_id,
                source.topic,
                source.round,
                source.description,
                source.time_limit,
                source.pass_score,
                0,
                now
            )
        ];

        mappings.forEach((m, idx) => {
            statements.push(
                env.DB.prepare(`
                    INSERT INTO cbt_exam_questions (id, cbt_exam_id, question_id, order_no, created_at)
                    VALUES (?, ?, ?, ?, ?)
                `).bind(
                    `cbt_eq_${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 7)}`,
                    newExamId,
                    m.question_id,
                    m.order_no || (idx + 1),
                    now
                )
            );
        });

        statements.push(
            env.DB.prepare(`
                INSERT INTO cbt_admin_logs (id, action, cbt_exam_id, note, created_at)
                VALUES (?, 'copy_exam', ?, ?, ?)
            `).bind(
                `cbt_log_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
                newExamId,
                `from:${sourceExamId}, questions:${mappings.length}`,
                now
            )
        );

        await env.DB.batch(statements);

        return new Response(JSON.stringify({
            success: true,
            examId: newExamId,
            examTitle: `${source.title} (${titleSuffix})`,
            message: 'CBT 시험이 복제되었습니다. (기본: 비활성)'
        }), { status: 201, headers: { 'Content-Type': 'application/json' } });
    } catch (error) {
        console.error('cbt exam copy error', error);
        return new Response(JSON.stringify({ success: false, message: 'CBT 시험 복제 실패' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
