// GET /api/cbt/admin/logs?limit=100
export async function onRequestGet(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    const limit = Math.min(Number(url.searchParams.get('limit') || 100), 300);

    try {
        const hasLogsTable = await env.DB.prepare(`
            SELECT name FROM sqlite_master
            WHERE type = 'table' AND name = 'cbt_admin_logs'
            LIMIT 1
        `).first();
        if (!hasLogsTable) {
            return new Response(JSON.stringify({
                success: true,
                logs: []
            }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }

        let results = [];
        try {
            const queryResult = await env.DB.prepare(`
                SELECT
                    l.*,
                    e.title AS exam_title,
                    u.name AS admin_name_from_users
                FROM cbt_admin_logs l
                LEFT JOIN cbt_exams e ON e.id = l.cbt_exam_id
                LEFT JOIN users u ON u.id = l.admin_user_id
                ORDER BY l.created_at DESC
                LIMIT ?
            `).bind(limit).all();
            results = queryResult.results || [];
        } catch (errorWithActorColumns) {
            console.warn('cbt admin logs primary query failed:', errorWithActorColumns?.message || errorWithActorColumns);
            try {
                const fallbackResult = await env.DB.prepare(`
                    SELECT
                        l.*,
                        e.title AS exam_title
                    FROM cbt_admin_logs l
                    LEFT JOIN cbt_exams e ON e.id = l.cbt_exam_id
                    ORDER BY l.created_at DESC
                    LIMIT ?
                `).bind(limit).all();
                results = fallbackResult.results || [];
            } catch (fallbackJoinError) {
                console.warn('cbt admin logs join fallback failed:', fallbackJoinError?.message || fallbackJoinError);
                const minimalResult = await env.DB.prepare(`
                    SELECT *
                    FROM cbt_admin_logs
                    ORDER BY created_at DESC
                    LIMIT ?
                `).bind(limit).all();
                results = minimalResult.results || [];
            }
        }

        return new Response(JSON.stringify({
            success: true,
            logs: results
        }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    } catch (error) {
        console.error('cbt admin logs list error', error);
        return new Response(JSON.stringify({ success: false, message: '관리자 로그 조회 실패' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
