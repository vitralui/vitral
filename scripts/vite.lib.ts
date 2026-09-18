// One library build for every package: ES modules with the source tree kept
// file for file, so a bundler can drop every component an app does not import.
import { resolve } from 'node:path';
import { defineConfig, type UserConfig } from 'vite';
import { cssFallbacks } from './css-fallbacks.ts';
import { vitralVue } from './vue-plugin.ts';

const external = (id: string) => id === 'vue' || id.startsWith('@vitral/') || id.startsWith('@floating-ui/');

/** `entries` names extra entry points under `src/` (without `.ts`), for a package with subpath exports. */
export function libConfig(dir: string, options: { vue?: boolean; entries?: string[] } = {}): UserConfig {
    const entries = ['index', ...(options.entries ?? [])];
    return defineConfig({
        plugins: [...(options.vue ? [vitralVue()] : []), cssFallbacks()],
        build: {
            // People read documentation — and run applications — on the phone
            // they have, and an iPhone 7 stops at iOS 15. The default target is
            // newer than that, so it is named rather than inherited.
            target: ['es2021', 'safari15', 'chrome91', 'firefox90', 'edge91'],
            cssTarget: ['safari15', 'chrome91', 'firefox90', 'edge91'],
            lib: { entry: Object.fromEntries(entries.map((name) => [name, resolve(dir, `src/${name}.ts`)])), formats: ['es'] },
            outDir: resolve(dir, 'dist'),
            emptyOutDir: true,
            sourcemap: true,
            minify: false,
            rollupOptions: {
                external,
                output: { preserveModules: true, preserveModulesRoot: resolve(dir, 'src'), entryFileNames: '[name].js' }
            }
        }
    });
}
