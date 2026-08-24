export const SITE_NAME = 'WPReadme Preview';
export const SITE_URL = 'https://wpreadme.ir';
export const AUTHOR_NAME = 'Parsa Kafi';
export const AUTHOR_URL = 'https://parsa.ws';
export const CONTACT_EMAIL = 'parsadeng@gmail.com';

/**
 * Markdown twins of the HTML pages, served to agents that send
 * `Accept: text/markdown` (see src/middleware.ts and src/pages/md/[...slug].ts).
 */
export const AGENT_MD: Record<string, string> = {
    '/': `# WPReadme Preview

> A free online tool that renders a WordPress plugin readme.txt file exactly like it will appear on WordPress.org. Paste or upload readme.txt and preview the plugin directory layout before publishing.

WPReadme Preview is a web tool for WordPress plugin developers at ${SITE_URL}. It parses the standard WordPress readme.txt format (headers, description, installation, FAQ, screenshots, changelog) and renders a faithful preview of the official plugin directory layout, so formatting mistakes are caught before a plugin goes live.

## When to use this tool

- Before submitting or updating a plugin on WordPress.org, to verify the readme renders correctly.
- To validate a readme.txt against WordPress.org requirements (required, recommended, and optional checks).
- To learn the expected readme.txt structure by loading example files.
- To edit an existing readme.txt and download the corrected version.

## When not to use it

- For plugin code review, translation, or asset (banner/icon) uploads; WPReadme Preview only handles readme.txt content.
- As an official WordPress.org service; it is an independent tool that follows the documented readme standard.

## How to use it

1. Open ${SITE_URL}
2. Paste readme.txt content into the editor, or use Upload to load a readme.txt file.
3. Watch the live preview update in real time and open the Validator panel for categorized checks with fix tips.
4. Download the finished readme.txt.

## Features

- Live preview matching the WordPress.org plugin directory layout
- Support for headers, description with Markdown, installation, FAQ, screenshots, and changelog sections
- Readme validator with Required / Recommended / Optional checks, progress score, and per-check tips linking to official docs
- Upload and download of readme.txt files
- Pre-built example readme files
- Free, no registration, works on desktop and mobile

## API

The validator is available as a free JSON API, no key required. Send POST requests with header Content-Type: application/json and body {"readme": "<full readme.txt contents>"}:

- POST https://wpreadme.ir/api/parse , structured JSON of the file
- POST https://wpreadme.ir/api/validate , checks against WordPress.org requirements with a 0-100 score

Example:

    curl -s https://wpreadme.ir/api/validate -H "Content-Type: application/json" -d '{"readme": "=== My Plugin ==="}'

Errors return {"error": {"code", "message", "hint"}} as application/json. Full OpenAPI 3.1 spec: https://wpreadme.ir/openapi.json

## Pages

- [About](/about)
- [API & Developers](/developers)
- [Contact](/contact)
- [Donate](/donate)
- [Privacy](/privacy)

Developed by [${AUTHOR_NAME}](${AUTHOR_URL}).`,
    '/about': `# About WPReadme Preview

A free online tool to preview your WordPress plugin readme.txt file before publishing it to the plugin directory. See exactly how it will look on WordPress.org.

## What is WPReadme Preview?

WPReadme Preview lets you paste or upload your WordPress plugin readme.txt file and see exactly how it will look on WordPress.org before you publish. It parses the standard WordPress readme.txt format, including headers, description, installation, FAQ, screenshots, and changelog, and renders a faithful preview that matches the official plugin directory layout.

## Why use it?

The WordPress plugin directory uses a specific readme.txt format. Formatting mistakes, such as broken links, missing sections, or malformed headers, can make your plugin listing look unprofessional or cause rejection during review. With WPReadme Preview you can catch these issues before they go live.

## Features

- **Live Preview**: paste or type readme.txt content and watch the preview update in real time.
- **Upload & Download**: upload an existing readme.txt file or download the edited version after making changes.
- **Example Files**: load pre-built example readme.txt files to see how different plugins are formatted.
- **Readme Validator**: auto-validates against WordPress.org requirements with a progress bar and categorized tips for Required, Recommended, and Optional checks.
- **WordPress.org Layout**: preview matches the official plugin directory layout with tabs for Details, Reviews, Installation, and Development.
- **JSON API**: parse and validate readme.txt programmatically via POST /api/parse and POST /api/validate; free, no API key required, documented by an OpenAPI spec at /openapi.json.

## Supported readme.txt sections

- Header: plugin name, contributors, tags, requirements, license, short description
- Description: full plugin description with Markdown support
- Installation: setup instructions and requirements
- Frequently Asked Questions: parsed as expandable Q&A items
- Screenshots: captioned screenshot list
- Changelog: version history entries

Custom sections, such as an External services section, are rendered inside the Description tab after the description content, exactly like WordPress.org does.

## Validator checks

- Required: Plugin Name, Contributors, Tags, Stable Tag, License, Short Description, Description, Changelog, File Size
- Recommended: Requires at least, Tested up to, Installation section
- Optional: Requires PHP, FAQ section, Screenshots, Donate link

Each failed check includes a tip with the exact line to add and a link to the relevant WordPress.org documentation.

The tool follows the official WordPress readme.txt standard as documented at developer.wordpress.org. It is built with JavaScript and Astro, is fully responsive, and is free to use with no registration required.

Developed by [${AUTHOR_NAME}](${AUTHOR_URL}).`,
    '/donate': `# Support WPReadme Preview

WPReadme Preview is free to use. If it has helped you, consider supporting development with a cryptocurrency donation.

## Crypto addresses

- Bitcoin (BTC): bc1qrts24tj0gemzkvewapcguvqdclttyr8amdp5xx
- Ethereum (ETH): 0xCFdECBB34CF6226502c25f58378bd606133D6320
- Solana (SOL): DDYFM8Ch7WmRfAGSM1AujTNpzmEtKo6YNS3eRsDQoUvL
- BNB Smart Chain (BSC): 0xCFdECBB34CF6226502c25f58378bd606133D6320
- Tron (TRX): TFQvPRHK7pnxckRieLMwvDAkd1w42W12kB
- Dogecoin (DOGE): DAvJTqhq9a7uRmD1PTsueg8v9Nu5nZWC8Q
- XRP: raN8etN1j8cmebepXmonboXppnwBy4seAW

Every contribution helps maintain and improve the tool. Thank you!

Developed by [${AUTHOR_NAME}](${AUTHOR_URL}).`,
    '/developers': `# WPReadme Preview API & Developers

Free JSON API for parsing and validating WordPress plugin readme.txt files, the same engine behind the in-browser validator at ${SITE_URL}. No API key and no registration required.

## Endpoints

Both endpoints accept POST only, with header Content-Type: application/json and body {"readme": "<full readme.txt contents>"}, or a raw text/plain body.

- POST /api/parse , operationId parseReadme. Returns the plugin name, header fields, sections, FAQ items, and screenshots extracted from the file.
- POST /api/validate , operationId validateReadme. Runs every WordPress.org requirement check (required: plugin name, contributors, tags, stable tag, license, short description, description, changelog, file size; recommended: requires at least, tested up to, installation; optional: requires PHP, FAQ, screenshots, donate link) and returns a 0-100 score plus one check object per rule with a stable id, category, status (pass/fail/warn/info), detail, and a tip with the exact line to add.

Example:

    curl -s ${SITE_URL}/api/validate -H "Content-Type: application/json" -d '{"readme": "=== My Plugin ==="}'

## Errors

All errors are application/json with a machine-readable envelope: {"error": {"code": "...", "message": "...", "hint": "..."}}. Codes include invalid_json (400), missing_readme (400), invalid_readme (400), unknown_endpoint (404), method_not_allowed (405), payload_too_large (413), unsupported_media_type (415).

## Specification and limits

- OpenAPI 3.1 spec with typed schemas and unique operationIds: ${SITE_URL}/openapi.json
- Maximum body size 1 MB (WordPress.org caps readme.txt at 10 KB)
- No rate limits enforced currently

Human-readable documentation: [${SITE_URL}/developers](${SITE_URL}/developers).`,
    '/contact': `# Contact

Questions, bug reports, and feedback about WPReadme Preview are welcome. The fastest way to reach the developer is email or Telegram; most messages get a reply within one or two business days.

## Channels

- Email: ${CONTACT_EMAIL}
- Telegram: https://t.me/parsakafi
- LinkedIn: https://www.linkedin.com/in/parsakafi
- GitHub: https://github.com/parsakafi
- X: https://x.com/parsakafi

For bugs in open-source projects, opening a GitHub issue on the project repository is usually quickest since the discussion stays public and helps other users. For privacy questions or data removal requests, use the same channels and mention privacy in your message.

WPReadme Preview is developed by [${AUTHOR_NAME}](${AUTHOR_URL}), a software engineer based in Iran.`,
    '/privacy': `# Privacy Policy

WPReadme Preview is designed to respect your privacy. This policy explains what happens to data when you use ${SITE_URL}, last updated August 2026.

## Readme content stays in your browser

The readme.txt text you paste or upload is processed entirely in your browser with JavaScript. It is never sent to, stored on, or logged by our servers. Closing the tab discards it.

## Local storage

We store a single preference key (your light/dark theme choice) in your browser's local storage. It never leaves your device and you can clear it any time through your browser settings.

## Analytics

We use Google Tag Manager to collect anonymous usage statistics such as page views and approximate location. These analytics may set cookies. You can block them with any ad blocker or browser setting without losing functionality.

## No accounts, no tracking data sales

There is no registration, no login, and we never sell or share personal data because we do not collect it.

## Third-party pages

This site links to third-party websites such as WordPress.org documentation. We are not responsible for their privacy practices.

## Donations

Donations are handled on public blockchain networks. Transactions are pseudonymous and publicly visible on the respective ledgers; we cannot link them to your identity unless you tell us.

## Changes and contact

Material changes to this policy will be published on this page. For privacy questions or data removal requests, contact ${CONTACT_EMAIL} or reach the developer via the channels on the [contact page](/contact).`,
};
