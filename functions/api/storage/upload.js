export async function onRequestPost(context) {
    const { env, request } = context;

    try {
        const formData = await request.formData();
        const file = formData.get('file');

        if (!file) {
            return new Response(JSON.stringify({ success: false, message: '파일이 없습니다.' }), {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // 고유 파일명 생성 (타임스탬프 + 랜덤)
        const fileName = file.name;
        const fileExtension = fileName.split('.').pop();
        const fileKey = `uploads/${Date.now()}-${Math.random().toString(36).substring(2, 10)}.${fileExtension}`;

        // R2에 업로드
        await env.STORAGE.put(fileKey, file.stream(), {
            httpMetadata: {
                contentType: file.type,
            }
        });

        // 결과 반환 (프론트엔드에서 접근할 URL 경로 포함)
        return new Response(JSON.stringify({
            success: true,
            url: `/api/storage/file/${fileKey}`,
            key: fileKey
        }), {
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error) {
        return new Response(JSON.stringify({ success: false, message: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}
