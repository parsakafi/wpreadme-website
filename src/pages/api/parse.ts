import type {APIRoute} from 'astro';
import {parseReadme} from '../../lib/readme-parser';
import {jsonResponse, methodNotAllowed, readReadmeInput} from '../../lib/api';

/**
 * POST /api/parse
 * Parses a WordPress readme.txt string into structured JSON.
 */
export const ALL: APIRoute = async ({request}) => {
    // ALL shadows per-method exports on this Astro version, so dispatch here.
    if (request.method !== 'POST') {
        return methodNotAllowed('POST');
    }

    const result = await readReadmeInput(request);
    if (!result.ok) return result.response;

    return jsonResponse({data: parseReadme(result.input.readme)});
};
