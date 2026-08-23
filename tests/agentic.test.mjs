import {before, after, test} from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import path from 'node:path';

const PORT = 4399;
const BASE = `http://127.0.0.1:${PORT}`;
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

let server;

async function req(pathname, headers = {}) {
    const res = await fetch(`${BASE}${pathname}`, {headers});
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
    server = spawn(process.execPath, ['./node_modules/astro/bin/astro.mjs', 'dev', '--host', '127.0.0.1', '--port', String(PORT)], {
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
