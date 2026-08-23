import type {APIRoute} from 'astro';

// @ts-ignore
const robotsTxt = `
User-agent: *
Allow: /

Sitemap: ${new URL('sitemap.xml', import.meta.env.SITE).href}
# Agent instructions: ${new URL('llms.txt', import.meta.env.SITE).href}
`.trim();

export const GET: APIRoute = () => {
    return new Response(robotsTxt, {
        headers: {
            'Content-Type': 'text/plain; charset=utf-8',
        },
    });
};