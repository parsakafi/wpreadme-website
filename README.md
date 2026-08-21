# WPReadme Preview

A free online tool to preview your WordPress plugin readme.txt file before publishing. Built with [Astro](https://astro.build/).

Paste or upload your readme.txt and see exactly how it will look on WordPress.org, with tabbed sections for Description, Installation, FAQ, Screenshots, and Changelog.

## Tech Stack

- **[Astro](https://astro.build/)**, static site generator
- **[TypeScript](https://www.typescriptlang.org/)**, type-safe JavaScript
- **[SCSS/Sass](https://sass-lang.com/)**, stylesheet authoring
- **[astro-icon](https://www.astroicon.dev/)**, SVG icon system
- **[astro-compressor](https://github.com/nicholasgillespie/astro-compressor)**, gzip, Brotli & Zstd compression
- **[@astrojs/sitemap](https://docs.astro.build/en/guides/integrations-guide/sitemap/)**, auto-generated sitemap

## Project Structure

```
├── public/
│   ├── css/                  # Compiled CSS
│   ├── scss/                 # SCSS source files
│   ├── images/               # Static images
│   └── fonts/                # Font files
├── readme-example/           # Example readme.txt files
├── src/
│   ├── components/           # Astro components (Header, Footer, etc.)
│   ├── icons/                # SVG icons
│   ├── layouts/              # Page layouts
│   ├── lib/
│   │   └── readme-parser.ts  # WordPress readme.txt parser & renderer
│   ├── pages/                # Route pages
│   │   ├── index.astro       # Home, split-pane editor + preview
│   │   ├── about.astro       # About page
│   │   └── donate.astro      # Donate page
│   └── consts.ts             # Global constants
├── scripts/
│   ├── generate-og.mjs       # Open Graph image generation
│   └── generate-icons.mjs    # Icon asset generation
└── astro.config.mjs
```

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [npm](https://www.npmjs.com/)

### Install Dependencies

```bash
npm install
```

### Development Server

```bash
npm run dev
```

The site will be available at [http://localhost:4321](http://localhost:4321).

### Build for Production

```bash
npm run build
```

Output is written to `dist/`.

### Preview Production Build

```bash
npm run preview
```

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start the Astro dev server |
| `npm run build` | Generate OG images and build the site |
| `npm run preview` | Preview the production build |
| `npm run check` | Run Astro type checking |
| `npm run watch-sass` | Watch and compile SCSS |
| `npm run icons` | Generate icon assets |

## How It Works

1. User pastes readme.txt content or uploads a file
2. The parser in `src/lib/readme-parser.ts` extracts headers, sections, FAQ items, and screenshots
3. Content is rendered with a markdown-lite to HTML converter
4. The preview panel displays a WordPress.org-style plugin page with tabs

## License

Project by [Parsa.ws](https://parsa.ws).
