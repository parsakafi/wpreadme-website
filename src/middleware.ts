import {defineMiddleware} from 'astro:middleware';
import {AGENT_MD} from './lib/agent-md';

const PRODUCES = ['text/html', 'text/markdown'];

type AcceptEntry = {type: string; q: number; specificity: number};

function parseAccept(header: string): AcceptEntry[] {
    return header
        .split(',')
        .map((raw) => {
            const parts = raw.trim().split(';').map((s) => s.trim());
            const type = parts[0].toLowerCase();
            let q = 1;
            for (const param of parts.slice(1)) {
                const [name, value] = param.split('=').map((s) => s.trim());
                if (name === 'q') {
                    const parsed = Number(value);
                    if (!Number.isNaN(parsed)) q = Math.max(0, Math.min(1, parsed));
                }
            }
            const specificity = type === '*/*' ? 0 : type.endsWith('/*') ? 1 : 2;
            return {type, q, specificity};
        });
}

function matches(entry: AcceptEntry, candidate: string): boolean {
    if (entry.type === '*/*') return true;
    if (entry.type.endsWith('/*')) return candidate.startsWith(entry.type.slice(0, -1));
    return entry.type === candidate;
}

export function preferredType(header: string | null): string | null {
    if (!header) return PRODUCES[0];
    const entries = parseAccept(header);
    if (entries.length === 0) return PRODUCES[0];

    let best: string | null = null;
    let bestQ = -1;
    let bestPosition = Infinity;

    for (const candidate of PRODUCES) {
        // For each candidate, find the *most specific* matching range.
        // RFC 9110 §12.5.1: specific ranges override less specific ones
        // regardless of q, so `text/html;q=0, */*;q=1` correctly rejects
        // text/html instead of letting the wildcard override.
        let matched: AcceptEntry | null = null;
        let matchedPosition = Infinity;
        for (let idx = 0; idx < entries.length; idx++) {
            const e = entries[idx];
            if (!matches(e, candidate)) continue;
            if (
                matched === null ||
                e.specificity > matched.specificity ||
                (e.specificity === matched.specificity && idx < matchedPosition)
            ) {
                matched = e;
                matchedPosition = idx;
            }
        }
        if (matched === null) continue;
        const matchedQ: number = matched.q;
        if (matchedQ <= 0) continue; // explicit rejection

        // Across candidates: highest q wins; tie-break on client order
        // so `Accept: text/markdown, text/html, */*` picks text/markdown.
        if (matchedQ > bestQ || (matchedQ === bestQ && matchedPosition < bestPosition)) {
            bestQ = matchedQ;
            bestPosition = matchedPosition;
            best = candidate;
        }
    }

    return best;
}

/**
 * The response varies with the Accept header, so every cache between us and
 * the client must key on it. Without `Vary: Accept`, a CDN can serve the
 * cached HTML variant to an agent asking for markdown (or vice versa),
 * depending on which variant landed in cache first.
 */
function appendVaryAccept(headers: Headers): void {
    const existing = headers.get('Vary');
    if (!existing) {
        headers.set('Vary', 'Accept, Accept-Encoding');
        return;
    }
    const tokens = existing.split(',').map((s) => s.trim());
    if (!tokens.some((t) => t.toLowerCase() === 'accept')) {
        tokens.push('Accept');
    }
    headers.set('Vary', tokens.join(', '));
}

function markdownResponse(body: string, status = 200): Response {
    return new Response(body, {
        status,
        headers: {
            'Content-Type': 'text/markdown; charset=utf-8',
            'Cache-Control': 'public, max-age=0, must-revalidate',
        },
    });
}

export const onRequest = defineMiddleware(async (ctx, next) => {
    const pathname = ctx.url.pathname.replace(/\/+$/, '') || '/';

    // Markdown twins are served directly by their endpoint; never re-negotiate.
    if (pathname === '/md' || pathname.startsWith('/md/')) {
        const response = await next();
        appendVaryAccept(response.headers);
        return response;
    }

    // Only negotiate for page-like paths. Requests for files (css, js, fonts,
    // images, robots.txt, ...) always get exactly what is on disk, and /api/*
    // endpoints always answer JSON regardless of the Accept header.
    const lastSegment = pathname.split('/').pop() ?? '';
    const isPagePath = !lastSegment.includes('.') && !pathname.startsWith('/_image');
    if (!isPagePath || pathname === '/api' || pathname.startsWith('/api/')) {
        return next();
    }

    const chosen = preferredType(ctx.request.headers.get('accept'));

    // Client explicitly rejected everything we can produce: say so per RFC 9110.
    if (chosen === null) {
        const response = markdownResponse(
            `# 406 Not Acceptable\n\nThis resource is available as:\n\n- text/html\n- text/markdown\n`,
            406,
        );
        appendVaryAccept(response.headers);
        return response;
    }

    // Agents asking for markdown get the markdown twin of known pages...
    if (chosen === 'text/markdown') {
        const md = AGENT_MD[pathname];
        if (md) {
            const response = markdownResponse(md);
            appendVaryAccept(response.headers);
            return response;
        }
        // ...and a recoverable markdown 404 for everything else.
        const response = markdownResponse(`# 404 Not Found

The path \`${pathname}\` does not exist on WPReadme Preview.

## Where to look next

- [Home](/), the readme.txt editor, live preview, and validator
- [About](/about), what this tool does and which readme sections it supports
- [API & Developers](/developers), free JSON API to parse and validate readme.txt files
- [Contact](/contact), how to reach the developer
- [Privacy](/privacy), what data is (and is not) collected
- [Donate](/donate), support the project
- [llms.txt](/llms.txt), machine-readable agent instructions
- [Sitemap](/sitemap.xml), all public pages
- [OpenAPI spec](/openapi.json), machine-readable API specification

This site is a free online tool that previews a WordPress plugin readme.txt file exactly like WordPress.org will render it. To validate a readme programmatically: POST {"readme": "..."} to /api/validate.`, 404);
        appendVaryAccept(response.headers);
        return response;
    }

    const response = await next();
    appendVaryAccept(response.headers);
    return response;
});
