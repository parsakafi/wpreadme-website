import type {APIRoute} from 'astro';
import {AGENT_MD} from '../../lib/agent-md';

/**
 * Explicit markdown twins at stable URLs (e.g. /md/about), for agents and
 * tools that cannot send an Accept header. The same content is also served
 * with Accept: text/markdown negotiation on the canonical paths.
 */
export const GET: APIRoute = ({params, url}) => {
    const slug = params.slug ? `/${params.slug}` : '/';
    const normalized = slug.replace(/\/+$/, '') || '/';

    if (normalized === '/') {
        return new Response(AGENT_MD['/'], {
            headers: {
                'Content-Type': 'text/markdown; charset=utf-8',
                'Cache-Control': 'public, max-age=0, must-revalidate',
                'Vary': 'Accept, Accept-Encoding',
            },
        });
    }

    if (!(normalized in AGENT_MD)) {
        return new Response(`# 404 Not Found\n\nNo page exists at \`${url.pathname}\`. See [/llms.txt](/llms.txt) and [/sitemap.xml](/sitemap.xml) for available pages.\n`, {
            status: 404,
            headers: {
                'Content-Type': 'text/markdown; charset=utf-8',
                'Cache-Control': 'public, max-age=0, must-revalidate',
                'Vary': 'Accept, Accept-Encoding',
            },
        });
    }

    return new Response(AGENT_MD[normalized], {
        headers: {
            'Content-Type': 'text/markdown; charset=utf-8',
            'Cache-Control': 'public, max-age=0, must-revalidate',
            'Vary': 'Accept, Accept-Encoding',
        },
    });
};
