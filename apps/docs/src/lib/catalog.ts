import type { Component } from 'vue';
import { categoryOrder, type DemoMeta } from '../demo';
import { catalog, lookup } from './i18n';

export interface CatalogEntry {
    id: string;
    /** The file name, which is also the component's directory in `@vitral/vue`. */
    file: string;
    meta: DemoMeta;
    component: Component;
}

const modules = import.meta.glob<{ default: Component; meta?: DemoMeta }>('../demos/*.vue', { eager: true });

export const entries: CatalogEntry[] = Object.entries(modules)
    .map(([path, module]) => {
        const file = path.split('/').pop()!.replace('.vue', '');
        return { id: file.toLowerCase(), file, meta: module.meta ?? { title: file, category: 'Misc' as const }, component: module.default };
    })
    .sort((a, b) => a.meta.title.localeCompare(b.meta.title));

export const sections = categoryOrder
    .map((category) => ({ category, items: entries.filter((entry) => entry.meta.category === category) }))
    .filter((section) => section.items.length > 0);

export function entryOf(id: string) {
    return entries.find((entry) => entry.id === id);
}

/**
 * A component's title and description in the page's language, from
 * `locales/<lang>/components/<id>.json`:
 *
 *     { "title": "…", "description": "…", "sections": { "Severities": { "title": "…", "description": "…" } } }
 */
export function entryText(entry: CatalogEntry): { title: string; description?: string } {
    const file = `components/${entry.id}`;
    return { title: lookup(file, 'title') ?? entry.meta.title, description: lookup(file, 'description') ?? entry.meta.description };
}

/**
 * A demo section's heading and description in the page's language. It is found
 * by its English title, which stays its anchor and the key its markup is read by.
 */
export function sectionText(entry: CatalogEntry | undefined, title: string, description?: string): { title: string; description?: string } {
    if (!entry) return { title, description };
    // Not a dotted lookup: a title may have a dot in it.
    const sections = catalog(`components/${entry.id}`)?.sections as Record<string, { title?: string; description?: string }> | undefined;
    const text = sections?.[title];
    return { title: text?.title ?? title, description: text?.description ?? description };
}
