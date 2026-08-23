import {test} from 'node:test';
import assert from 'node:assert/strict';
// Node 22 type stripping runs the TypeScript parser module directly.
import {parseReadme, isMainSection, customSections, MAIN_SECTION_TITLES} from '../src/lib/readme-parser.ts';

test('the five main section titles are recognized case-insensitively', () => {
    assert.deepEqual([...MAIN_SECTION_TITLES].sort(), [
        'changelog',
        'description',
        'frequently asked questions',
        'installation',
        'screenshots',
    ]);

    for (const title of ['Description', 'DESCRIPTION', ' installation ', 'Frequently Asked Questions']) {
        assert.ok(isMainSection(title), `${title} should be a main section`);
    }
});

test('custom sections are not main sections', () => {
    for (const title of ['External services', 'External Services', 'Credits', 'Privacy', 'Arbitrary section']) {
        assert.ok(!isMainSection(title), `${title} should be a custom section`);
    }
});

const README_WITH_CUSTOM = `=== Jetexir for WooCommerce ===
Contributors: parselearn
Stable tag: 1.0.1

A WooCommerce enhancement suite.

== Description ==

Main description content.

= Key Features =

* Sale badges

== External services ==

This plugin connects to external services only when enabled.

== Installation ==

1. Upload and activate.

== Screenshots ==

1. Dashboard tab

== Changelog ==

= 1.0.1 =
* Initial release`;

test('customSections() returns only non-main sections, in file order', () => {
    const data = parseReadme(README_WITH_CUSTOM);
    const custom = customSections(data);

    assert.deepEqual(custom.map((s) => s.title), ['External services']);
    assert.match(custom[0].content, /external services only when enabled/);
});

test('a readme with only main sections yields no custom sections', () => {
    const data = parseReadme(`=== Plain ===\n\nShort.\n\n== Description ==\n\nText.\n\n== Changelog ==\n\n= 1.0 =\n* Release`);
    assert.deepEqual(customSections(data), []);
});

test('main sections are still parsed as sections alongside custom ones', () => {
    const data = parseReadme(README_WITH_CUSTOM);
    assert.deepEqual(
        data.sections.map((s) => s.title),
        ['Description', 'External services', 'Installation', 'Screenshots', 'Changelog'],
    );
});
