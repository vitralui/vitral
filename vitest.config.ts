import { defineConfig } from 'vitest/config';
import { aliases } from './aliases.ts';
import { rawCss } from './scripts/raw-css.ts';
import { vitralVue } from './scripts/vue-plugin.ts';

export default defineConfig({
    plugins: [rawCss(), vitralVue()],
    resolve: { alias: aliases },
    test: {
        environment: 'jsdom',
        include: ['packages/*/src/**/*.spec.ts', 'apps/*/src/**/*.spec.ts'],
        setupFiles: ['./packages/vue/test/setup.ts'],
        // The site's theme previews declare every token inline, which jsdom applies
        // slowly; under a full parallel run the default 5s is not enough for them.
        testTimeout: 20000
    }
});
