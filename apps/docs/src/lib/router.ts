import { computed, ref } from 'vue';

/**
 * A hash router, because the site is a static bundle: every URL is one file,
 * and `#/components/select` survives being opened from disk, from a preview
 * server or from a subdirectory on a host that knows nothing about rewrites.
 *
 * Routes: `#/`, `#/docs/<id>`, `#/components/<id>`, `#/icons`, `#/templates`,
 * `#/templates/<id>` and `#/templates/<id>/preview` — the last one is the
 * template alone, without the site around it.
 *
 * The old `#/themes` and `#/themes/<id>` pages are gone (themes are presets,
 * switched from the bar); their links land on the templates gallery.
 */
export interface Route {
    name: 'home' | 'doc' | 'component' | 'icons' | 'templates' | 'template' | 'template-preview';
    id: string;
    path: string;
}

const retired = /^#?\/themes(\/|$)/;

function normalise(value: string) {
    if (!retired.test(value)) return value;
    history.replaceState(history.state, '', '#/templates');
    return '#/templates';
}

const hash = ref(normalise(location.hash));
window.addEventListener('hashchange', () => (hash.value = normalise(location.hash)));

function parse(value: string): Route {
    const path = value.replace(/^#/, '') || '/';
    const [, section = '', id = '', view = ''] = path.split('/');
    if (section === 'docs') return { name: 'doc', id: id || 'introduction', path };
    if (section === 'components') return { name: 'component', id: id || 'button', path };
    if (section === 'icons') return { name: 'icons', id: '', path };
    if (section === 'templates') {
        if (!id) return { name: 'templates', id: '', path };
        return { name: view === 'preview' ? 'template-preview' : 'template', id, path };
    }
    return { name: 'home', id: '', path: '/' };
}

export const route = computed(() => parse(hash.value));

export function navigate(path: string) {
    if (location.hash.replace(/^#/, '') === path) return;
    location.hash = path;
}
