// GET /api/exams/[examId]/questions - Get all questions for an exam
export async function onRequestGet(context) {
    const { env, params } = context;
    const examId = params.examId;

    try {
        const { results: questions } = await env.DB.prepare(`
            SELECT * FROM questions 
            WHERE exam_id = ? 
            ORDER BY created_at ASC
        `).bind(examId).all();

        // Parse JSON fields
        const parsedQuestions = questions.map(q => ({
            ...q,
            options: q.options ? JSON.parse(q.options) : [],
            optionImages: q.option_images ? JSON.parse(q.option_images) : undefined,
            correctAnswer: isNaN(Number(q.correct_answer)) ? q.correct_answer : Number(q.correct_answer)
        }));

        return new Response(JSON.stringify({
            success: true,
            questions: parsedQuestions
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Get questions error:', error);
        return new Response(JSON.stringify({
            success: false,
            message: '문제 목록을 불러오는 중 오류가 발생했습니다.'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// POST /api/exams/[examId]/questions - Create question
export async function onRequestPost(context) {
    const { request, env, params } = context;
    const examId = params.examId;

    try {
        const { category, text, options, correctAnswer, explanation, imageUrl, optionImages } = await request.json();

        if (!text) {
            return new Response(JSON.stringify({
                success: false,
                message: '문제 내용을 입력해주세요.'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const questionId = `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Convert arrays/objects to JSON strings
        const optionsJson = options && options.length > 0 ? JSON.stringify(options) : null;
        const optionImagesJson = optionImages && Array.isArray(optionImages) && optionImages.length > 0 ? JSON.stringify(optionImages) : null;
        const correctAnswerStr = correctAnswer !== undefined ? String(correctAnswer) : '';

        await env.DB.prepare(`
            INSERT INTO questions (id, exam_id, category, text, options, correct_answer, explanation, image_url, option_images)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
            questionId,
            examId,
            category || '기타',
            text,
            optionsJson,
            correctAnswerStr,
            explanation || '',
            imageUrl || null,
            optionImagesJson
        ).run();

        return new Response(JSON.stringify({
            success: true,
            questionId,
            message: '문제가 추가되었습니다.'
        }), {
            status: 201,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Create question error:', error);
        return new Response(JSON.stringify({
            success: false,
            message: '문제 추가 중 오류가 발생했습니다: ' + (error.message || error)
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
