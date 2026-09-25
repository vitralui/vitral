import type { Component } from 'vue';
import { lookup, t } from './i18n';
import { lazyComponent } from './lazy';

/** Every page in `src/guides/` exports one of these from a plain `<script>` block. */
export interface GuideMeta {
    title: string;
    section: 'Get started' | 'Theming' | 'Customisation' | 'Reference' | 'AI';
    description: string;
    /** Headings the "on this page" list links to, in the order they appear. */
    outline?: string[];
}

export const guideOrder: GuideMeta['section'][] = ['Get started', 'Theming', 'Customisation', 'Reference', 'AI'];

/** A section's name as the page's language reads it; the English one stays the key. */
export function sectionName(section: GuideMeta['section']): string {
    return t(section);
}

// The titles up front, for the menus and the search; the guide itself when it
// is opened. `?meta` is served by `scripts/sfc-meta.ts`.
const metas = import.meta.glob<{ meta: GuideMeta }>('../guides/*.vue', { query: '?meta', eager: true });
const pages = import.meta.glob<{ default: Component }>('../guides/*.vue');

export interface GuideEntry {
    id: string;
    meta: GuideMeta;
    /** The guide, fetched when it is opened (see `./lazy`). */
    component: Component;
    load: () => Promise<void>;
}

/** The order inside a section is the order the file names are numbered with. */
export const guides: GuideEntry[] = Object.entries(metas)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([path, module]) => ({
        id: path.split('/').pop()!.replace(/\.vue(\?.*)?$/, '').replace(/^\d+-/, ''),
        meta: module.meta,
        ...lazyComponent(pages[path.replace(/\?.*$/, '')]!)
    }));

export const guideSections = guideOrder
    .map((section) => ({ section, items: guides.filter((guide) => guide.meta.section === section) }))
    .filter((group) => group.items.length > 0);

export function guideOf(id: string) {
    return guides.find((guide) => guide.id === id);
}

/** A guide's title and description in the page's language, from `locales/<lang>/guides/<id>.json`. */
export function guideText(guide: GuideEntry): { title: string; description: string } {
    const file = `guides/${guide.id}`;
    return { title: lookup(file, 'title') ?? guide.meta.title, description: lookup(file, 'description') ?? guide.meta.description };
}
