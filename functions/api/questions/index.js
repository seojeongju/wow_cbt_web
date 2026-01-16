// GET /api/questions - Get all questions with filters
export async function onRequestGet(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const courseId = url.searchParams.get('courseId');
    const subjectId = url.searchParams.get('subjectId');
    const category = url.searchParams.get('category');
    const search = url.searchParams.get('search');

    try {
        let query = `
            SELECT 
                q.*,
                e.course_id,
                e.subject_id
            FROM questions q
            INNER JOIN exams e ON q.exam_id = e.id
            WHERE 1=1
        `;
        const params = [];

        if (courseId) {
            query += ' AND e.course_id = ?';
            params.push(courseId);
        }

        if (subjectId) {
            query += ' AND e.subject_id = ?';
            params.push(subjectId);
        }

        if (category) {
            query += ' AND q.category = ?';
            params.push(category);
        }

        if (search) {
            query += ' AND q.text LIKE ?';
            params.push(`%${search}%`);
        }

        query += ' ORDER BY q.id DESC';

        const { results: questions } = await env.DB.prepare(query).bind(...params).all();

        // Parse options JSON
        const parsedQuestions = questions.map(q => ({
            id: q.id,
            exam_id: q.exam_id,
            category: q.category,
            text: q.text,
            image_url: q.image_url,
            options: q.options ? JSON.parse(q.options) : [],
            option_images: q.option_images ? JSON.parse(q.option_images) : undefined,
            correct_answer: q.correct_answer,
            explanation: q.explanation,
            course_id: q.course_id,
            subject_id: q.subject_id
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

