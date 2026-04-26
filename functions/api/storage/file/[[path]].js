export async function onRequestGet(context) {
    const { env, params } = context;
    
    // params.path는 배열 형태로 들어옴 (예: ["uploads", "123.png"])
    const fileKey = params.path.join('/');

    try {
        const object = await env.STORAGE.get(fileKey);

        if (object === null) {
            return new Response('File Not Found', { status: 404 });
        }

        const headers = new Headers();
        object.writeHttpMetadata(headers);
        headers.set('etag', object.httpEtag);
        headers.set('Cache-Control', 'public, max-age=31536000'); // 1년 캐시

        return new Response(object.body, {
            headers,
        });

    } catch (error) {
        return new Response(error.message, { status: 500 });
    }
}
