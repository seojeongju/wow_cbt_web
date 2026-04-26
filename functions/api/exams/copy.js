
export async function onRequestPost(context) {
    const { request, env } = context;

    try {
        const body = await request.json();
        const { examId, targetCourseId, targetSubjectId } = body;

        if (!examId || !targetCourseId) {
            return new Response(JSON.stringify({
                success: false,
                message: '필수 파라미터가 누락되었습니다.'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 1. 원본 시험지 조회
        const exam = await env.DB.prepare('SELECT * FROM exams WHERE id = ?').bind(examId).first();
        if (!exam) {
            return new Response(JSON.stringify({
                success: false,
                message: '시험지를 찾을 수 없습니다.'
            }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 2. 새 시험지 생성 (복사)
        // crypto.randomUUID() 사용
        const newExamId = `exam_copy_${crypto.randomUUID()}`;

        await env.DB.prepare(`
            INSERT INTO exams (id, title, course_id, subject_id, description, time_limit, pass_score, topic, round, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        `).bind(
            newExamId,
            `${exam.title} (복사본)`,
            targetCourseId,
            targetSubjectId || null,
            exam.description || '',
            exam.time_limit,
            exam.pass_score,
            exam.topic,
            exam.round
        ).run();

        // 3. 문제 목록 조회
        const { results: questions } = await env.DB.prepare('SELECT * FROM questions WHERE exam_id = ?').bind(examId).all();

        // 4. 문제 복사 (Batch Insert)
        if (questions && questions.length > 0) {
            const stmt = env.DB.prepare(`
                INSERT INTO questions (id, exam_id, category, text, options, correct_answer, explanation, image_url, option_images, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
            `);

            const batch = questions.map(q => {
                const newQId = `q_copy_${crypto.randomUUID()}`;
                return stmt.bind(
                    newQId,
                    newExamId,
                    q.category,
                    q.text,
                    q.options,
                    q.correct_answer,
                    q.explanation,
                    q.image_url,
                    q.option_images || null
                );
            });

            // Cloudflare D1 Batch Execution
            // Note: Batch size needs to be reasonable. If too large, might fail? 
            // Usually exams have < 100 questions, so it should be fine.
            await env.DB.batch(batch);
        }

        return new Response(JSON.stringify({
            success: true,
            examId: newExamId,
            message: '시험지가 복사되었습니다.'
        }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Exam copy error:', error);
        return new Response(JSON.stringify({
            success: false,
            message: '시험지 복사 중 오류가 발생했습니다: ' + error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
