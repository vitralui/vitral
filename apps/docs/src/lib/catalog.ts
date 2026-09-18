import type { Component } from 'vue';
import { categoryOrder, type DemoMeta } from '../demo';

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
