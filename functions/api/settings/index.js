// GET /api/settings - Get all settings
export async function onRequestGet(context) {
    const { env } = context;

    try {
        const { results: settings } = await env.DB.prepare(
            'SELECT * FROM system_settings'
        ).all();

        // Convert to object format
        const settingsObj = {};
        settings.forEach(s => {
            // Convert string 'true'/'false' to boolean
            if (s.value === 'true') {
                settingsObj[s.key] = true;
            } else if (s.value === 'false') {
                settingsObj[s.key] = false;
            } else if (!isNaN(Number(s.value))) {
                settingsObj[s.key] = Number(s.value);
            } else {
                settingsObj[s.key] = s.value;
            }
        });

        return new Response(JSON.stringify({
            success: true,
            settings: settingsObj
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Get settings error:', error);
        return new Response(JSON.stringify({
            success: false,
            message: '설정을 불러오는 중 오류가 발생했습니다.'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// PUT /api/settings - Update settings
export async function onRequestPut(context) {
    const { request, env } = context;

    try {
        const settings = await request.json(); // { key1: value1, key2: value2, ... }

        // Update each setting
        for (const [key, value] of Object.entries(settings)) {
            const valueStr = typeof value === 'boolean' ? (value ? 'true' : 'false') : String(value);

            await env.DB.prepare(`
                INSERT INTO system_settings (key, value, updated_at) 
                VALUES (?, ?, datetime('now'))
                ON CONFLICT(key) DO UPDATE SET 
                    value = excluded.value, 
                    updated_at = datetime('now')
            `).bind(key, valueStr).run();
        }

        return new Response(JSON.stringify({
            success: true,
            message: '설정이 저장되었습니다.'
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Update settings error:', error);
        return new Response(JSON.stringify({
            success: false,
            message: '설정 저장 중 오류가 발생했습니다.'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
