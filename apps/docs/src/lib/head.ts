import { watchEffect } from 'vue';
import { templateOf, templateText } from '../templates';
import { entryOf, entryText } from './catalog';
import { guideOf, guideText } from './guides';
import { lang, languages, langs, t } from './i18n';
import { href, hrefIn, route } from './router';

/**
 * The title, description and social tags of the page being shown. A crawler
 * reads them out of the HTML the build wrote (see `scripts/prerender.mjs`);
 * this keeps them right as the reader moves around, which is what a link
 * shared from an open tab picks up.
 */
const site = 'Vitral';
const origin = 'https://vitralui.github.io';
const fallback = () =>
    t('A Vue 3 component library built around a token engine: design tokens, presets, light and dark, pass-through and an unstyled mode.');
const image = `${origin}${hrefIn('en', '/')}templates/saas/overview-light.webp`;

interface PageHead {
    title: string;
    description: string;
}

// An address with nothing behind it says so, whether the shape was wrong
// (`/nonsense`) or only the id was (`/docs/typo`).
const notFound = (): PageHead => ({
    title: t('Page not found'),
    description: t('Nothing is published at this address.')
});

function headOf(): PageHead {
    const { name, id } = route.value;
    if (name === 'doc') {
        const guide = guideOf(id);
        if (!guide) return notFound();
        const text = guideText(guide);
        return { title: `${text.title} — ${t('documentation')}`, description: text.description };
    }
    if (name === 'component') {
        const entry = entryOf(id);
        if (!entry) return notFound();
        const text = entryText(entry);
        return {
            title: `${text.title} — ${t('Vue component')}`,
            description:
                text.description ??
                t('The {id} component: live examples, its API and the markup behind each example.', { id })
        };
    }
    if (name === 'components') {
        return {
            title: t('Components'),
            description: t('Every component, by what it is for. Each page has live examples, the markup behind them and the API read from the source.')
        };
    }
    if (name === 'icons') {
        return {
            title: t('Icons'),
            description: t('The outline icon set drawn for Vitral, searchable by name, category and tag.')
        };
    }
    if (name === 'not-found') return notFound();
    if (name === 'charts') {
        return {
            title: t('Charts'),
            description: t('Every kind of chart the engine draws, live on one page: line, area, bar, lollipop, scatter, bubble, heat map, candlestick, pie, donut and radar.')
        };
    }
    if (name === 'templates') {
        return {
            title: 'Templates',
            description: t('Multi-screen applications built only from Vitral components, themed by the same tokens.')
        };
    }
    if (name === 'template' || name === 'template-preview') {
        const entry = templateOf(id);
        return entry ? { title: t('{name} template', { name: entry.name }), description: templateText(entry).description } : notFound();
    }
    return {
        title: t('Vitral — a Vue 3 component library with a token engine'),
        description: fallback()
    };
}

declare global {
    interface Window {
        gtag?: (...args: unknown[]) => void;
    }
}

/**
 * The Google tag counts the page it loaded on by itself. After that the address
 * bar changes without a load, so every route but the first is sent as a view of
 * its own — otherwise the figures would say every reader saw one page.
 */
let counted = false;
function count(title: string, url: string) {
    if (counted) window.gtag?.('event', 'page_view', { page_title: title, page_location: url });
    counted = true;
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

/**
 * The page's other languages, each at its own address, and `x-default` for a
 * reader whose language is none of them. This is how a search engine learns
 * that `/docs/theming` and `/pt-br/docs/theming` are one page, and shows each
 * reader the one in their language. An address with nothing behind it has no
 * versions to point at.
 */
function alternates(path: string | null) {
    document.head.querySelectorAll('link[rel="alternate"][hreflang]').forEach((tag) => tag.remove());
    document.head.querySelectorAll('meta[property="og:locale:alternate"]').forEach((tag) => tag.remove());
    if (path === null) return;
    const links = [...langs.map((which) => [languages[which].tag, hrefIn(which, path)] as const), ['x-default', hrefIn('en', path)] as const];
    for (const [hreflang, url] of links) {
        const tag = document.createElement('link');
        tag.rel = 'alternate';
        tag.hreflang = hreflang;
        tag.href = origin + url;
        document.head.appendChild(tag);
    }
    for (const which of langs.filter((which) => which !== lang.value)) {
        const tag = document.createElement('meta');
        tag.setAttribute('property', 'og:locale:alternate');
        tag.content = languages[which].og;
        document.head.appendChild(tag);
    }
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
        meta('meta[property="og:locale"]', 'property', 'og:locale', languages[lang.value].og);
        meta('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image');
        meta('meta[name="twitter:title"]', 'name', 'twitter:title', full);
        meta('meta[name="twitter:description"]', 'name', 'twitter:description', description);
        meta('meta[name="twitter:image"]', 'name', 'twitter:image', image);
        canonical(url);
        alternates(route.value.name === 'not-found' ? null : route.value.path);
        count(full, url);
    });
}
