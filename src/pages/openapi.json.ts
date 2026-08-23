import type {APIRoute} from 'astro';
import {buildOpenApiSpec} from '../lib/openapi';

/**
 * GET /openapi.json
 * OpenAPI 3.1 specification describing the public API.
 */
export const GET: APIRoute = () => {
    return new Response(JSON.stringify(buildOpenApiSpec(), null, 2), {
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'public, max-age=0, must-revalidate',
        },
    });
};
