import { addons } from './addons';
import { loadApi } from './api';
import { entryOf } from './catalog';
import { guideOf } from './guides';
import { loadLanguage, type Lang } from './i18n';
import { pages } from './pages';
import { routeOf } from './router';
import { loadSectionSources } from './source';

/**
 * Everything the page at `path` shows that is not in the site's first chunk:
 * a component page's demos, their code and its API table, a guide's text, and
 * the words of the language it is read in. The site waits for this before it
 * mounts and before it turns a page, so a page is shown whole, never in pieces
 * — which is also what keeps the prerendered page from blinking when the
 * application takes it over.
 */
export function preload(path: string, which: Lang): Promise<unknown> {
    const route = routeOf(path.split('#')[0]!);
    const jobs: Promise<unknown>[] = [loadLanguage(which)];
    const page = pages[route.name];
    if (page) jobs.push(page.load());

    if (route.name === 'component') {
        const entry = entryOf(route.id);
        if (entry) jobs.push(entry.load(), loadSectionSources(entry.file), loadApi(entry.file));
    }
    if (route.name === 'doc') {
        const guide = guideOf(route.id);
        if (guide) jobs.push(guide.load());
    }
    if (route.name === 'component' || route.name === 'doc') {
        // The pane beside these pages lists each addon's API table among its links.
        for (const addon of addons) {
            const entry = entryOf(addon.component);
            if (entry) jobs.push(loadApi(entry.file));
        }
    }
    return Promise.all(jobs);
}
