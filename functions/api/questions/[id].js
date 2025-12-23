// PUT /api/questions/[id] - Update question
export async function onRequestPut(context) {
    const { request, env, params } = context;
    const questionId = params.id;

    try {
        const body = await request.json();
        console.log('[PUT /api/questions/:id] Received update request:', { questionId, body });

        const { category, text, options, correctAnswer, explanation, imageUrl, optionImages } = body;

        // Check if question exists
        const { results: existing } = await env.DB.prepare(
            'SELECT id FROM questions WHERE id = ?'
        ).bind(questionId).all();

        if (existing.length === 0) {
            return new Response(JSON.stringify({
                success: false,
                message: '문제를 찾을 수 없습니다.'
            }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Build update query
        const updates = [];
        const params = [];

        if (category !== undefined) {
            updates.push('category = ?');
            params.push(category);
        }
        if (text !== undefined) {
            updates.push('text = ?');
            params.push(text);
        }
        if (options !== undefined) {
            updates.push('options = ?');
            params.push(options && options.length > 0 ? JSON.stringify(options) : null);
        }
        if (correctAnswer !== undefined) {
            updates.push('correct_answer = ?');
            params.push(String(correctAnswer));
        }
        if (explanation !== undefined) {
            updates.push('explanation = ?');
            params.push(explanation);
        }
        if (imageUrl !== undefined) {
            updates.push('image_url = ?');
            // null을 명시적으로 전달하여 이미지 삭제 처리
            params.push(imageUrl === null ? null : (imageUrl || null));
            console.log('[PUT /api/questions/:id] Image URL update:', { imageUrl, willSetTo: imageUrl === null ? null : (imageUrl || null) });
        }
        if (optionImages !== undefined) {
            updates.push('option_images = ?');
            // null 배열 처리: null이거나 빈 배열이면 null, 그 외는 JSON 문자열로 저장
            const optionImagesStr = optionImages === null || (Array.isArray(optionImages) && optionImages.length === 0) ? null : JSON.stringify(optionImages);
            params.push(optionImagesStr);
            console.log('[PUT /api/questions/:id] Option Images update:', {
                hasContent: !!optionImagesStr,
                length: optionImagesStr ? optionImagesStr.length : 0
            });
        }

        // ⭐️ Exam ID Update (Move Question)
        if (body.examId !== undefined) {
            updates.push('exam_id = ?');
            params.push(body.examId);
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

        params.push(questionId);
        const query = `UPDATE questions SET ${updates.join(', ')} WHERE id = ?`;

        console.log('[PUT /api/questions/:id] Executing query:', { query, params });
        const result = await env.DB.prepare(query).bind(...params).run();
        console.log('[PUT /api/questions/:id] Update successful:', result);

        return new Response(JSON.stringify({
            success: true,
            message: '문제가 수정되었습니다.'
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('[PUT /api/questions/:id] Update question error:', error);
        return new Response(JSON.stringify({
            success: false,
            message: '문제 수정 중 오류가 발생했습니다.',
            error: error.message
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// DELETE /api/questions/[id] - Delete question
export async function onRequestDelete(context) {
    const { env, params } = context;
    const questionId = params.id;

    try {
        // Check if question exists
        const { results: existing } = await env.DB.prepare(
            'SELECT id FROM questions WHERE id = ?'
        ).bind(questionId).all();

        if (existing.length === 0) {
            return new Response(JSON.stringify({
                success: false,
                message: '문제를 찾을 수 없습니다.'
            }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        await env.DB.prepare('DELETE FROM questions WHERE id = ?').bind(questionId).run();

        return new Response(JSON.stringify({
            success: true,
            message: '문제가 삭제되었습니다.'
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Delete question error:', error);
        return new Response(JSON.stringify({
            success: false,
            message: '문제 삭제 중 오류가 발생했습니다.'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
