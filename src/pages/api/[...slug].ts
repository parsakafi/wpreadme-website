import type {APIRoute} from 'astro';
import {jsonError, methodNotAllowed} from '../../lib/api';

/**
 * Catch-all under /api/*: unknown endpoints answer with a JSON 404 envelope
 * so agents never receive an HTML error page from the API surface.
 */
export const ALL: APIRoute = ({request, params}) => {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
        // Only POST endpoints exist; anything else is a method problem.
        return methodNotAllowed('POST');
    }

    return jsonError(
        404,
        'unknown_endpoint',
        `No API endpoint exists at /api/${params.slug ?? ''}.`,
        'Valid endpoints: POST /api/parse and POST /api/validate. See /openapi.json for the full specification.',
    );
};
