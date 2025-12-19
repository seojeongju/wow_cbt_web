// POST /api/exams/generate - Generate mock exam from selected questions
export async function onRequestPost(context) {
    const { request, env } = context;

    try {
        const {
            title,
            courseId,
            subjectId,
            timeLimit,
            passScore,
            description,
            questionIds,
            mode,
            randomOptions
        } = await request.json();

        if (!title || !courseId || !questionIds || questionIds.length === 0) {
            return new Response(JSON.stringify({
                success: false,
                message: '필수 정보가 누락되었습니다.'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Create exam
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
            null, // topic
            null  // round
        ).run();

        // Link questions to exam
        // Since questions already exist, we need to either:
        // 1. Copy questions to new exam (recommended)
        // 2. Or create a mapping table
        
        // Option 1: Copy questions to new exam
        for (const questionId of questionIds) {
            // Get original question
            const original = await env.DB.prepare(`
                SELECT * FROM questions WHERE id = ?
            `).bind(questionId).first();

            if (original) {
                // Create new question for this exam
                const newQuestionId = `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                await env.DB.prepare(`
                    INSERT INTO questions (id, exam_id, category, text, options, correct_answer, explanation, image_url)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `).bind(
                    newQuestionId,
                    examId,
                    original.category,
                    original.text,
                    original.options,
                    original.correct_answer,
                    original.explanation || '',
                    original.image_url
                ).run();
            }
        }

        return new Response(JSON.stringify({
            success: true,
            examId,
            message: '모의고사가 성공적으로 생성되었습니다.'
        }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Generate exam error:', error);
        return new Response(JSON.stringify({
            success: false,
            message: '모의고사 생성 중 오류가 발생했습니다.'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

