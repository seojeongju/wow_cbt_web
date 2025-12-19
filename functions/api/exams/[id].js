// GET /api/exams/[id] - Get exam details with questions
export async function onRequestGet(context) {
    const { env, params } = context;
    const examId = params.id;

    try {
        // Get exam details
        const { results: exams } = await env.DB.prepare(`
            SELECT e.*, 
                   COALESCE(c.name, e.course_id) as course_name,
                   s.name as subject_name
            FROM exams e
            LEFT JOIN courses c ON e.course_id = c.id
            LEFT JOIN subjects s ON e.subject_id = s.id
            WHERE e.id = ?
        `).bind(examId).all();

        if (exams.length === 0) {
            return new Response(JSON.stringify({
                success: false,
                message: '시험을 찾을 수 없습니다.'
            }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Get questions
        const { results: questions } = await env.DB.prepare(`
            SELECT * FROM questions 
            WHERE exam_id = ? 
            ORDER BY created_at ASC
        `).bind(examId).all();

        // Parse JSON fields
        const parsedQuestions = questions.map(q => ({
            ...q,
            options: q.options ? JSON.parse(q.options) : [],
            optionImages: q.option_images ? JSON.parse(q.option_images) : undefined
        }));

        const exam = {
            ...exams[0],
            questions: parsedQuestions
        };

        return new Response(JSON.stringify({
            success: true,
            exam
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Get exam error:', error);
        return new Response(JSON.stringify({
            success: false,
            message: '시험을 불러오는 중 오류가 발생했습니다.'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// PUT /api/exams/[id] - Update exam
export async function onRequestPut(context) {
    const { request, env, params } = context;
    const examId = params.id;

    try {
        const { title, description, timeLimit, passScore, courseId, subjectId, topic, round } = await request.json();

        // Check if exam exists
        const { results: existing } = await env.DB.prepare(
            'SELECT id FROM exams WHERE id = ?'
        ).bind(examId).all();

        if (existing.length === 0) {
            return new Response(JSON.stringify({
                success: false,
                message: '시험을 찾을 수 없습니다.'
            }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Build update query dynamically
        const updates = [];
        const params = [];

        if (title !== undefined) {
            updates.push('title = ?');
            params.push(title);
        }
        if (description !== undefined) {
            updates.push('description = ?');
            params.push(description);
        }
        if (timeLimit !== undefined) {
            updates.push('time_limit = ?');
            params.push(timeLimit);
        }
        if (passScore !== undefined) {
            updates.push('pass_score = ?');
            params.push(passScore);
        }
        if (courseId !== undefined) {
            updates.push('course_id = ?');
            params.push(courseId);
        }
        if (subjectId !== undefined) {
            updates.push('subject_id = ?');
            params.push(subjectId);
        }
        if (topic !== undefined) {
            updates.push('topic = ?');
            params.push(topic);
        }
        if (round !== undefined) {
            updates.push('round = ?');
            params.push(round);
        }

        if (updates.length === 0) {
            return new Response(JSON.stringify({
                success: false,
                message: '수정할 내용이 없습니다.'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        params.push(examId);
        const query = `UPDATE exams SET ${updates.join(', ')} WHERE id = ?`;

        await env.DB.prepare(query).bind(...params).run();

        return new Response(JSON.stringify({
            success: true,
            message: '시험이 수정되었습니다.'
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Update exam error:', error);
        return new Response(JSON.stringify({
            success: false,
            message: '시험 수정 중 오류가 발생했습니다.'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// DELETE /api/exams/[id] - Delete exam
export async function onRequestDelete(context) {
    const { env, params } = context;
    const examId = params.id;

    try {
        // Check if exam exists
        const { results: existing } = await env.DB.prepare(
            'SELECT id FROM exams WHERE id = ?'
        ).bind(examId).all();

        if (existing.length === 0) {
            return new Response(JSON.stringify({
                success: false,
                message: '시험을 찾을 수 없습니다.'
            }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Delete exam (CASCADE will delete questions and results)
        await env.DB.prepare('DELETE FROM exams WHERE id = ?').bind(examId).run();

        return new Response(JSON.stringify({
            success: true,
            message: '시험이 삭제되었습니다.'
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Delete exam error:', error);
        return new Response(JSON.stringify({
            success: false,
            message: '시험 삭제 중 오류가 발생했습니다.'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
