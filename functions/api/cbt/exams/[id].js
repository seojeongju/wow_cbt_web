// GET /api/cbt/exams/[id]
export async function onRequestGet(context) {
    const { env, params, request } = context;
    const examId = params.id;
    const url = new URL(request.url);
    const includeInactive = url.searchParams.get('includeInactive') === 'true';

    try {
        const { results: exams } = await env.DB.prepare(`
            SELECT
                ce.*,
                COALESCE(c.name, ce.course_id) AS course_name,
                s.name AS subject_name
            FROM cbt_exams ce
            LEFT JOIN courses c ON ce.course_id = c.id
            LEFT JOIN subjects s ON ce.subject_id = s.id
            WHERE ce.id = ?
            ${includeInactive ? '' : 'AND ce.is_active = 1'}
        `).bind(examId).all();

        if (!exams.length) {
            return new Response(JSON.stringify({ success: false, message: 'CBT 시험을 찾을 수 없습니다.' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const { results: questions } = await env.DB.prepare(`
            SELECT q.*
            FROM cbt_exam_questions ceq
            JOIN questions q ON q.id = ceq.question_id
            WHERE ceq.cbt_exam_id = ?
            ORDER BY ceq.order_no ASC, q.created_at ASC
        `).bind(examId).all();

        const exam = exams[0];
        return new Response(JSON.stringify({
            success: true,
            exam: {
                id: exam.id,
                title: exam.title,
                courseId: exam.course_id,
                courseName: exam.course_name,
                subjectId: exam.subject_id,
                subjectName: exam.subject_name,
                topic: exam.topic,
                round: exam.round,
                description: exam.description,
                timeLimit: exam.time_limit,
                passScore: exam.pass_score,
                questionCount: questions.length,
                questions: (questions || []).map(q => ({
                    id: q.id,
                    category: q.category,
                    text: q.text,
                    imageUrl: q.image_url,
                    options: q.options ? JSON.parse(q.options) : [],
                    optionImages: q.option_images ? JSON.parse(q.option_images) : undefined,
                    correctAnswer: isNaN(Number(q.correct_answer)) ? q.correct_answer : Number(q.correct_answer),
                    explanation: q.explanation
                }))
            }
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    } catch (error) {
        console.error('cbt exam detail error', error);
        return new Response(JSON.stringify({ success: false, message: 'CBT 시험 조회 실패' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// PUT /api/cbt/exams/[id]
// - 시험 메타 수정
// - questionIds 전달 시 문항 매핑 전체 교체(순서 포함)
// - isActive 전달 시 활성/비활성 처리
export async function onRequestPut(context) {
    const { request, env, params } = context;
    const examId = params.id;

    try {
        const body = await request.json();
        const {
            title, courseId, subjectId, topic, round, description,
            timeLimit, passScore, questionIds, isActive, adminUserId, adminUserName
        } = body;

        const { results: existing } = await env.DB.prepare(
            'SELECT id FROM cbt_exams WHERE id = ?'
        ).bind(examId).all();

        if (!existing.length) {
            return new Response(JSON.stringify({ success: false, message: 'CBT 시험을 찾을 수 없습니다.' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const updates = [];
        const bindParams = [];

        if (title !== undefined) { updates.push('title = ?'); bindParams.push(title); }
        if (courseId !== undefined) { updates.push('course_id = ?'); bindParams.push(courseId || null); }
        if (subjectId !== undefined) { updates.push('subject_id = ?'); bindParams.push(subjectId || null); }
        if (topic !== undefined) { updates.push('topic = ?'); bindParams.push(topic || null); }
        if (round !== undefined) { updates.push('round = ?'); bindParams.push(round || null); }
        if (description !== undefined) { updates.push('description = ?'); bindParams.push(description || ''); }
        if (timeLimit !== undefined) { updates.push('time_limit = ?'); bindParams.push(Number(timeLimit) || 60); }
        if (passScore !== undefined) { updates.push('pass_score = ?'); bindParams.push(Number(passScore) || 60); }
        if (isActive !== undefined) { updates.push('is_active = ?'); bindParams.push(isActive ? 1 : 0); }

        const statements = [];
        if (updates.length > 0) {
            bindParams.push(examId);
            statements.push(env.DB.prepare(`
                UPDATE cbt_exams
                SET ${updates.join(', ')}
                WHERE id = ?
            `).bind(...bindParams));
        }

        if (Array.isArray(questionIds)) {
            statements.push(
                env.DB.prepare('DELETE FROM cbt_exam_questions WHERE cbt_exam_id = ?').bind(examId)
            );

            const now = new Date().toISOString();
            questionIds.forEach((qId, idx) => {
                statements.push(
                    env.DB.prepare(`
                        INSERT INTO cbt_exam_questions (id, cbt_exam_id, question_id, order_no, created_at)
                        VALUES (?, ?, ?, ?, ?)
                    `).bind(
                        `cbt_eq_${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 7)}`,
                        examId,
                        qId,
                        idx + 1,
                        now
                    )
                );
            });
        }

        if (statements.length > 0) {
            await env.DB.batch(statements);
        }

        const logId = `cbt_log_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        const now = new Date().toISOString();
        const logNote = `meta:${updates.length}, questions:${Array.isArray(questionIds) ? questionIds.length : 'unchanged'}`;
        try {
            await env.DB.prepare(`
                INSERT INTO cbt_admin_logs (id, action, cbt_exam_id, admin_user_id, admin_user_name, note, created_at)
                VALUES (?, 'update_exam', ?, ?, ?, ?, ?)
            `).bind(
                logId,
                examId,
                adminUserId || null,
                adminUserName || null,
                logNote,
                now
            ).run();
        } catch (logError) {
            // Backward compatibility for old cbt_admin_logs schema.
            await env.DB.prepare(`
                INSERT INTO cbt_admin_logs (id, action, cbt_exam_id, note, created_at)
                VALUES (?, 'update_exam', ?, ?, ?)
            `).bind(
                logId,
                examId,
                logNote,
                now
            ).run();
            console.warn('cbt admin log actor columns unavailable:', logError?.message || logError);
        }

        return new Response(JSON.stringify({ success: true, message: 'CBT 시험이 수정되었습니다.' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('cbt exam update error', error);
        return new Response(JSON.stringify({ success: false, message: 'CBT 시험 수정 실패' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
