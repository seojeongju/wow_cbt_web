// POST /api/cbt/attempts/[id]/submit
export async function onRequestPost(context) {
    const { env, params } = context;
    const attemptId = params.id;

    try {
        const { results: attempts } = await env.DB.prepare(`
            SELECT a.*, e.title AS exam_title, e.pass_score
            FROM cbt_attempts a
            JOIN cbt_exams e ON a.cbt_exam_id = e.id
            WHERE a.id = ?
        `).bind(attemptId).all();

        if (!attempts.length) {
            return new Response(JSON.stringify({ success: false, message: '응시 정보를 찾을 수 없습니다.' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const attempt = attempts[0];
        if (attempt.status !== 'in_progress') {
            return new Response(JSON.stringify({ success: false, message: '이미 제출된 시험입니다.' }), {
                status: 409,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const { results: questions } = await env.DB.prepare(`
            SELECT q.id, q.correct_answer
            FROM cbt_exam_questions ceq
            JOIN questions q ON q.id = ceq.question_id
            WHERE ceq.cbt_exam_id = ?
        `).bind(attempt.cbt_exam_id).all();

        const answers = attempt.answers_json ? JSON.parse(attempt.answers_json) : {};
        let correct = 0;
        for (const q of questions) {
            const ans = answers[q.id];
            if (ans === undefined || ans === null || ans === '') continue;
            const correctValue = isNaN(Number(q.correct_answer)) ? String(q.correct_answer) : Number(q.correct_answer);
            const userValue = typeof correctValue === 'number' ? Number(ans) : String(ans).trim();
            if (userValue === correctValue) correct++;
        }

        const total = questions.length;
        const score = Math.round((correct * 100) / (total || 1));
        const passed = score >= (attempt.pass_score || 60);
        const resultId = `cbt_result_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const submittedAt = new Date().toISOString();

        await env.DB.batch([
            env.DB.prepare(`
                UPDATE cbt_attempts
                SET status = 'submitted', submitted_at = ?, updated_at = ?
                WHERE id = ?
            `).bind(submittedAt, submittedAt, attemptId),
            env.DB.prepare(`
                INSERT INTO cbt_results (id, cbt_attempt_id, cbt_exam_id, user_id, score, total_questions, status, submitted_at, answers_json)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).bind(
                resultId,
                attemptId,
                attempt.cbt_exam_id,
                attempt.user_id,
                score,
                total,
                passed ? 'pass' : 'fail',
                submittedAt,
                JSON.stringify(answers)
            )
        ]);

        return new Response(JSON.stringify({
            success: true,
            result: {
                id: resultId,
                examId: attempt.cbt_exam_id,
                examTitle: attempt.exam_title,
                score,
                totalQuestions: total,
                passed,
                submittedAt
            }
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error) {
        console.error('cbt submit error', error);
        return new Response(JSON.stringify({ success: false, message: '제출 처리 실패' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
