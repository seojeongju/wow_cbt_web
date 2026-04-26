// /api/auth/login
import bcrypt from 'bcryptjs';

export async function onRequestPost(context) {
    const { request, env } = context;

    try {
        const { email, password, role } = await request.json();

        // Validate input
        if (!email || !password || !role) {
            return new Response(JSON.stringify({
                success: false,
                message: '이메일, 비밀번호, 역할을 모두 입력해주세요.'
            }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Query user from D1 (Email Check First)
        const { results } = await env.DB.prepare(
            'SELECT * FROM users WHERE email = ?'
        ).bind(email).all();

        if (results.length === 0) {
            return new Response(JSON.stringify({
                success: false,
                message: '사용자를 찾을 수 없습니다.'
            }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const user = results[0];

        // Check Role Match
        if (user.role !== role) {
            const correctTab = user.role === 'admin' ? '관리자' : '수강생';
            return new Response(JSON.stringify({
                success: false,
                message: `해당 계정은 [${correctTab}] 권한을 가지고 있습니다. ${correctTab} 로그인 탭을 이용해주세요.`
            }), {
                status: 403,
                headers: { 'Content-Type': 'application/json' }
            });
        }



        // Check password with bcrypt (and fallback for legacy plaintext)
        let isValid = false;
        try {
            isValid = await bcrypt.compare(password, user.password);
        } catch (e) {
            // Not a valid hash probably
        }

        if (!isValid && user.password === password) {
            isValid = true;
            // Auto-migrate to bcrypt
            try {
                const salt = await bcrypt.genSalt(10);
                const hash = await bcrypt.hash(password, salt);
                await env.DB.prepare('UPDATE users SET password = ? WHERE id = ?').bind(hash, user.id).run();
                console.log(`Migrated password for user ${email}`);
            } catch (err) {
                console.error('Password migration failed', err);
            }
        }

        if (!isValid) {
            return new Response(JSON.stringify({
                success: false,
                message: '비밀번호가 일치하지 않습니다.'
            }), {
                status: 401,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Check if user is approved
        if (!user.approved) {
            return new Response(JSON.stringify({
                success: false,
                message: '계정이 승인 대기 중입니다. 관리자 승인 후 이용 가능합니다.'
            }), {
                status: 403,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Update last login
        await env.DB.prepare(
            'UPDATE users SET last_login_at = datetime("now") WHERE id = ?'
        ).bind(user.id).run();

        // ---------------------------------------------------------
        // ROBUST DATA FETCHING STRATEGY (WITH DEBUG)
        // ---------------------------------------------------------

        const query = `
            SELECT ce.id, ce.user_id, ce.course_id, ce.status, ce.created_at, ce.expires_at, c.name as course_name 
            FROM course_enrollments ce
            LEFT JOIN courses c ON ce.course_id = c.id
        `;

        // No WHERE clause to guarantee we get data
        const { results: allEnrollments } = await env.DB.prepare(query).all();

        // Robust filtering: ensure string comparison and trim whitespace
        const targetUserId = String(user.id).trim();

        const myEnrollments = (allEnrollments || []).filter(e => {
            if (!e.user_id) return false;
            return String(e.user_id).trim() === targetUserId;
        });

        // 1. Filter Active/Approved Enrollments
        const activeEnrollments = myEnrollments.filter(e => {
            const s = (e.status || '').trim();
            return s === 'active' || s === 'approved';
        });

        // 2. Filter Pending Enrollments
        const pendingEnrollments = myEnrollments.filter(e => {
            const s = (e.status || '').trim();
            return s === 'pending';
        });

        // DEBUG INFO to solve the mystery
        const debugInfo = {
            loginTime: new Date().toISOString(),
            targetUserId: targetUserId,
            allEnrollmentsCount: (allEnrollments || []).length,
            myEnrollmentsCount: myEnrollments.length,
            activeCount: activeEnrollments.length,
            pendingCount: pendingEnrollments.length,
            dbSample: (allEnrollments || []).slice(0, 3).map(e => ({ uid: e.user_id, status: e.status })),
            myMatchSample: myEnrollments.slice(0, 3)
        };
        console.log('[Login Debug]', JSON.stringify(debugInfo));

        // Response Data Construction
        const userData = {
            id: user.id,
            email: user.email,
            name: user.name,
            phone: user.phone,
            role: user.role,
            approved: user.approved,
            courseEnrollments: activeEnrollments.map(e => ({
                courseId: e.course_id,
                courseName: e.course_name || e.course_id,
                status: e.status,
                expiresAt: e.expires_at
            })),
            pendingCourses: pendingEnrollments.map(p => p.course_name || p.course_id),
            debug: debugInfo // Send to frontend
        };

        return new Response(JSON.stringify({
            success: true,
            user: userData
        }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                // Prevent caching to ensure fresh data on login
                'Cache-Control': 'no-store, max-age=0'
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        return new Response(JSON.stringify({
            success: false,
            message: '로그인 처리 중 오류가 발생했습니다.',
            debugError: String(error)
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
