/**
 * Shared helpers for the public JSON API under /api/*.
 *
 * Every error response uses a single machine-readable envelope:
 * { "error": { "code": "...", "message": "...", "hint": "..." } }
 */

export const MAX_BODY_BYTES = 1024 * 1024; // 1 MB

export interface ReadmeInput {
    readme: string;
}

type InputResult =
    | { ok: true; input: ReadmeInput }
    | { ok: false; response: Response };

export function jsonResponse(body: unknown, status = 200): Response {
    return new Response(JSON.stringify(body, null, 2), {
        status,
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'no-store',
        },
    });
}

export function jsonError(
    status: number,
    code: string,
    message: string,
    hint?: string,
): Response {
    return jsonResponse({error: {code, message, ...(hint ? {hint} : {})}}, status);
}

export function methodNotAllowed(allowed: string): Response {
    return jsonError(
        405,
        'method_not_allowed',
        `This endpoint only accepts ${allowed}.`,
        `Retry with the ${allowed} method and header Content-Type: application/json.`,
    );
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Accepts {"readme": "..."} as application/json or a raw text/plain body.
 * Returns a ready-to-send JSON error response on any failure.
 */
export async function readReadmeInput(request: Request): Promise<InputResult> {
    const contentLength = Number(request.headers.get('content-length') ?? 0);
    if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
        return {
            ok: false, response: jsonError(
                413,
                'payload_too_large',
                'Request body exceeds 1 MB.',
                'WordPress.org caps readme.txt at 10 KB, so trim your content before validating.',
            )
        };
    }

    const contentType = (request.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase();

    let raw: unknown;
    if (contentType === 'application/json') {
        try {
            raw = await request.json();
        } catch {
            return {
                ok: false, response: jsonError(
                    400,
                    'invalid_json',
                    'Request body is not valid JSON.',
                    'Send Content-Type: application/json with a body like {"readme": "=== Plugin Name ===\\n..."}, or send text/plain with the raw readme.txt content.',
                )
            };
        }
    } else if (contentType === 'text/plain' || contentType === '') {
        const text = await request.text();
        if (!text.trim()) {
            return {
                ok: false, response: jsonError(
                    400,
                    'missing_readme',
                    'Request body is empty.',
                    'Send Content-Type: application/json with a body like {"readme": "=== Plugin Name ===\\n..."}, or send text/plain with the raw readme.txt content.',
                )
            };
        }
        return {ok: true, input: {readme: text}};
    } else {
        return {
            ok: false, response: jsonError(
                415,
                'unsupported_media_type',
                `Content-Type "${contentType}" is not supported.`,
                'Use application/json ({"readme": "..."}) or text/plain (raw readme.txt).',
            )
        };
    }

    if (!isRecord(raw) || !('readme' in raw)) {
        return {
            ok: false, response: jsonError(
                400,
                'missing_readme',
                'Missing required field "readme".',
                'The JSON body must look like {"readme": "<full readme.txt contents>"}',
            )
        };
    }

    const {readme} = raw;
    if (typeof readme !== 'string' || !readme.trim()) {
        return {
            ok: false, response: jsonError(
                400,
                'invalid_readme',
                'Field "readme" must be a non-empty string.',
                'Pass the full readme.txt contents, including the === Plugin Name === header.',
            )
        };
    }

    return {ok: true, input: {readme}};
}
