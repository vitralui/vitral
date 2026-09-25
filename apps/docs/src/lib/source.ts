/**
 * The demo pages are the source of truth for both the running example and the
 * code beside it: the site reads each file twice, compiled by Vite for the demo
 * and raw for the snippet, so a snippet can never drift from what the reader
 * sees running.
 *
 * Every example is a file of its own, `demos/<Page>/<Example>.vue`: a whole
 * component with its own `<script setup>` and `<template>`, so what the reader
 * copies runs as it is. The page, `demos/<Page>.vue`, only names them:
 *
 *     import Severities from './Button/Severities.vue';
 *     …
 *     <DemoSection title="Severities" description="…"><Severities /></DemoSection>
 *
 * A section whose content is not one example component shows its markup
 * instead.
 */
import { shallowReactive } from 'vue';
import { once } from './lazy';

/**
 * A page's text and its examples' text, one chunk per page, fetched when the
 * page is opened (`?sources` is served by `scripts/sfc-meta.ts`).
 */
type PageText = { page: string; examples: Record<string, string> };
const texts = import.meta.glob<PageText>('../demos/*.vue', { query: '?sources', import: 'default' });
const byFile = new Map(Object.entries(texts).map(([path, load]) => [path.split('/').pop()!.replace(/\.vue(\?.*)?$/, ''), once(load)]));

export interface DemoSource {
    code: string;
    /** What the code block is headed with: the example's file name, or `template`. */
    label: string;
}

/** Removes the leading indentation every line shares. */
function dedent(block: string) {
    const lines = block.replace(/^\n/, '').replace(/\s+$/, '').split('\n');
    const indent = Math.min(...lines.filter((l) => l.trim()).map((l) => l.match(/^ */)![0].length));
    return lines.map((l) => l.slice(indent)).join('\n');
}

/**
 * Each `<DemoSection>` in the page, keyed by its title, so a section can show
 * the code that produced it. The sections are siblings, never nested, which is
 * what makes the scan this short.
 */
function parse({ page: text, examples }: PageText) {
    // `import Severities from './Button/Severities.vue'` → Severities: Button/Severities
    const imported = new Map([...text.matchAll(/import (\w+) from '\.\/([^/']+\/[^/']+)\.vue';/g)].map((match) => [match[1]!, match[2]!]));
    const sources = new Map<string, DemoSource>();
    // Quoted attribute values may hold a `>`: a description that names `<Chart>`.
    const open = /<DemoSection\b((?:"[^"]*"|'[^']*'|[^>"'])*)>/g;
    let match: RegExpExecArray | null;

    while ((match = open.exec(text))) {
        const title = match[1]!.match(/\btitle="([^"]*)"/)?.[1];
        const end = text.indexOf('</DemoSection>', open.lastIndex);
        if (!title || end === -1) continue;
        const body = text.slice(open.lastIndex, end).trim();
        const example = body.match(/^<(\w+)\s*\/>$/)?.[1];
        const path = example ? imported.get(example) : undefined;
        const source = path ? examples[path] : undefined;
        sources.set(title, source ? { code: source.trim(), label: `${path!.split('/')[1]}.vue` } : { code: dedent(body), label: 'template' });
    }
    return sources;
}

/** Each page's sections, once they have arrived: reactive, so a page that asked re-renders when they do. */
const loaded = shallowReactive(new Map<string, Map<string, DemoSource>>());

/** Fetches a page's code, if it has not been already. */
export async function loadSectionSources(file: string): Promise<Map<string, DemoSource>> {
    const known = loaded.get(file);
    if (known) return known;
    const text = await byFile.get(file)?.();
    const sources = text ? parse(text) : new Map<string, DemoSource>();
    loaded.set(file, sources);
    return sources;
}

/** A page's code, if it has arrived; asking starts the fetch, and the answer follows when it lands. */
export function sectionSources(file: string): Map<string, DemoSource> {
    const known = loaded.get(file);
    if (known) return known;
    loadSectionSources(file).catch(() => {});
    return new Map();
}
