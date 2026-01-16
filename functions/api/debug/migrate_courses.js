
export async function onRequest(context) {
    const { env } = context;
    try {
        // Add 'details' column to courses table
        await env.DB.prepare(`
            ALTER TABLE courses ADD COLUMN details TEXT;
        `).run();

        return new Response('Migration successful: details column added.', { status: 200 });
    } catch (e) {
        return new Response('Migration failed (maybe column exists?): ' + e.message, { status: 500 });
    }
}
