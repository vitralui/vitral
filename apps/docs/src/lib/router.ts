import { computed, ref } from 'vue';

/**
 * Paths, not fragments: every page of the site is a real URL, because a
 * fragment is never sent to a server and never indexed. The build writes one
 * HTML file per route (see `scripts/prerender.mjs`), so a direct hit on
 * `/docs/theming` answers with that page and the application takes over from
 * there.
 *
 * Routes: `/`, `/docs/<id>`, `/components/<id>`, `/icons`, `/charts`, `/templates`,
 * `/templates/<id>` and `/templates/<id>/preview`. The last one is the
 * template alone, without the site around it.
 *
 * The old `#/…` links, and the retired `/themes` pages, are redirected once on
 * arrival so nothing that was shared before breaks.
 */
export interface Route {
    name: 'home' | 'doc' | 'component' | 'icons' | 'charts' | 'templates' | 'template' | 'template-preview' | 'not-found';
    id: string;
    path: string;
}

/** Where the site is served from: `/` in development, `/vitral/` on GitHub Pages. */
export const base = import.meta.env.BASE_URL.replace(/\/$/, '');

/**
 * An internal path as an `href`: under the base the site is served from, and
 * with the trailing slash the static host redirects to, so a crawler following
 * a link is not bounced through a redirect on every one.
 */
export function href(path: string): string {
    if (path === '/') return `${base}/`;
    // The slash belongs to the page, not to the whole link: `#streaming/` is a
    // fragment nothing on the page is named, so the jump never happened.
    const hash = path.indexOf('#');
    if (hash < 0) return `${base}${path}/`;
    return `${base}${path.slice(0, hash)}/${path.slice(hash)}`;
}

const retired = /^\/themes(\/|$)/;

/** Pages that moved: a link written before the move still lands on the page. */
const renamed: Record<string, string> = { '/components/password': '/components/inputpassword' };

/** The path part of a URL, without the base. */
function pathOf(url: URL): string {
    const path = url.pathname.startsWith(base) ? url.pathname.slice(base.length) : url.pathname;
    return path.replace(/\/+$/, '') || '/';
}

/**
 * The path the address bar is on, after sending an old `#/docs/theming` link,
 * or a retired page, to where it lives today.
 */
function settle(): string {
    const url = new URL(location.href);
    const path = pathOf(url);
    const moved = url.hash.startsWith('#/') ? url.hash.slice(1).replace(/\/+$/, '') || '/' : retired.test(path) ? '/templates' : (renamed[path] ?? null);
    if (moved) history.replaceState(null, '', href(moved) + url.search);
    return moved ?? path;
}

const current = ref('/');

if (typeof window !== 'undefined') {
    current.value = settle();
    addEventListener('popstate', () => (current.value = settle()));
}

function parse(path: string): Route {
    const [, section = '', id = '', view = ''] = path.split('/');
    if (section === 'docs') return { name: 'doc', id: id || 'introduction', path };
    if (section === 'components') return { name: 'component', id: id || 'button', path };
    if (section === 'icons') return { name: 'icons', id: '', path };
    if (section === 'charts') return { name: 'charts', id: '', path };
    if (section === 'templates') {
        if (!id) return { name: 'templates', id: '', path };
        return { name: view === 'preview' ? 'template-preview' : 'template', id, path };
    }
    // Anything else is not one of ours. It used to fall through to the home
    // page, which answered a broken link with 200 and the wrong content: the
    // reader saw the front page at an address that had nothing behind it, and
    // so did a crawler.
    return section === '' ? { name: 'home', id: '', path: '/' } : { name: 'not-found', id: '', path };
}

export const route = computed(() => parse(current.value));

/**
 * Brings the named part of the page into view. A page that is already on
 * screen can be jumped to at once; one that is about to be drawn has to be
 * waited for, so it is tried again for a few frames before giving up.
 */
function jumpTo(id: string, tries = 10): void {
    const target = document.getElementById(id);
    if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
    }
    if (tries > 0) requestAnimationFrame(() => jumpTo(id, tries - 1));
}

export function navigate(path: string, hash = ''): void {
    if (current.value === path) {
        // Same page: only the fragment moved, so the address bar is corrected
        // and the page is scrolled. Returning early here is what stopped a
        // sidebar link from going anywhere.
        if (!hash) return;
        history.pushState(null, '', href(path) + hash);
        jumpTo(hash.slice(1));
        return;
    }
    history.pushState(null, '', href(path) + hash);
    current.value = path;
    if (hash) jumpTo(hash.slice(1));
}

/**
 * Turns a press on any internal link into a navigation, so the whole site can
 * be written with plain `<a href>` elements: they are what a crawler follows
 * and what a middle click opens in a tab.
 */
export function interceptLinks(): void {
    addEventListener('click', (event) => {
        if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        const link = (event.target as Element | null)?.closest?.('a');
        const url = link?.getAttribute('href');
        if (!link || !url || link.target === '_blank' || link.hasAttribute('download') || url.startsWith('#')) return;

        const destination = new URL(link.href);
        if (destination.origin !== location.origin || !destination.pathname.startsWith(base || '/')) return;
        event.preventDefault();
        navigate(pathOf(destination), destination.hash);
    });
}
