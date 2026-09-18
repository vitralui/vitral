import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import { aliases } from '../../aliases.ts';
import { vitralVue } from '../../scripts/vue-plugin.ts';

export default defineConfig({
    plugins: [vitralVue()],
    resolve: { alias: aliases },
    server: { port: 5181, fs: { allow: [fileURLToPath(new URL('../..', import.meta.url))] } }
});
