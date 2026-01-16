export async function onRequestGet(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const courseId = url.searchParams.get('courseId');

    try {
        let query = 'SELECT * FROM subjects';
        const params = [];

        if (courseId) {
            query += ' WHERE course_id = ?';
            params.push(courseId);
        }

        query += ' ORDER BY created_at DESC';

        const { results: subjects } = await env.DB.prepare(query).bind(...params).all();

        return new Response(JSON.stringify({
            success: true,
            subjects
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    } catch (error) {
        return new Response(JSON.stringify({ success: false, message: error.message }), { status: 500 });
    }
}

export async function onRequestPost(context) {
    const { request, env } = context;
    try {
        const { courseId, name } = await request.json();
        if (!courseId || !name) throw new Error('Course ID and Name are required');

        const id = `subj_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

        await env.DB.prepare('INSERT INTO subjects (id, course_id, name) VALUES (?, ?, ?)').bind(id, courseId, name).run();

        return new Response(JSON.stringify({ success: true, id, message: '과목이 생성되었습니다.' }), { status: 201 });
    } catch (error) {
        return new Response(JSON.stringify({ success: false, message: error.message }), { status: 500 });
    }
}
