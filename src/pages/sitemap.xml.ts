import type {APIRoute} from 'astro';

// The route list is fixed and small; keeping it explicit means the sitemap
// stays correct even though every route is rendered at request time.
const ROUTES = ['/', '/about', '/contact', '/donate', '/privacy'];

export const GET: APIRoute = ({site}) => {
    const base = site ?? new URL('https://wpreadme.ir');
    const urls = ROUTES.map((route) => {
        const loc = new URL(route, base).href;
        return `    <url><loc>${loc}</loc></url>`;
    }).join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

    return new Response(xml, {
        headers: {
            'Content-Type': 'application/xml; charset=utf-8',
            'Cache-Control': 'public, max-age=0, must-revalidate',
        },
    });
};
