// GET /api/cbt/exams
export async function onRequestGet(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const courseName = url.searchParams.get('courseName');
    const includeInactive = url.searchParams.get('includeInactive') === 'true';

    try {
        const params = [];
        let results = [];
        try {
            let query = `
                SELECT
                    ce.*,
                    COALESCE(c.name, ce.course_id) AS course_name,
                    s.name AS subject_name,
                    COUNT(ceq.question_id) AS question_count
                FROM cbt_exams ce
                LEFT JOIN courses c ON ce.course_id = c.id
                LEFT JOIN subjects s ON ce.subject_id = s.id
                LEFT JOIN cbt_exam_questions ceq ON ce.id = ceq.cbt_exam_id
                WHERE 1=1
            `;

            if (!includeInactive) {
                query += ` AND ce.is_active = 1`;
            }

            if (courseName) {
                query += ` AND (c.name = ? OR ce.course_id = ?)`;
                params.push(courseName, courseName);
            }

            query += ` GROUP BY ce.id ORDER BY ce.created_at DESC`;
            const queryResult = await env.DB.prepare(query).bind(...params).all();
            results = queryResult.results || [];
        } catch (primaryError) {
            // Fallback for partially migrated schema (e.g., missing is_active/joins).
            try {
                let fallbackQuery = `
                    SELECT
                        ce.id,
                        ce.title,
                        ce.course_id,
                        ce.subject_id,
                        ce.topic,
                        ce.round,
                        ce.description,
                        ce.time_limit,
                        ce.pass_score,
                        ce.created_at,
                        COALESCE(c.name, ce.course_id) AS course_name,
                        s.name AS subject_name
                    FROM cbt_exams ce
                    LEFT JOIN courses c ON ce.course_id = c.id
                    LEFT JOIN subjects s ON ce.subject_id = s.id
                    WHERE 1=1
                `;
                const fallbackParams = [];
                if (courseName) {
                    fallbackQuery += ` AND (c.name = ? OR ce.course_id = ?)`;
                    fallbackParams.push(courseName, courseName);
                }
                fallbackQuery += ` ORDER BY ce.created_at DESC`;
                const fallbackResult = await env.DB.prepare(fallbackQuery).bind(...fallbackParams).all();
                results = (fallbackResult.results || []).map(r => ({ ...r, question_count: 0, is_active: 1 }));
                console.warn('cbt exams list fallback query used:', primaryError?.message || primaryError);
            } catch (fallbackError) {
                if (String(fallbackError?.message || fallbackError).includes('no such table: cbt_exams')) {
                    // Production-safe behavior before CBT table migration.
                    return new Response(JSON.stringify({ success: true, exams: [] }), {
                        status: 200,
                        headers: { 'Content-Type': 'application/json' }
                    });
                }
                throw fallbackError;
            }
        }

        return new Response(JSON.stringify({
            success: true,
            exams: (results || []).map(e => ({
                id: e.id,
                title: e.title,
                courseId: e.course_id,
                courseName: e.course_name,
                subjectId: e.subject_id,
                subjectName: e.subject_name,
                topic: e.topic,
                round: e.round,
                description: e.description,
                timeLimit: e.time_limit,
                passScore: e.pass_score,
                isActive: e.is_active === undefined ? true : Number(e.is_active) === 1,
                questionCount: e.question_count || 0
            }))
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    } catch (error) {
        console.error('cbt exams list error', error);
        return new Response(JSON.stringify({ success: false, message: 'CBT 시험 목록 조회 실패' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// POST /api/cbt/exams
export async function onRequestPost(context) {
    const { request, env } = context;
    try {
        const {
            title, courseId, subjectId, topic, round, description,
            timeLimit, passScore, questionIds, adminUserId, adminUserName
        } = await request.json();

        if (!adminUserId) {
            return new Response(JSON.stringify({
                success: false,
                message: '관리자 인증 정보가 필요합니다.'
            }), { status: 401, headers: { 'Content-Type': 'application/json' } });
        }
        const admin = await env.DB.prepare(
            'SELECT id, name, role FROM users WHERE id = ?'
        ).bind(adminUserId).first();
        if (!admin || admin.role !== 'admin') {
            return new Response(JSON.stringify({
                success: false,
                message: '관리자 권한이 없습니다.'
            }), { status: 403, headers: { 'Content-Type': 'application/json' } });
        }

        if (!title || !Array.isArray(questionIds) || questionIds.length === 0) {
            return new Response(JSON.stringify({
                success: false,
                message: '시험 제목과 문제를 확인해주세요.'
            }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }
        if (!courseId) {
            return new Response(JSON.stringify({
                success: false,
                message: '과정을 선택해주세요.'
            }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }

        // Ensure all selected questions actually belong to the selected course.
        const sanitizedQuestionIds = Array.from(new Set(questionIds.filter(Boolean)));
        const placeholders = sanitizedQuestionIds.map(() => '?').join(',');
        const { results: courseRows } = await env.DB.prepare(
            'SELECT id, name FROM courses WHERE id = ?'
        ).bind(courseId).all();
        const resolvedCourseName = courseRows?.[0]?.name || null;
        const courseMatchClause = resolvedCourseName ? '(e.course_id = ? OR e.course_id = ?)' : '(e.course_id = ?)';
        const validationParams = resolvedCourseName
            ? [courseId, resolvedCourseName, ...sanitizedQuestionIds]
            : [courseId, ...sanitizedQuestionIds];
        const { results: validRows } = await env.DB.prepare(`
            SELECT q.id
            FROM questions q
            JOIN exams e ON e.id = q.exam_id
            WHERE ${courseMatchClause}
              AND q.id IN (${placeholders})
        `).bind(...validationParams).all();
        const validIds = new Set((validRows || []).map(r => r.id));
        if (validIds.size !== sanitizedQuestionIds.length) {
            return new Response(JSON.stringify({
                success: false,
                message: '선택한 과정에 속하지 않은 문항이 포함되어 있습니다. 문항을 다시 선택해주세요.'
            }), { status: 400, headers: { 'Content-Type': 'application/json' } });
        }

        const examId = `cbt_exam_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const now = new Date().toISOString();

        await env.DB.prepare(`
            INSERT INTO cbt_exams
            (id, title, course_id, subject_id, topic, round, description, time_limit, pass_score, is_active, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
        `).bind(
            examId,
            title,
            courseId || null,
            subjectId || null,
            topic || null,
            round || null,
            description || '',
            Number(timeLimit) || 60,
            Number(passScore) || 60,
            now
        ).run();

        const statements = sanitizedQuestionIds.map((questionId, idx) =>
            env.DB.prepare(`
                INSERT INTO cbt_exam_questions (id, cbt_exam_id, question_id, order_no, created_at)
                VALUES (?, ?, ?, ?, ?)
            `).bind(
                `cbt_eq_${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 6)}`,
                examId,
                questionId,
                idx + 1,
                now
            )
        );
        await env.DB.batch(statements);

        const logId = `cbt_log_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        try {
            await env.DB.prepare(`
                INSERT INTO cbt_admin_logs (id, action, cbt_exam_id, admin_user_id, admin_user_name, note, created_at)
                VALUES (?, 'create_exam', ?, ?, ?, ?, ?)
            `).bind(
                logId,
                examId,
                admin.id || null,
                admin.name || adminUserName || null,
                `${title} (${sanitizedQuestionIds.length}문항)`,
                now
            ).run();
        } catch (logError) {
            // Backward compatibility: run even if DB didn't apply actor columns yet.
            await env.DB.prepare(`
                INSERT INTO cbt_admin_logs (id, action, cbt_exam_id, note, created_at)
                VALUES (?, 'create_exam', ?, ?, ?)
            `).bind(
                logId,
                examId,
                `${title} (${sanitizedQuestionIds.length}문항)`,
                now
            ).run();
            console.warn('cbt admin log actor columns unavailable:', logError?.message || logError);
        }

        return new Response(JSON.stringify({
            success: true,
            examId,
            message: 'CBT 시험이 생성되었습니다.'
        }), { status: 201, headers: { 'Content-Type': 'application/json' } });
    } catch (error) {
        console.error('cbt exams create error', error);
        return new Response(JSON.stringify({ success: false, message: 'CBT 시험 생성 실패' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
