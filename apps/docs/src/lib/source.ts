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
const pages = import.meta.glob('../demos/*.vue', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
const examples = import.meta.glob('../demos/*/*.vue', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

const pageSource = new Map(Object.entries(pages).map(([path, text]) => [path.split('/').pop()!.replace('.vue', ''), text]));
/** `Button/Severities` → its source. */
const exampleSource = new Map(Object.entries(examples).map(([path, text]) => [path.split('/').slice(-2).join('/').replace('.vue', ''), text]));

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
export function sectionSources(file: string) {
    const text = pageSource.get(file) ?? '';
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
        const source = path ? exampleSource.get(path) : undefined;
        sources.set(title, source ? { code: source.trim(), label: `${path!.split('/')[1]}.vue` } : { code: dedent(body), label: 'template' });
    }
    return sources;
}

/** Every example file of a page, in the order the page shows them: what `llms.txt` appends as the page's source. */
export function exampleFiles(file: string): { name: string; code: string }[] {
    return [...sectionSources(file).values()].filter((source) => source.label !== 'template').map((source) => ({ name: source.label, code: source.code }));
}
