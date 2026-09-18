/**
 * The demo pages are the source of truth for both the running example and the
 * code beside it: the site reads each `.vue` file twice, compiled by Vite for
 * the demo and raw for the snippet, so a snippet can never drift from what
 * the reader sees running.
 */
const raw = import.meta.glob('../demos/*.vue', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;

const sourceByFile = new Map(Object.entries(raw).map(([path, text]) => [path.split('/').pop()!.replace('.vue', ''), text]));

/** Removes the leading indentation every line shares. */
function dedent(block: string) {
    const lines = block.replace(/^\n/, '').replace(/\s+$/, '').split('\n');
    const indent = Math.min(...lines.filter((l) => l.trim()).map((l) => l.match(/^ */)![0].length));
    return lines.map((l) => l.slice(indent)).join('\n');
}

/** The `<script setup>` block, shown once above a page's snippets. */
export function setupSource(file: string) {
    const text = sourceByFile.get(file) ?? '';
    const match = text.match(/<script setup lang="ts">([\s\S]*?)<\/script>/);
    if (!match) return '';
    return match[1]!
        .split('\n')
        .filter((line) => !/from '\.\.\/DemoSection\.vue'|from '\.\.\/demo'/.test(line))
        .join('\n')
        .trim();
}

/**
 * Each `<DemoSection>` in the template, keyed by its title, so a section can
 * show the markup that produced it. The sections are siblings, never nested,
 * which is what makes the scan this short.
 */
export function sectionSources(file: string) {
    const text = sourceByFile.get(file) ?? '';
    const sources = new Map<string, string>();
    const open = /<DemoSection\b([^>]*)>/g;
    let match: RegExpExecArray | null;

    while ((match = open.exec(text))) {
        const title = match[1]!.match(/\btitle="([^"]*)"/)?.[1];
        const end = text.indexOf('</DemoSection>', open.lastIndex);
        if (!title || end === -1) continue;
        sources.set(title, dedent(text.slice(open.lastIndex, end)));
    }
    return sources;
}
