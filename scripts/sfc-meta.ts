// `Page.vue?meta`: a page's description without the page. The site lists every
// component and guide in its menus, its search and its sitemap, so it needs
// every page's title, category and sections up front; it does not need every
// page's demos, which pull in the whole library. So the plain `<script>` block
// a page declares its `meta` in is served on its own, with the titles of its
// `<DemoSection>`s beside it, and the page itself is loaded when it is opened.
//
//     import.meta.glob('../demos/*.vue', { query: '?meta', eager: true })
//     // → { meta: DemoMeta, sections: string[] } per page
//
// `Page.vue?sources` is the other half: the page's text and the text of every
// example it imports, as one module, which is what the code beside each demo is
// read from. One chunk per page, fetched when the page is opened.
//
//     import.meta.glob('../demos/*.vue', { query: '?sources', import: 'default' })
//     // → () => Promise<{ page: string; examples: Record<'Button/Severities', string> }>
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';
import type { Plugin } from 'vite';

const require = createRequire(import.meta.url);
const ts = require('typescript') as typeof import('typescript');

const PREFIX = '\0vitral-meta:';
const SOURCES = '\0vitral-sources:';

/** The `title` of every `<DemoSection>`, in order. Quoted attribute values may hold a `>`. */
export function sectionTitles(source: string): string[] {
    return [...source.matchAll(/<DemoSection\b((?:"[^"]*"|'[^']*'|[^>"'])*)>/g)]
        .map((match) => match[1]!.match(/\btitle="([^"]*)"/)?.[1])
        .filter((title): title is string => Boolean(title));
}

export function sfcMeta(): Plugin {
    return {
        name: 'vitral-sfc-meta',
        enforce: 'pre',
        async resolveId(source, importer) {
            const kind = source.match(/\.vue\?(meta|sources)$/)?.[1];
            if (!kind) return null;
            const resolved = await this.resolve(source.slice(0, -`?${kind}`.length), importer, { skipSelf: true });
            return resolved ? `${kind === 'meta' ? PREFIX : SOURCES}${resolved.id.split('?')[0]}` : null;
        },
        load(id) {
            if (id.startsWith(SOURCES)) {
                const file = id.slice(SOURCES.length);
                this.addWatchFile(file);
                const page = readFileSync(file, 'utf8');
                const examples: Record<string, string> = {};
                for (const [, path] of page.matchAll(/import \w+ from '\.\/([^/']+\/[^/']+)\.vue';/g)) {
                    const example = join(dirname(file), `${path}.vue`);
                    this.addWatchFile(example);
                    examples[path!] = readFileSync(example, 'utf8');
                }
                return `export default ${JSON.stringify({ page, examples })};\n`;
            }
            if (!id.startsWith(PREFIX)) return null;
            const file = id.slice(PREFIX.length);
            this.addWatchFile(file);
            const source = readFileSync(file, 'utf8');
            // The first `<script>` without `setup`: where a page says what it is.
            const block = source.match(/<script(?![^>]*\bsetup\b)[^>]*>([\s\S]*?)<\/script>/)?.[1] ?? 'export const meta = undefined;';
            // Type-only imports go, and so does anything the block imports only
            // for the page's own setup, which shares its scope.
            const { outputText } = ts.transpileModule(block, {
                compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2021, verbatimModuleSyntax: false }
            });
            return `${outputText}\nexport const sections = ${JSON.stringify(sectionTitles(source))};\n`;
        }
    };
}
