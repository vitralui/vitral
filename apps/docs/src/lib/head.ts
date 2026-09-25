import { watchEffect } from 'vue';
import { templateOf, templateText } from '../templates';
import './analytics';
import { entryOf, entryText } from './catalog';
import { guideOf, guides, guideText } from './guides';
import { lang, languages, langs, t } from './i18n';
import { href, hrefIn, route } from './router';

/**
 * The title, description, social tags and structured data of the page being
 * shown. A crawler reads them out of the HTML the build wrote (see
 * `scripts/prerender.mjs`); this keeps them right as the reader moves around,
 * which is what a link shared from an open tab picks up.
 */
const site = 'Vitral';
const origin = 'https://vitralui.github.io';
const fallback = () =>
    t('A Vue 3 component library built around a token engine: design tokens, presets, light and dark, pass-through and an unstyled mode.');
const image = `${origin}${hrefIn('en', '/')}templates/saas/overview-light.webp`;

/** A step of the trail from the home page to this one, as a search result shows it. */
interface Crumb {
    name: string;
    path: string;
}

interface PageHead {
    title: string;
    description: string;
    /** The schema.org type of the page: an article for a guide or a component, a collection for a gallery. */
    kind?: 'TechArticle' | 'CollectionPage' | 'WebPage';
    /** The steps between the home page and this one; the page itself is added at the end. */
    trail?: Crumb[];
}

// An address with nothing behind it says so, whether the shape was wrong
// (`/nonsense`) or only the id was (`/docs/typo`).
const notFound = (): PageHead => ({
    title: t('Page not found'),
    description: t('Nothing is published at this address.')
});

// ---- the description a search result shows ----------------------------------

/** What a search result has room for before it cuts the line itself, mid-word. */
const MOST = 160;

/**
 * A page's description as a search result shows it. The one the page opens
 * with is written for a reader already there: some run to three sentences, and
 * some are a few words that lean on the title beside them. A long one is cut
 * after the last whole sentence or clause that fits; a short one is told what
 * else the page holds, when there is room.
 */
export function metaDescription(text: string, more?: string): string {
    let plain = text.replace(/`/g, '').replace(/\s+/g, ' ').trim();
    if (plain.length > MOST) {
        // Not at a comma: what follows one is usually what the sentence was for.
        const room = plain.slice(0, MOST - 1);
        const stop = Math.max(room.lastIndexOf('. '), room.lastIndexOf('; '), room.lastIndexOf(': '));
        plain = stop >= 60 ? `${room.slice(0, stop)}.` : `${room.slice(0, room.lastIndexOf(' ')).replace(/[,;:]$/, '')}…`;
    }
    if (more && plain.length < 110 && plain.length + 1 + more.length <= MOST) return `${plain} ${more}`;
    return plain;
}

function headOf(): PageHead {
    const { name, id } = route.value;
    const components = { name: t('Components'), path: '/components' };
    if (name === 'doc') {
        const guide = guideOf(id);
        if (!guide) return notFound();
        const text = guideText(guide);
        return {
            title: `${text.title} — ${t('documentation')}`,
            description: metaDescription(text.description, t('From the documentation of Vitral, a Vue 3 component library.')),
            kind: 'TechArticle',
            trail: [{ name: t('Documentation'), path: `/docs/${guides[0]!.id}` }]
        };
    }
    if (name === 'component') {
        const entry = entryOf(id);
        if (!entry) return notFound();
        const text = entryText(entry);
        return {
            title: `${text.title} — ${t('Vue component')}`,
            description: metaDescription(
                text.description ?? t('The {id} component: live examples, its API and the markup behind each example.', { id }),
                t('Live examples with the code behind each one, and its API.')
            ),
            kind: 'TechArticle',
            trail: [components]
        };
    }
    if (name === 'components') {
        return {
            title: t('Components'),
            description: t('Every component, by what it is for. Each page has live examples, the markup behind them and the API read from the source.'),
            kind: 'CollectionPage'
        };
    }
    if (name === 'icons') {
        return {
            title: t('Icons'),
            description: metaDescription(
                t('The outline icon set drawn for Vitral, searchable by name, category and tag.'),
                t('Copy any icon as an import or as SVG.')
            ),
            kind: 'CollectionPage'
        };
    }
    if (name === 'not-found') return notFound();
    if (name === 'charts') {
        return {
            title: t('Charts'),
            description: metaDescription(
                t('Every kind of chart the engine draws, live on one page: line, area, bar, lollipop, scatter, bubble, heat map, candlestick, pie, donut and radar.')
            ),
            kind: 'CollectionPage'
        };
    }
    if (name === 'templates') {
        return {
            title: 'Templates',
            description: metaDescription(
                t('Multi-screen applications built only from Vitral components, themed by the same tokens.'),
                t('Each one opens as a live demo, with its source on GitHub.')
            ),
            kind: 'CollectionPage'
        };
    }
    if (name === 'template' || name === 'template-preview') {
        const entry = templateOf(id);
        if (!entry) return notFound();
        return {
            title: t('{name} template', { name: entry.name }),
            // The summary, not the description: the one-line version is what a result has room for.
            description: metaDescription(templateText(entry).summary, t('A Vue 3 template built from Vitral components, with its source on GitHub.')),
            kind: 'WebPage',
            trail: [{ name: 'Templates', path: '/templates' }]
        };
    }
    return {
        title: t('Vitral — a Vue 3 component library with a token engine'),
        description: fallback()
    };
}

// ---- structured data ----------------------------------------------------------

const absolute = (path: string) => origin + href(path);

/**
 * What the page is, for a search engine, as schema.org JSON-LD: the library
 * itself on the home page; elsewhere the page, the site it belongs to, and the
 * trail back to the home page, which is what a result shows in place of the
 * address (Vitral › Components › DataGrid).
 */
function structuredData(head: PageHead, full: string, url: string): object {
    const home = absolute('/');
    const software = {
        '@type': 'SoftwareApplication',
        // One library, whichever language the page is in.
        '@id': `${origin}${hrefIn('en', '/')}#software`,
        name: site,
        applicationCategory: 'DeveloperApplication',
        operatingSystem: 'Any',
        description: fallback(),
        url: home,
        license: 'https://www.gnu.org/licenses/lgpl-3.0.html',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }
    };
    const website = { '@type': 'WebSite', '@id': `${home}#website`, name: site, url: home, inLanguage: languages[lang.value].tag };
    if (route.value.name === 'home' || !head.kind) return { '@context': 'https://schema.org', '@graph': [software, website] };

    const trail = [{ name: site, path: '/' }, ...(head.trail ?? []), { name: head.title.replace(/ — .*$/, ''), path: route.value.path }];
    const page = {
        '@type': head.kind,
        '@id': url,
        url,
        name: full,
        ...(head.kind === 'TechArticle' ? { headline: head.title } : {}),
        description: head.description,
        inLanguage: languages[lang.value].tag,
        isPartOf: { '@id': website['@id'] },
        about: { '@id': software['@id'] },
        breadcrumb: { '@id': `${url}#breadcrumb` }
    };
    const breadcrumb = {
        '@type': 'BreadcrumbList',
        '@id': `${url}#breadcrumb`,
        itemListElement: trail.map((crumb, i) => ({ '@type': 'ListItem', position: i + 1, name: crumb.name, item: absolute(crumb.path) }))
    };
    return { '@context': 'https://schema.org', '@graph': [page, breadcrumb, website, software] };
}

function jsonLd(data: object) {
    let tag = document.head.querySelector<HTMLScriptElement>('script[type="application/ld+json"]');
    if (!tag) {
        tag = document.createElement('script');
        tag.type = 'application/ld+json';
        document.head.appendChild(tag);
    }
    tag.textContent = JSON.stringify(data);
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
        const head = headOf();
        const { title, description } = head;
        const full = route.value.name === 'home' ? title : `${title} · ${site}`;
        const url = origin + href(route.value.path);

        document.title = full;
        meta('meta[name="description"]', 'name', 'description', description);
        meta('meta[property="og:title"]', 'property', 'og:title', full);
        meta('meta[property="og:description"]', 'property', 'og:description', description);
        meta('meta[property="og:url"]', 'property', 'og:url', url);
        meta('meta[property="og:image"]', 'property', 'og:image', image);
        meta('meta[property="og:type"]', 'property', 'og:type', head.kind === 'TechArticle' ? 'article' : 'website');
        meta('meta[property="og:site_name"]', 'property', 'og:site_name', site);
        meta('meta[property="og:locale"]', 'property', 'og:locale', languages[lang.value].og);
        meta('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image');
        meta('meta[name="twitter:title"]', 'name', 'twitter:title', full);
        meta('meta[name="twitter:description"]', 'name', 'twitter:description', description);
        meta('meta[name="twitter:image"]', 'name', 'twitter:image', image);
        canonical(url);
        alternates(route.value.name === 'not-found' ? null : route.value.path);
        jsonLd(structuredData(head, full, url));
        count(full, url);
    });
}
