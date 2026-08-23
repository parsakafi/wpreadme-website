/**
 * WordPress readme.txt parser.
 *
 * Parses the standard WordPress plugin readme.txt format and returns
 * structured data that can be rendered to look like a WordPress.org
 * plugin page.
 *
 * Format reference:
 * https://developer.wordpress.org/plugins/wordpress-org/how-your-readme-txt-works/
 */

export interface ReadmeData {
  /** Plugin name from the === Plugin Name === header */
  name: string;
  /** Plain-text short description (first paragraph after header) */
  shortDescription: string;
  /** Header metadata fields (Contributors, Tags, Requires at least, etc.) */
  headers: Record<string, string>;
  /** Parsed sections keyed by heading (Description, Installation, FAQ, etc.) */
  sections: ReadmeSection[];
  /** Structured FAQ items extracted from the FAQ section */
  faq: FaqItem[];
  /** Screenshot entries */
  screenshots: ScreenshotItem[];
}

export interface ReadmeSection {
  title: string;
  content: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface ScreenshotItem {
  number: string;
  caption: string;
}

/**
 * The five sections WordPress.org renders in dedicated places. Every other
 * section is a "custom section" and WordPress.org appends it to the end of
 * the Description tab instead of giving it its own block or tab.
 *
 * https://developer.wordpress.org/plugins/wordpress-org/how-your-readme-txt-works/#custom-sections
 */
export const MAIN_SECTION_TITLES = [
  'description',
  'installation',
  'frequently asked questions',
  'screenshots',
  'changelog',
] as const;

export function isMainSection(title: string): boolean {
  return (MAIN_SECTION_TITLES as readonly string[]).includes(title.trim().toLowerCase());
}

/** Sections that WordPress.org would render inside the Description tab. */
export function customSections(data: ReadmeData): ReadmeSection[] {
  return data.sections.filter((s) => !isMainSection(s.title));
}

/**
 * Parse a readme.txt string into structured data.
 */
export function parseReadme(raw: string): ReadmeData {
  // Normalize line endings
  const text = raw.replace(/\r\n?/g, "\n");
  const lines = text.split("\n");

  const headers: Record<string, string> = {};
  let name = "";
  let shortDescription = "";
  let headerEndLine = 0;

  // --- Parse header block (lines before first == Section ==) ---
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // First === heading is the plugin name
    if (line.startsWith("=== ") && line.endsWith(" ===")) {
      name = line.slice(4, -4).trim();
      continue;
    }

    // Stop header parsing at first == Section ==
    if (line.startsWith("== ") && line.endsWith(" ==")) {
      headerEndLine = i;
      break;
    }

    // Key: Value pairs
    const colonIdx = line.indexOf(":");
    if (colonIdx > 0 && colonIdx < 80) {
      const key = line.slice(0, colonIdx).trim();
      const value = line.slice(colonIdx + 1).trim();
      if (key && value) {
        headers[key] = value;
      }
    }
  }

  // Short description: text between header metadata and first == section ==
  {
    const descLines: string[] = [];
    let pastName = false;
    let inHeaders = true;
    for (let i = 0; i < headerEndLine; i++) {
      const line = lines[i].trim();
      if (line.startsWith("=== ") && line.endsWith(" ===")) {
        pastName = true;
        continue;
      }
      // Skip header metadata lines (Key: Value format)
      if (inHeaders) {
        const ci = line.indexOf(":");
        if (ci > 0 && ci < 40 && line.slice(0, ci).trim().length > 0) {
          continue;
        }
        if (line.length > 0) inHeaders = false;
      }
      if (!inHeaders && line.length > 0) {
        descLines.push(line);
      }
    }
    shortDescription = descLines.join(" ").trim();
  }

  // --- Parse sections ---
  const sections: ReadmeSection[] = [];
  let currentSection: ReadmeSection | null = null;

  for (let i = headerEndLine; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // == Section Title ==  or  = Sub-section =
    if (/^== .+ ==$/.test(trimmed)) {
      if (currentSection) sections.push(currentSection);
      currentSection = {
        title: trimmed.slice(3, -3).trim(),
        content: "",
      };
      continue;
    }

    if (currentSection) {
      currentSection.content += line + "\n";
    }
  }
  if (currentSection) sections.push(currentSection);

  // --- Parse FAQ ---
  const faq: FaqItem[] = [];
  const faqSection = sections.find(
    (s) => s.title.toLowerCase() === "frequently asked questions"
  );
  if (faqSection) {
    const faqLines = faqSection.content.split("\n");
    let q = "";
    let a = "";
    for (const line of faqLines) {
      const trimmed = line.trim();
      // = Question =  or  = Question? =
      if (/^= .+ =$/.test(trimmed)) {
        if (q && a) {
          faq.push({ question: q.replace(/\?$/, ""), answer: a.trim() });
        }
        q = trimmed.slice(2, -2).trim();
        a = "";
      } else if (q) {
        a += line + "\n";
      }
    }
    if (q && a) {
      faq.push({ question: q.replace(/\?$/, ""), answer: a.trim() });
    }
  }

  // --- Parse Screenshots ---
  const screenshots: ScreenshotItem[] = [];
  const ssSection = sections.find((s) => s.title.toLowerCase() === "screenshots");
  if (ssSection) {
    const ssLines = ssSection.content.split("\n");
    for (const line of ssLines) {
      const match = line.trim().match(/^(\d+)\.\s*(.*)$/);
      if (match) {
        screenshots.push({ number: match[1], caption: match[2].trim() });
      }
    }
  }

  return { name, shortDescription, headers, sections, faq, screenshots };
}

// ---------------------------------------------------------------------------
// Markdown-lite → HTML conversion for readme content
// ---------------------------------------------------------------------------

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function inlineFormat(text: string): string {
  // Links: [text](url)
  let s = text.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener">$1</a>'
  );
  // Bold: **text**
  s = s.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  // Inline code
  s = s.replace(/`([^`]+)`/g, "<code>$1</code>");
  return s;
}

export function renderContent(raw: string): string {
  const text = raw.replace(/\r\n?/g, "\n");
  const lines = text.split("\n");
  const html: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Empty line → paragraph break
    if (trimmed === "") {
      i++;
      continue;
    }

    // Sub-section heading: = Title =
    if (/^= .+ =$/.test(trimmed)) {
      html.push(
        `<h3>${inlineFormat(escapeHtml(trimmed.slice(2, -2).trim()))}</h3>`
      );
      i++;
      continue;
    }

    // ### Markdown heading
    if (/^#{1,6}\s/.test(trimmed)) {
      const level = trimmed.match(/^(#{1,6})/)?.[1].length ?? 2;
      const content = trimmed.replace(/^#{1,6}\s+/, "");
      html.push(`<h${level}>${inlineFormat(escapeHtml(content))}</h${level}>`);
      i++;
      continue;
    }

    // Horizontal rule: ---  or  ***
    if (/^(-{3,}|\*{3,})$/.test(trimmed)) {
      html.push("<hr>");
      i++;
      continue;
    }

    // Unordered list
    if (/^[\-\*\+]\s/.test(trimmed)) {
      const listLines: string[] = [];
      while (i < lines.length && /^[\-\*\+]\s/.test(lines[i].trim())) {
        const item = lines[i].trim().replace(/^[\-\*\+]\s+/, "");
        listLines.push(`<li>${inlineFormat(escapeHtml(item))}</li>`);
        i++;
      }
      html.push(`<ul>${listLines.join("")}</ul>`);
      continue;
    }

    // Ordered list
    if (/^\d+\.\s/.test(trimmed)) {
      const listLines: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
        const item = lines[i].trim().replace(/^\d+\.\s+/, "");
        listLines.push(`<li>${inlineFormat(escapeHtml(item))}</li>`);
        i++;
      }
      html.push(`<ol>${listLines.join("")}</ol>`);
      continue;
    }

    // Code block: <code> ... </code>
    if (trimmed.toLowerCase() === "<code>") {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().toLowerCase().startsWith("</code>")) {
        codeLines.push(escapeHtml(lines[i]));
        i++;
      }
      html.push(`<pre><code>${codeLines.join("\n")}</code></pre>`);
      i++; // skip closing tag
      continue;
    }

    // Blockquote: >
    if (trimmed.startsWith("> ")) {
      const bqLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("> ")) {
        bqLines.push(lines[i].trim().slice(2));
        i++;
      }
      html.push(
        `<blockquote><p>${inlineFormat(escapeHtml(bqLines.join("\n")))}</p></blockquote>`
      );
      continue;
    }

    // Regular paragraph: collect consecutive non-empty, non-special lines
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !lines[i].trim().startsWith("= ") &&
      !lines[i].trim().startsWith("== ") &&
      !lines[i].trim().startsWith("#") &&
      !lines[i].trim().startsWith("> ") &&
      !/^(−{3,}|\*{3,})$/.test(lines[i].trim()) &&
      !/^[\-\*\+]\s/.test(lines[i].trim()) &&
      !/^\d+\.\s/.test(lines[i].trim()) &&
      !lines[i].trim().toLowerCase().startsWith("<code>")
    ) {
      paraLines.push(lines[i].trim());
      i++;
    }
    if (paraLines.length) {
      html.push(
        `<p>${inlineFormat(escapeHtml(paraLines.join(" ")))}</p>`
      );
    }
  }

  return html.join("\n");
}
