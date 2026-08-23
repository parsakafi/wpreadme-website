/**
 * OpenAPI 3.1 specification for the WPReadme Preview public API.
 *
 * Every operation has a unique operationId, a description, typed parameters,
 * and response schemas so agents can call it via LLM function calling.
 */

const SITE = 'https://wpreadme.ir';

const ReadmeInput = {
    type: 'object',
    required: ['readme'],
    properties: {
        readme: {
            type: 'string',
            description: 'Full WordPress readme.txt contents, including the === Plugin Name === header.',
            examples: ['=== My Awesome Plugin ===\nContributors: developername\nTags: woocommerce, ecommerce\nRequires at least: 6.0\nTested up to: 6.6\nStable tag: 1.2.0\nLicense: GPLv2 or later\n\nA lightweight WooCommerce plugin.\n\n== Description ==\n\nDescribe the plugin here.\n\n== Installation ==\n\n1. Upload and activate.\n\n== Changelog ==\n\n= 1.2.0 =\n* Added: product comparison'],
        },
    },
} as const;

const ErrorEnvelope = {
    type: 'object',
    required: ['error'],
    properties: {
        error: {
            type: 'object',
            required: ['code', 'message'],
            properties: {
                code: {
                    type: 'string',
                    description: 'Machine-readable error identifier, e.g. invalid_json, missing_readme, method_not_allowed.',
                },
                message: {type: 'string', description: 'Human-readable explanation of what went wrong.'},
                hint: {type: 'string', description: 'Actionable suggestion for fixing the request.'},
            },
        },
    },
} as const;

const ReadmeSection = {
    type: 'object',
    required: ['title', 'content'],
    properties: {
        title: {type: 'string', description: 'Section heading, e.g. "Description" or "Changelog".'},
        content: {type: 'string', description: 'Raw section body text.'},
    },
} as const;

const FaqItem = {
    type: 'object',
    required: ['question', 'answer'],
    properties: {
        question: {type: 'string'},
        answer: {type: 'string'},
    },
} as const;

const ScreenshotItem = {
    type: 'object',
    required: ['number', 'caption'],
    properties: {
        number: {type: 'string', description: 'Screenshot ordinal from the numbered list.'},
        caption: {type: 'string'},
    },
} as const;

const ReadmeData = {
    type: 'object',
    required: ['name', 'shortDescription', 'headers', 'sections', 'faq', 'screenshots'],
    properties: {
        name: {type: 'string', description: 'Plugin name from the === Plugin Name === header; empty string when absent.'},
        shortDescription: {type: 'string', description: 'Plain-text short description between header metadata and the first section.'},
        headers: {
            type: 'object',
            additionalProperties: {type: 'string'},
            description: 'Header fields keyed exactly as written (Contributors, Tags, Stable tag, License, ...).',
        },
        sections: {type: 'array', items: {$ref: '#/components/schemas/ReadmeSection'}},
        faq: {type: 'array', items: {$ref: '#/components/schemas/FaqItem'}},
        screenshots: {type: 'array', items: {$ref: '#/components/schemas/ScreenshotItem'}},
    },
} as const;

const ValidationCheck = {
    type: 'object',
    required: ['id', 'category', 'status', 'label', 'detail', 'tip'],
    properties: {
        id: {
            type: 'string',
            description: 'Stable check identifier.',
            enum: [
                'plugin_name_header', 'contributors', 'tags', 'stable_tag', 'license',
                'short_description', 'description_section', 'changelog_section', 'file_size',
                'requires_at_least', 'tested_up_to', 'installation_section',
                'requires_php', 'faq_section', 'screenshots_section', 'donate_link',
            ],
        },
        category: {type: 'string', enum: ['required', 'recommended', 'optional']},
        status: {type: 'string', enum: ['pass', 'fail', 'warn', 'info'], description: '"info" marks optional checks that are not set.'},
        label: {type: 'string'},
        detail: {type: ['string', 'null'], description: 'What was found, or why the check failed; null when trivially satisfied.'},
        tip: {type: ['string', 'null'], description: 'Exact line(s) to add plus a documentation link, present when the check is not passing.'},
    },
} as const;

export function buildOpenApiSpec() {
    return {
        openapi: '3.1.0',
        info: {
            title: 'WPReadme Preview API',
            version: '1.0.0',
            summary: 'Parse and validate WordPress plugin readme.txt files.',
            description: `Free JSON API for the tool at ${SITE}. It parses the standard WordPress readme.txt format and validates it against WordPress.org plugin directory requirements (the same checks shown by the in-browser validator).

No API key or registration is required. Send requests to https://wpreadme.ir/api/parse and https://wpreadme.ir/api/validate with a JSON body {"readme": "..."} or a raw text/plain body. Bodies are capped at 1 MB; WordPress.org itself caps readme.txt at 10 KB.

All errors return an application/json envelope: {"error": {"code", "message", "hint"}}.

This document is also available at ${SITE}/openapi.json. Human-readable docs live at ${SITE}/developers and agent instructions at ${SITE}/llms.txt.`,
            contact: {
                name: 'Parsa Kafi',
                email: 'parsadeng@gmail.com',
                url: `${SITE}/contact`,
            },
            license: {
                name: 'GPL-2.0-or-later',
                url: 'https://www.gnu.org/licenses/gpl-2.0.html',
            },
        },
        servers: [{url: SITE, description: 'Production'}],
        tags: [
            {name: 'Parsing', description: 'Turn readme.txt text into structured JSON.'},
            {name: 'Validation', description: 'Check readme.txt against WordPress.org requirements.'},
        ],
        paths: {
            '/api/parse': {
                post: {
                    tags: ['Parsing'],
                    operationId: 'parseReadme',
                    summary: 'Parse a readme.txt file into structured JSON.',
                    description: 'Accepts {"readme": "..."} as application/json or the raw file as text/plain. Returns the plugin name, headers, sections, FAQ items, and screenshots extracted from the file. Malformed input produces the standard error envelope with a resolution hint.',
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {schema: {$ref: '#/components/schemas/ReadmeInput'}},
                            'text/plain': {schema: {type: 'string', description: 'Raw readme.txt contents.'}},
                        },
                    },
                    responses: {
                        '200': {
                            description: 'Parsed readme data.',
                            content: {'application/json': {schema: {$ref: '#/components/schemas/ParseResponse'}}},
                        },
                        '400': {$ref: '#/components/responses/BadRequest'},
                        '413': {$ref: '#/components/responses/PayloadTooLarge'},
                        '415': {$ref: '#/components/responses/UnsupportedMediaType'},
                        '405': {$ref: '#/components/responses/MethodNotAllowed'},
                    },
                },
            },
            '/api/validate': {
                post: {
                    tags: ['Validation'],
                    operationId: 'validateReadme',
                    summary: 'Validate a readme.txt against WordPress.org requirements.',
                    description: 'Runs every check from the WPReadme validator: required fields (plugin name, contributors, tags, stable tag, license, short description, description, changelog, file size), recommended fields (requires at least, tested up to, installation), and optional fields (requires PHP, FAQ, screenshots, donate link). Each failed or warned check includes a tip with the exact line to add.',
                    requestBody: {
                        required: true,
                        content: {
                            'application/json': {schema: {$ref: '#/components/schemas/ReadmeInput'}},
                            'text/plain': {schema: {type: 'string', description: 'Raw readme.txt contents.'}},
                        },
                    },
                    responses: {
                        '200': {
                            description: 'Validation report. score is the percentage of passed checks with warnings earning half credit.',
                            content: {'application/json': {schema: {$ref: '#/components/schemas/ValidateResponse'}}},
                        },
                        '400': {$ref: '#/components/responses/BadRequest'},
                        '413': {$ref: '#/components/responses/PayloadTooLarge'},
                        '415': {$ref: '#/components/responses/UnsupportedMediaType'},
                        '405': {$ref: '#/components/responses/MethodNotAllowed'},
                    },
                },
            },
        },
        components: {
            schemas: {
                ReadmeInput,
                ReadmeSection,
                FaqItem,
                ScreenshotItem,
                ReadmeData,
                ValidationCheck,
                ParseResponse: {
                    type: 'object',
                    required: ['data'],
                    properties: {data: {$ref: '#/components/schemas/ReadmeData'}},
                },
                ValidateResponse: {
                    type: 'object',
                    required: ['summary', 'checks'],
                    properties: {
                        summary: {
                            type: 'object',
                            required: ['score', 'passed', 'failed', 'warnings', 'total'],
                            properties: {
                                score: {type: 'integer', minimum: 0, maximum: 100, description: '0-100; warnings count as half a pass.'},
                                passed: {type: 'integer'},
                                failed: {type: 'integer', description: 'Checks with status "fail".'},
                                warnings: {type: 'integer', description: 'Checks with status "warn".'},
                                total: {type: 'integer'},
                            },
                        },
                        checks: {type: 'array', items: {$ref: '#/components/schemas/ValidationCheck'}},
                    },
                },
                ErrorEnvelope,
            },
            responses: {
                BadRequest: {
                    description: 'Malformed request body (invalid_json, missing_readme, or invalid_readme).',
                    content: {'application/json': {schema: {$ref: '#/components/schemas/ErrorEnvelope'}}},
                },
                PayloadTooLarge: {
                    description: 'Body exceeds the 1 MB limit (payload_too_large).',
                    content: {'application/json': {schema: {$ref: '#/components/schemas/ErrorEnvelope'}}},
                },
                UnsupportedMediaType: {
                    description: 'Content-Type is neither application/json nor text/plain (unsupported_media_type).',
                    content: {'application/json': {schema: {$ref: '#/components/schemas/ErrorEnvelope'}}},
                },
                MethodNotAllowed: {
                    description: 'Only POST is accepted on API endpoints (method_not_allowed).',
                    content: {'application/json': {schema: {$ref: '#/components/schemas/ErrorEnvelope'}}},
                },
            },
        },
    };
}
