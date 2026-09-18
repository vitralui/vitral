// Vitest keeps CSS out of the specs (`test.css` is off by default) and its stub
// swallows `?raw` along with it, so a component's stylesheet arrives empty and
// the style loader and the SSR collection look right while carrying nothing.
// Here the stylesheets are data, not a document's CSS, so resolve `…css?raw` to
// a module of our own, named so nothing downstream mistakes it for CSS, and
// return the file as a string.
import { readFileSync } from 'node:fs';
import type { Plugin } from 'vite';

const PREFIX = '\0vitral-raw-css:';
const SUFFIX = '.js';

export const rawCss = (): Plugin => ({
    name: 'vitral:raw-css',
    enforce: 'pre',
    async resolveId(source, importer, options) {
        const [file, query] = source.split('?');
        if (!file?.endsWith('.css') || !query?.split('&').includes('raw')) return null;
        const resolved = await this.resolve(file, importer, { ...options, skipSelf: true });
        return resolved ? PREFIX + resolved.id + SUFFIX : null;
    },
    load(id) {
        if (!id.startsWith(PREFIX)) return null;
        const file = id.slice(PREFIX.length, -SUFFIX.length);
        return `export default ${JSON.stringify(readFileSync(file, 'utf8'))};`;
    }
});
