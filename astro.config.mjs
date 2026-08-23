import {defineConfig} from 'astro/config';
import vercel from '@astrojs/vercel';
import icon from "astro-icon";
import compressor from "astro-compressor";

// https://astro.build/config
export default defineConfig({
    site: 'https://wpreadme.ir', prefetch: {
        defaultStrategy: 'viewport'
    }, integrations: [icon(), compressor({
        gzip: true, brotli: true
    })], devToolbar: {
        enabled: false
    }, server: {
        watch: {
            // Poll for file changes, native watching on this Windows setup
            // can miss rapid edits, leaving stale CSS in the dev server.
            usePolling: true
        }
    },
    // Server output so src/middleware.ts runs at request time and can
    // negotiate Accept: text/markdown for agents (Vercel serves prerendered
    // pages straight from its asset layer, bypassing middleware entirely).
    output: 'server',
    // The public API accepts keyless POSTs (including raw text/plain bodies)
    // from servers, scripts, and agents that send no Origin header. There
    // are no cookies or credentials to forge, so browser-form CSRF
    // protection only breaks documented API behavior here.
    security: {
        checkOrigin: false,
    },
    adapter: vercel({
        imageService: true,
        webAnalytics: {enabled: true},
        isr: {
            // caches all pages on first request and saves for 1 day
            expiration: 60 * 60 * 24,
        },
    })
});