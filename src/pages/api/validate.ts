import type {APIRoute} from 'astro';
import {validateReadme} from '../../lib/readme-validator';
import {jsonResponse, methodNotAllowed, readReadmeInput} from '../../lib/api';

/**
 * POST /api/validate
 * Validates a WordPress readme.txt string against WordPress.org requirements.
 */
export const ALL: APIRoute = async ({request}) => {
    // ALL shadows per-method exports on this Astro version, so dispatch here.
    if (request.method !== 'POST') {
        return methodNotAllowed('POST');
    }

    const result = await readReadmeInput(request);
    if (!result.ok) return result.response;

    return jsonResponse(validateReadme(result.input.readme));
};
