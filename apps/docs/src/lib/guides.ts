import type { Component } from 'vue';

/** Every page in `src/guides/` exports one of these from a plain `<script>` block. */
export interface GuideMeta {
    title: string;
    section: 'Get started' | 'Theming' | 'Customisation' | 'Reference' | 'AI';
    description: string;
    /** Headings the "on this page" list links to, in the order they appear. */
    outline?: string[];
}

export const guideOrder: GuideMeta['section'][] = ['Get started', 'Theming', 'Customisation', 'Reference', 'AI'];

const modules = import.meta.glob<{ default: Component; meta: GuideMeta }>('../guides/*.vue', { eager: true });

export interface GuideEntry {
    id: string;
    meta: GuideMeta;
    component: Component;
}

/** The order inside a section is the order the file names are numbered with. */
export const guides: GuideEntry[] = Object.entries(modules)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([path, module]) => ({ id: path.split('/').pop()!.replace('.vue', '').replace(/^\d+-/, ''), meta: module.meta, component: module.default }));

export const guideSections = guideOrder
    .map((section) => ({ section, items: guides.filter((guide) => guide.meta.section === section) }))
    .filter((group) => group.items.length > 0);

export function guideOf(id: string) {
    return guides.find((guide) => guide.id === id);
}
