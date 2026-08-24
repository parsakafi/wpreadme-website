import {before, after, test} from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const PORT = 4399;
const BASE = `http://127.0.0.1:${PORT}`;
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

let server;

async function req(pathname, headers = {}, init = {}) {
    const res = await fetch(`${BASE}${pathname}`, {headers, ...init});
    const text = await res.text();
    return {status: res.status, contentType: res.headers.get('content-type') ?? '', vary: res.headers.get('vary') ?? '', text};
}

function textLength(html) {
    // Rough "what an agent actually reads" measure: drop scripts/styles/tags.
    return html
        .replace(/<script[\s\S]*?<\/script>/gi, ' ')
        .replace(/<style[\s\S]*?<\/style>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .length;
}

function jsonLdBlocks(html) {
    return [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
        .map((m) => JSON.parse(m[1]));
}

function varyContains(vary, token) {
    return vary.split(',').some((v) => v.trim().toLowerCase() === token.toLowerCase());
}

before(async () => {
    // --force replaces any stale dev server holding Astro's lock file.
    server = spawn(process.execPath, ['./node_modules/astro/bin/astro.mjs', 'dev', '--force', '--host', '127.0.0.1', '--port', String(PORT)], {
        cwd: ROOT,
        env: {...process.env, ASTRO_TELEMETRY_DISABLED: '1'},
        stdio: ['ignore', 'ignore', 'pipe'],
    });
    server.stderr?.on('data', (d) => process.stderr.write(`[astro] ${d}`));

    const deadline = Date.now() + 90_000;
    while (Date.now() < deadline) {
        if (server.exitCode !== null) throw new Error(`dev server exited early with code ${server.exitCode}`);
        try {
            const res = await fetch(`${BASE}/`);
            if (res.ok) return;
        } catch {
            // not up yet
        }
        await new Promise((r) => setTimeout(r, 500));
    }
    throw new Error('dev server did not become ready in time');
});

after(() => {
    server?.kill();
});

// --- Fix 1: meaningful content without JavaScript -------------------------

test('homepage raw HTML has an H1 and 500+ chars of agent-readable text', async () => {
    const res = await req('/');
    assert.equal(res.status, 200);
    assert.match(res.contentType, /text\/html/);
    assert.match(res.text, /<h1[^>]*>/, 'homepage must contain an H1 tag');
    assert.ok(textLength(res.text) >= 500, `expected 500+ chars of text, got ${textLength(res.text)}`);
    assert.match(res.text, /readme\.txt/);
});

// --- Fix 3: markdown content negotiation (acceptmarkdown.com) -------------

test('Accept: text/markdown gets markdown with Vary: Accept', async () => {
    const res = await req('/', {'Accept': 'text/markdown'});
    assert.equal(res.status, 200);
    assert.match(res.contentType, /^text\/markdown/);
    assert.ok(varyContains(res.vary, 'Accept'), `Vary must include Accept, got "${res.vary}"`);
    assert.match(res.text, /^# WPReadme Preview/);
    assert.match(res.text, /## When to use this tool/);
});

test('browsers still get HTML', async () => {
    const browserAccept = 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8';
    const res = await req('/', {'Accept': browserAccept});
    assert.equal(res.status, 200);
    assert.match(res.contentType, /^text\/html/);
    assert.ok(varyContains(res.vary, 'Accept'));
});

test('no Accept header defaults to HTML', async () => {
    const res = await req('/', {});
    assert.equal(res.status, 200);
    assert.match(res.contentType, /^text\/html/);
});

test('q-values decide between variants', async () => {
    // HTML outranks markdown.
    const htmlWins = await req('/', {'Accept': 'text/html;q=0.9, text/markdown;q=0.5'});
    assert.match(htmlWins.contentType, /^text\/html/);
    // Equal preference: client order breaks the tie.
    const mdFirst = await req('/', {'Accept': 'text/markdown, text/html'});
    assert.match(mdFirst.contentType, /^text\/markdown/);
    // Wildcard fallback after explicit rejection of html.
    const wildcard = await req('/', {'Accept': 'text/html;q=0, */*;q=1'});
    assert.match(wildcard.contentType, /^text\/markdown/);
});

test('rejecting every produced type answers 406', async () => {
    const res = await req('/', {'Accept': 'text/markdown;q=0, text/html;q=0'});
    assert.equal(res.status, 406);
    assert.ok(varyContains(res.vary, 'Accept'));
});

test('markdown is also reachable at explicit /md/* URLs', async () => {
    const about = await req('/md/about');
    assert.equal(about.status, 200);
    assert.match(about.contentType, /^text\/markdown/);

    const missing = await req('/md/no-such-page');
    assert.equal(missing.status, 404);
    assert.match(missing.contentType, /^text\/markdown/);
});

test('file requests are never negotiated away', async () => {
    const res = await req('/css/style.min.css', {'Accept': 'text/markdown'});
    assert.ok(!res.contentType.startsWith('text/markdown'), `css must not be served as markdown, got ${res.contentType}`);
});

// --- Fix 2: agent-friendly 404s --------------------------------------------

test('HTML requests to unknown paths get a real 404 with recovery links', async () => {
    const res = await req('/this-path-does-not-exist');
    assert.equal(res.status, 404);
    assert.match(res.contentType, /^text\/html/);
    assert.match(res.text, /llms\.txt/, '404 body should point agents at llms.txt');
    assert.match(res.text, /sitemap\.xml/, '404 body should point agents at the sitemap');
    assert.match(res.text, /href="\/about"/);
});

test('markdown requests to unknown paths get a markdown 404 with next steps', async () => {
    const res = await req('/this-path-does-not-exist', {'Accept': 'text/markdown'});
    assert.equal(res.status, 404);
    assert.match(res.contentType, /^text\/markdown/);
    assert.match(res.text, /# 404 Not Found/);
    assert.match(res.text, /\[llms\.txt\]\(\/llms\.txt\)/);
    assert.match(res.text, /\[Sitemap\]\(\/sitemap\.xml\)/);
});

// --- Fix 5 & 7: JSON-LD structured data ------------------------------------

test('homepage exposes SoftwareApplication and Organization JSON-LD', async () => {
    const res = await req('/');
    const blocks = jsonLdBlocks(res.text);
    assert.ok(blocks.length > 0, 'expected JSON-LD on the homepage');

    const flat = blocks.flatMap((b) => (Array.isArray(b['@graph']) ? b['@graph'] : [b]));
    const app = flat.find((n) => n['@type'] === 'SoftwareApplication');
    assert.ok(app, 'SoftwareApplication node missing');
    assert.equal(app.name, 'WPReadme Preview');
    assert.equal(app.url, 'https://wpreadme.ir/');
    assert.equal(app.offers.price, '0');

    const org = flat.find((n) => n['@type'] === 'Organization');
    assert.ok(org, 'Organization node missing');
    assert.equal(org.contactPoint.email, 'parsadeng@gmail.com');
    assert.ok(org.contactPoint.contactType, 'contactPoint needs a contactType');
    assert.equal(org.address['@type'], 'PostalAddress');
    assert.ok(org.address.addressCountry, 'PostalAddress needs addressCountry');
    assert.ok(Array.isArray(org.sameAs) && org.sameAs.includes('https://parsa.ws/portfolio/wpreadme'));
});

test('every page carries the Organization identity anchor', async () => {
    for (const page of ['/about', '/contact', '/privacy', '/donate']) {
        const res = await req(page);
        assert.equal(res.status, 200, `${page} should resolve`);
        const org = jsonLdBlocks(res.text).find((n) => n['@type'] === 'Organization');
        assert.ok(org, `Organization JSON-LD missing on ${page}`);
        assert.ok(org.contactPoint?.email);
    }
});

// --- Fix 8: trust anchor pages ----------------------------------------------

test('trust pages render real content (500+ chars)', async () => {
    for (const page of ['/about', '/contact', '/privacy']) {
        const res = await req(page);
        assert.equal(res.status, 200);
        assert.match(res.text, /<h1[^>]*>/, `${page} needs an H1`);
        assert.ok(textLength(res.text) >= 500, `${page} should have 500+ chars of text`);
    }
});

test('about page lists the API among its features', async () => {
    const res = await req('/about');
    assert.match(res.text, /JSON API/);
    assert.match(res.text, /\/developers/);
    assert.match(res.text, /openapi\.json/);

    const md = await req('/md/about');
    assert.match(md.text, /JSON API/);
    assert.match(md.text, /POST \/api\/validate/);
});

test('donate CTA renders on about, developers, and contact', async () => {
    for (const page of ['/about', '/developers', '/contact']) {
        const res = await req(page);
        assert.match(res.text, /href="\/donate"/, `${page} should link to /donate`);
        assert.match(res.text, /Support the Project/, `${page} should show the CTA button label`);
        assert.match(res.text, /cta-button/, `${page} should render the CTA component`);
        // Theme-driven accent, no hardcoded button colors in the page CSS
        assert.match(res.text, /accent-donate|cta-button/, `${page} CTA present`);
    }
});

// --- Machine-readable files --------------------------------------------------

test('llms.txt publishes when-to-use agent instructions', async () => {
    const res = await req('/llms.txt');
    assert.equal(res.status, 200);
    assert.match(res.contentType, /^text\/plain/);
    assert.match(res.text, /^# WPReadme Preview/m);
    assert.match(res.text, /## When to use this tool/);
    assert.match(res.text, /## When NOT to use this tool/);
    assert.match(res.text, /## How an agent should use it/);
});

test('sitemap.xml lists all public pages', async () => {
    const res = await req('/sitemap.xml');
    assert.equal(res.status, 200);
    assert.match(res.contentType, /xml/);
    for (const route of ['/', '/about', '/contact', '/donate', '/privacy']) {
        assert.ok(res.text.includes(`https://wpreadme.ir${route}`), `sitemap missing ${route}`);
    }
});

test('robots.txt references sitemap and llms.txt', async () => {
    const res = await req('/robots.txt');
    assert.equal(res.status, 200);
    assert.match(res.text, /Sitemap: https:\/\/wpreadme\.ir\/sitemap\.xml/);
    assert.match(res.text, /llms\.txt/);
});

// --- Public API: OpenAPI spec + JSON endpoints ------------------------------

const GOOD_README = `=== My Awesome Plugin ===
Contributors: developername
Donate link: https://example.com/donate
Tags: woocommerce, ecommerce
Requires at least: 6.0
Tested up to: 6.6
Requires PHP: 7.4
Stable tag: 1.2.0
License: GPLv2 or later

A lightweight WooCommerce plugin.

== Description ==

It makes stores better.

== Installation ==

1. Upload and activate.

== Frequently Asked Questions ==

= Does it work everywhere? =

Yes.

== Screenshots ==

1. The settings screen

== Changelog ==

= 1.2.0 =
* Initial release`;

async function post(pathname, body, contentType = 'application/json') {
    return req(pathname, {'Content-Type': contentType}, {method: 'POST', body});
}

function assertErrorEnvelope(body, status, code) {
    const parsed = JSON.parse(body);
    assert.equal(parsed.error.code, code, `expected error code ${code}`);
    assert.ok(parsed.error.message, 'error envelope needs a message');
}

test('openapi.json publishes a complete OpenAPI 3.1 spec', async () => {
    for (const path of ['/openapi.json', '/api/openapi.json']) {
        const res = await req(path);
        assert.equal(res.status, 200, path);
        assert.match(res.contentType, /^application\/json/);
        const spec = JSON.parse(res.text);

        assert.equal(spec.openapi, '3.1.0');
        assert.match(spec.info.title, /WPReadme/);
        assert.equal(spec.servers[0].url, 'https://wpreadme.ir');

        // Every operation needs a unique operationId, summary, and description.
        const opIds = new Set();
        for (const [p, item] of Object.entries(spec.paths)) {
            for (const [method, op] of Object.entries(item)) {
                assert.ok(op.operationId, `${method} ${p} missing operationId`);
                assert.ok(!opIds.has(op.operationId), `duplicate operationId ${op.operationId}`);
                opIds.add(op.operationId);
                assert.ok(op.summary && op.description.length > 20, `${op.operationId} lacks docs`);
                assert.ok(op.responses['200'], `${op.operationId} lacks a 200 response schema`);
            }
        }
        assert.deepEqual([...opIds].sort(), ['parseReadme', 'validateReadme']);

        const schemas = spec.components.schemas;
        for (const name of ['ReadmeInput', 'ParseResponse', 'ValidateResponse', 'ValidationCheck', 'ErrorEnvelope']) {
            assert.ok(schemas[name], `missing component schema ${name}`);
        }
        // Typed request field + typed check statuses (function-calling friendly).
        assert.equal(schemas.ReadmeInput.required[0], 'readme');
        assert.deepEqual(schemas.ValidationCheck.properties.status.enum.sort(), ['fail', 'info', 'pass', 'warn']);
        assert.deepEqual(schemas.ValidationCheck.properties.id.enum.includes('changelog_section'), true);
    }
});

test('POST /api/parse returns structured readme data', async () => {
    const res = await post('/api/parse', JSON.stringify({readme: GOOD_README}));
    assert.equal(res.status, 200);
    assert.match(res.contentType, /^application\/json/);
    const body = JSON.parse(res.text);
    assert.equal(body.data.name, 'My Awesome Plugin');
    // Header keys are returned exactly as written in the file.
    assert.match(body.data.headers['Stable tag'], /^1\.2\.0$/);
    assert.ok(body.data.sections.some((s) => s.title === 'Changelog'));
    assert.equal(body.data.faq.length, 1);
    assert.deepEqual(body.data.screenshots[0], {number: '1', caption: 'The settings screen'});
});

test('POST /api/parse accepts raw text/plain bodies', async () => {
    const res = await post('/api/parse', GOOD_README, 'text/plain');
    assert.equal(res.status, 200);
    assert.equal(JSON.parse(res.text).data.name, 'My Awesome Plugin');
});

test('POST /api/validate scores a compliant readme highly', async () => {
    const res = await post('/api/validate', JSON.stringify({readme: GOOD_README}));
    assert.equal(res.status, 200);
    const body = JSON.parse(res.text);
    assert.equal(body.summary.failed, 0, JSON.stringify(body.checks));
    assert.equal(body.summary.warnings, 0, JSON.stringify(body.checks));
    assert.ok(body.summary.score >= 90, `score too low: ${body.summary.score}`);
    assert.equal(body.summary.total, 16);
    const byId = Object.fromEntries(body.checks.map((c) => [c.id, c]));
    assert.equal(byId.plugin_name_header.status, 'pass');
    assert.equal(byId.stable_tag.detail, 'Found: 1.2.0');
    assert.equal(byId.file_size.category, 'required');
    assert.ok(body.checks.every((c) => typeof c.tip === 'string' || c.tip === null));
});

test('POST /api/validate reports failures with actionable tips', async () => {
    const res = await post('/api/validate', JSON.stringify({readme: '=== Bare ===\n\nJust a name.'}));
    assert.equal(res.status, 200);
    const body = JSON.parse(res.text);
    const byId = Object.fromEntries(body.checks.map((c) => [c.id, c]));
    assert.equal(byId.changelog_section.status, 'warn');
    assert.match(byId.changelog_section.tip, /== Changelog ==/);
    assert.equal(byId.contributors.status, 'fail');
    assert.ok(body.summary.failed > 0 && body.summary.total >= 16);
});

test('API errors are structured JSON with codes and hints', async () => {
    const invalid = await post('/api/parse', '{not json');
    assert.equal(invalid.status, 400);
    assertErrorEnvelope(invalid.text, 400, 'invalid_json');

    const missing = await post('/api/validate', '{}');
    assert.equal(missing.status, 400);
    assertErrorEnvelope(missing.text, 400, 'missing_readme');

    const notString = await post('/api/validate', '{"readme": 42}');
    assert.equal(notString.status, 400);
    assertErrorEnvelope(notString.text, 400, 'invalid_readme');

    const empty = await post('/api/parse', '', 'text/plain');
    assert.equal(empty.status, 400);
    assertErrorEnvelope(empty.text, 400, 'missing_readme');

    const badType = await post('/api/validate', '<x/>', 'text/xml');
    assert.equal(badType.status, 415);
    assertErrorEnvelope(badType.text, 415, 'unsupported_media_type');

    const wrongMethod = await req('/api/validate');
    assert.equal(wrongMethod.status, 405);
    assertErrorEnvelope(wrongMethod.text, 405, 'method_not_allowed');

    const unknown = await req('/api/no-such-endpoint');
    assert.equal(unknown.status, 404);
    assertErrorEnvelope(unknown.text, 404, 'unknown_endpoint');

    // API paths never fall back to HTML or markdown error pages.
    for (const err of [invalid, missing, notString, empty, badType, wrongMethod, unknown]) {
        assert.match(err.contentType, /^application\/json/, `expected JSON, got ${err.contentType}`);
    }
});

test('API paths ignore Accept: text/markdown negotiation', async () => {
    const res = await req('/api/no-such-endpoint', {'Accept': 'text/markdown'});
    assert.equal(res.status, 404);
    assert.match(res.contentType, /^application\/json/);

    const ok = await post('/api/validate', '{"readme": "=== X ==="}');
    assert.equal(ok.status, 200);
    assert.match(ok.contentType, /^application\/json/);
});

// --- Developer portal --------------------------------------------------------

test('/developers portal documents the API and links the spec', async () => {
    const res = await req('/developers');
    assert.equal(res.status, 200);
    assert.match(res.contentType, /^text\/html/);
    assert.match(res.text, /<h1[^>]*>/);
    assert.ok(textLength(res.text) >= 500);
    assert.match(res.text, /openapi\.json/);
    assert.match(res.text, /\/api\/validate/);
    assert.match(res.text, /missing_readme/);
});

test('/developers ships PHP and JS samples with copyable code blocks', async () => {
    const res = await req('/developers');
    // PHP + JavaScript code samples
    assert.match(res.text, /curl_init/, 'PHP sample missing');
    assert.match(res.text, /fetch\(/, 'JavaScript sample missing');
    assert.match(res.text, />PHP</);
    assert.match(res.text, />JavaScript</);
    // Every code sample carries a copy button wired to the shared handler
    const buttons = res.text.match(/data-code-copy/g) ?? [];
    assert.ok(buttons.length >= 4, `expected >= 4 copy buttons, found ${buttons.length}`);
    assert.match(res.text, /code-sample/);
});

test('the API is discoverable from the homepage', async () => {
    const home = await req('/');
    assert.match(home.text, /href="\/developers"/);
    assert.match(home.text, /\/openapi\.json/);
});

test('/developers participates in markdown negotiation', async () => {
    const md = await req('/developers', {'Accept': 'text/markdown'});
    assert.match(md.contentType, /^text\/markdown/);
    assert.match(md.text, /operationId validateReadme/);

    const twin = await req('/md/developers');
    assert.equal(twin.status, 200);
    assert.match(twin.contentType, /^text\/markdown/);
});

test('llms.txt documents API usage for agents', async () => {
    const res = await req('/llms.txt');
    assert.match(res.text, /## API/);
    assert.match(res.text, /api\/validate/);
    assert.match(res.text, /openapi\.json/);
    assert.match(res.text, /operationIds \(parseReadme, validateReadme\)/);
});

test('sitemap.xml includes the developer portal', async () => {
    const res = await req('/sitemap.xml');
    assert.ok(res.text.includes('https://wpreadme.ir/developers'));
});
