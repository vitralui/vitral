import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import { aliases } from '../../aliases.ts';
import { vitralVue } from '../../scripts/vue-plugin.ts';

// The site reads two things from outside its own folder: the demo pages it
// shares with the catalog, and the components' `types.ts`, which the API
// tables are generated from. Both live in the workspace, so the dev server is
// told the workspace root is fair game to serve.
const workspace = fileURLToPath(new URL('../..', import.meta.url));

export default defineConfig(({ command }) => ({
    plugins: [vitralVue()],
    resolve: { alias: aliases },
    server: { port: 5180, fs: { allow: [workspace] } },
    // The guides quote `import` statements inside code samples, and the dev
    // server's dependency scanner reads them as imports of this app. Vue is
    // the only dependency worth pre-bundling, so it is named rather than found.
    optimizeDeps: { noDiscovery: true, include: ['vue'] },
    // Built, the site is opened from wherever it is put — a subdirectory, a
    // preview host — so its assets are addressed relative to the page.
    base: command === 'build' ? './' : '/'
}));
