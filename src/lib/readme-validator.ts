import {parseReadme, type ReadmeData} from './readme-parser';

/**
 * Server-side readme.txt validator for the public API.
 *
 * Mirrors the checks shown by the in-browser Validator panel (categories,
 * statuses, labels, and tips) so the API reports what the UI reports.
 */

export type CheckCategory = 'required' | 'recommended' | 'optional';
export type CheckStatus = 'pass' | 'fail' | 'warn' | 'info';

export interface ValidationCheck {
    id: string;
    category: CheckCategory;
    status: CheckStatus;
    label: string;
    detail: string | null;
    tip: string | null;
}

export interface ValidationResult {
    summary: {
        score: number;
        passed: number;
        failed: number;
        warnings: number;
        total: number;
    };
    checks: ValidationCheck[];
}

const DOC_URL = 'https://developer.wordpress.org/plugins/wordpress-org/how-your-readme-txt-works/';

function check(
    id: string,
    category: CheckCategory,
    status: CheckStatus,
    label: string,
    detail: string | null,
    tip: string | null,
): ValidationCheck {
    return {id, category, status, label, detail, tip};
}

export function validateReadme(raw: string): ValidationResult {
    const data: ReadmeData = parseReadme(raw);
    const headers = Object.fromEntries(
        Object.entries(data.headers).map(([k, v]) => [k.toLowerCase(), v]),
    );
    const sectionTitles = data.sections.map((s) => s.title.toLowerCase());
    const hasSection = (name: string) => sectionTitles.includes(name);
    const checks: ValidationCheck[] = [];

    // === REQUIRED ===

    checks.push(check(
        'plugin_name_header', 'required',
        data.name ? 'pass' : 'fail',
        'Plugin Name header',
        data.name ? null : 'Missing',
        data.name ? null : `Start your readme.txt with: === Plugin Name ===\nThis is the display name shown on WordPress.org. See ${DOC_URL}`,
    ));

    checks.push(check(
        'contributors', 'required',
        headers['contributors'] ? 'pass' : 'fail',
        'Contributors (WordPress.org usernames)',
        headers['contributors'] ? `Found: ${headers['contributors']}` : 'Missing',
        headers['contributors'] ? null : 'Add: Contributors: username1, username2\nUse only WordPress.org usernames (case-sensitive).',
    ));

    const tags = headers['tags'] ? headers['tags'].split(',').map((t) => t.trim()).filter(Boolean) : [];
    checks.push(check(
        'tags', 'required',
        tags.length === 0 ? 'fail' : tags.length <= 5 ? 'pass' : 'warn',
        'Tags (1-5 tags)',
        tags.length > 0
            ? `Found ${tags.length} tag${tags.length > 1 ? 's' : ''}: ${tags.join(', ')}${tags.length > 5 ? ', max 5 allowed' : ''}`
            : 'Missing',
        tags.length > 0 && tags.length <= 5 ? null : 'Add: Tags: e-commerce, payments, store\nUse 1-5 relevant, lowercase terms. Do not use competitor plugin names or brand-specific terms.',
    ));

    checks.push(check(
        'stable_tag', 'required',
        headers['stable tag'] ? 'pass' : 'fail',
        'Stable tag',
        headers['stable tag'] ? `Found: ${headers['stable tag']}` : 'Missing',
        headers['stable tag'] ? null : "Add: Stable tag: 1.2.3\nThis must match the Version in your main PHP file. Use SemVer (x.y.z). Never use 'trunk'.",
    ));

    checks.push(check(
        'license', 'required',
        headers['license'] ? 'pass' : 'fail',
        'License',
        headers['license'] ? `Found: ${headers['license']}` : 'Missing',
        headers['license'] ? null : 'Add: License: GPLv2 or later\nWordPress.org requires a GPL-compatible license. Also add: License URI: https://www.gnu.org/licenses/gpl-2.0.html',
    ));

    const descLen = data.shortDescription.length;
    checks.push(check(
        'short_description', 'required',
        descLen === 0 ? 'fail' : descLen <= 150 ? 'pass' : 'warn',
        'Short description (<150 characters)',
        descLen > 0 ? `${descLen} chars${descLen > 150 ? ', exceeds 150 char limit' : ''}` : 'Missing',
        descLen > 0 && descLen <= 150 ? null : 'Write a plain-text, one-line description right after the header metadata (before any == Section ==). Max 150 characters. No HTML or Markdown.',
    ));

    checks.push(check(
        'description_section', 'required',
        hasSection('description') ? 'pass' : 'fail',
        'Description section',
        hasSection('description') ? null : 'Missing',
        hasSection('description') ? null : 'Add: == Description ==\nExplain what your plugin does, its key features, and how it helps users. This is the main content on your plugin page.',
    ));

    checks.push(check(
        'changelog_section', 'required',
        hasSection('changelog') ? 'pass' : 'warn',
        'Changelog section',
        hasSection('changelog') ? null : 'Missing',
        hasSection('changelog') ? null : 'Add: == Changelog ==\nDocument what changed in each version. Keep only the latest release in the readme; move older entries to a separate changelog.txt file.',
    ));

    const sizeKb = Buffer.byteLength(raw, 'utf8') / 1024;
    checks.push(check(
        'file_size', 'required',
        sizeKb <= 10 ? 'pass' : 'fail',
        `File size (${sizeKb.toFixed(1)}KB / 10KB)`,
        sizeKb > 10 ? 'Exceeds 10KB limit' : null,
        sizeKb <= 10 ? null : 'Keep readme.txt under 10KB. Trim long changelogs (move old entries to changelog.txt) and keep descriptions concise.',
    ));

    // === RECOMMENDED ===

    checks.push(check(
        'requires_at_least', 'recommended',
        headers['requires at least'] ? 'pass' : 'warn',
        'Requires at least (WP version)',
        headers['requires at least'] ? `Found: ${headers['requires at least']}` : 'Not set',
        headers['requires at least'] ? null : 'Add: Requires at least: 6.0\nSince WP 5.8 this is parsed from your main PHP file header, but setting it here ensures the directory displays the correct requirement.',
    ));

    checks.push(check(
        'tested_up_to', 'recommended',
        headers['tested up to'] ? 'pass' : 'warn',
        'Tested up to (WP version)',
        headers['tested up to'] ? `Found: ${headers['tested up to']}` : 'Not set',
        headers['tested up to'] ? null : 'Add: Tested up to: 6.7\nUse major versions only (e.g., 6.7, not 6.7.2). Test against the latest WordPress release.',
    ));

    checks.push(check(
        'installation_section', 'recommended',
        hasSection('installation') ? 'pass' : 'warn',
        'Installation section',
        hasSection('installation') ? null : 'Not present',
        hasSection('installation') ? null : 'Add: == Installation ==\nProvide clear step-by-step install instructions.',
    ));

    // === OPTIONAL ===

    checks.push(check(
        'requires_php', 'optional',
        headers['requires php'] ? 'pass' : 'info',
        'Requires PHP version',
        headers['requires php'] ? `Found: ${headers['requires php']}` : 'Not set',
        headers['requires php'] ? null : 'Optional: Requires PHP: 7.4\nRequired only if your plugin needs a minimum PHP version.',
    ));

    checks.push(check(
        'faq_section', 'optional',
        hasSection('frequently asked questions') ? 'pass' : 'info',
        'FAQ section',
        hasSection('frequently asked questions') ? null : 'Not present',
        hasSection('frequently asked questions') ? null : 'Optional: == Frequently Asked Questions ==\nUse = Question? = sub-headings for each Q&A pair.',
    ));

    checks.push(check(
        'screenshots_section', 'optional',
        hasSection('screenshots') ? 'pass' : 'info',
        'Screenshots section',
        hasSection('screenshots') ? null : 'Not present',
        hasSection('screenshots') ? null : 'Optional: == Screenshots ==\nNumber each screenshot; images go in assets/ as screenshot-1.png etc.',
    ));

    checks.push(check(
        'donate_link', 'optional',
        headers['donate link'] ? 'pass' : 'info',
        'Donate link',
        headers['donate link'] ? `Found: ${headers['donate link']}` : 'Not set',
        headers['donate link'] ? null : "Optional: Donate link: https://your-site.com/donate\nAdds a 'Donate to this plugin' link in the sidebar.",
    ));

    const passed = checks.filter((c) => c.status === 'pass').length;
    const failed = checks.filter((c) => c.status === 'fail').length;
    const warnings = checks.filter((c) => c.status === 'warn').length;

    return {
        summary: {
            // Half credit for warnings, none for failures/informationals.
            score: Math.round(((passed + warnings * 0.5) / checks.length) * 100),
            passed,
            failed,
            warnings,
            total: checks.length,
        },
        checks,
    };
}
