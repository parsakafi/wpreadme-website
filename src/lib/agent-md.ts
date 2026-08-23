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

## Pages

- [About](/about)
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

## Supported readme.txt sections

- Header: plugin name, contributors, tags, requirements, license, short description
- Description: full plugin description with Markdown support
- Installation: setup instructions and requirements
- Frequently Asked Questions: parsed as expandable Q&A items
- Screenshots: captioned screenshot list
- Changelog: version history entries

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
