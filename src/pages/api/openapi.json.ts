import type {APIRoute} from 'astro';
import {buildOpenApiSpec} from '../../lib/openapi';

/**
 * GET /api/openapi.json
 * Same specification as /openapi.json, served under the API prefix too.
 */
export const GET: APIRoute = () => {
    return new Response(JSON.stringify(buildOpenApiSpec(), null, 2), {
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'public, max-age=0, must-revalidate',
        },
    });
};
