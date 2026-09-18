import { watchEffect } from 'vue';
import { templateOf } from '../templates';
import { entryOf } from './catalog';
import { guideOf } from './guides';
import { href, route } from './router';

/**
 * The title, description and social tags of the page being shown. A crawler
 * reads them out of the HTML the build wrote (see `scripts/prerender.mjs`);
 * this keeps them right as the reader moves around, which is what a link
 * shared from an open tab picks up.
 */
const site = 'Vitral';
const origin = 'https://vitralui.github.io';
const fallback = 'A Vue 3 component library built around a token engine: design tokens, presets, light and dark, pass-through and an unstyled mode.';
const image = `${origin}${href('/')}templates/saas/overview-light.webp`;

interface PageHead {
    title: string;
    description: string;
}

function headOf(): PageHead {
    const { name, id } = route.value;
    if (name === 'doc') {
        const guide = guideOf(id);
        return { title: guide ? `${guide.meta.title} — documentation` : 'Documentation', description: guide?.meta.description ?? fallback };
    }
    if (name === 'component') {
        const entry = entryOf(id);
        return {
            title: entry ? `${entry.meta.title} — Vue component` : 'Components',
            description: entry?.meta.description ?? `The ${id} component: live examples, its API and the markup behind each example.`
        };
    }
    if (name === 'icons') return { title: 'Icons', description: 'The outline icon set drawn for Vitral, searchable by name, category and tag.' };
    if (name === 'templates') return { title: 'Templates', description: 'Multi-screen applications built only from Vitral components, themed by the same tokens.' };
    if (name === 'template' || name === 'template-preview') {
        const entry = templateOf(id);
        return { title: entry ? `${entry.name} template` : 'Templates', description: entry?.description ?? fallback };
    }
    return { title: 'Vitral — a Vue 3 component library with a token engine', description: fallback };
}

function meta(selector: string, attribute: 'name' | 'property', key: string, content: string) {
    let tag = document.head.querySelector<HTMLMetaElement>(selector);
    if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute(attribute, key);
        document.head.appendChild(tag);
    }
    tag.content = content;
}

function canonical(url: string) {
    let tag = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!tag) {
        tag = document.createElement('link');
        tag.rel = 'canonical';
        document.head.appendChild(tag);
    }
    tag.href = url;
}

export function useDocumentHead(): void {
    watchEffect(() => {
        const { title, description } = headOf();
        const full = route.value.name === 'home' ? title : `${title} · ${site}`;
        const url = origin + href(route.value.path);

        document.title = full;
        meta('meta[name="description"]', 'name', 'description', description);
        meta('meta[property="og:title"]', 'property', 'og:title', full);
        meta('meta[property="og:description"]', 'property', 'og:description', description);
        meta('meta[property="og:url"]', 'property', 'og:url', url);
        meta('meta[property="og:image"]', 'property', 'og:image', image);
        meta('meta[property="og:type"]', 'property', 'og:type', 'website');
        meta('meta[property="og:site_name"]', 'property', 'og:site_name', site);
        meta('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image');
        meta('meta[name="twitter:title"]', 'name', 'twitter:title', full);
        meta('meta[name="twitter:description"]', 'name', 'twitter:description', description);
        meta('meta[name="twitter:image"]', 'name', 'twitter:image', image);
        canonical(url);
    });
}
