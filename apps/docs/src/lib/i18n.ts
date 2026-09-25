import { computed, defineComponent, h, inject, ref, shallowReactive, type InjectionKey } from 'vue';
import { once } from './lazy';

/**
 * The site in more than one language, without a second copy of any page.
 *
 * English is the language the site is written in: it stays in the code, where
 * the pages, their demos and the code samples beside them are written once.
 * Every other language is a set of JSON files under `src/locales/<lang>/`,
 * holding only words:
 *
 * - `ui.json`, the site's own strings, keyed by the English they translate:
 *   `t('Search')` reads `"Search": "Buscar"`.
 * - `guides/<id>.json`, a guide's title, description and prose, by key; the
 *   prose is marked in the guide with `<T k="…">English</T>`.
 * - `components/<id>.json`, a component page's title, description and
 *   sections, the sections keyed by their English titles.
 * - `index.ts`, which gathers the rest into the one chunk the site fetches
 *   for the language; a new language copies it from `pt-br/`.
 *
 * Anything a language has not translated yet is shown in English rather than
 * left out. The language is part of the address — `/docs/theming` and
 * `/pt-br/docs/theming` — so each version is a page a crawler can index on its
 * own, and the router is what sets it.
 */
export type Lang = 'en' | 'pt-br';

export const languages: Record<Lang, { prefix: string; tag: string; og: string; name: string; short: string }> = {
    en: { prefix: '', tag: 'en', og: 'en_US', name: 'English', short: 'EN' },
    'pt-br': { prefix: '/pt-br', tag: 'pt-BR', og: 'pt_BR', name: 'Português (Brasil)', short: 'PT' }
};

export const langs = Object.keys(languages) as Lang[];

/** The language of the page being shown. Set by the router, from the address. */
export const lang = ref<Lang>('en');

// ---- the catalogues ---------------------------------------------------------

type Catalog = Record<string, unknown>;

// A language's files are one chunk, `locales/<lang>/index.ts`, fetched the
// first time a page in it is opened.
const bundles = import.meta.glob<{ default: Record<string, Catalog> }>('../locales/*/index.ts');
const fetchers = new Map(Object.entries(bundles).map(([path, load]) => [path.split('/').at(-2)!, once(load)]));

/** `pt-br` → `guides/theming` → its strings. Reactive: a page drawn before its words arrived is redrawn when they do. */
const catalogs = shallowReactive(new Map<string, Map<string, Catalog>>());

/** Fetches a language's words, if it has any and they have not arrived yet. */
export async function loadLanguage(which: Lang): Promise<void> {
    if (catalogs.has(which)) return;
    const bundle = await fetchers.get(which)?.();
    if (!bundle) return;
    // `./guides/theming.json` → `guides/theming`
    catalogs.set(which, new Map(Object.entries(bundle.default).map(([path, catalog]) => [path.replace(/^\.\//, '').replace(/\.json$/, ''), catalog])));
}

/** A file of the current language's translations, or nothing when the page is in English or not translated. */
export function catalog(name: string): Catalog | undefined {
    if (lang.value === 'en') return undefined;
    const words = catalogs.get(lang.value);
    // The router fetches a language before it turns to it; this is the net
    // under anything that got there another way.
    if (!words) loadLanguage(lang.value).catch(() => {});
    return words?.get(name);
}

/** A string out of a catalogue, by a dotted key. */
export function lookup(name: string, key: string): string | undefined {
    let value: unknown = catalog(name);
    for (const part of key.split('.')) value = (value as Catalog | undefined)?.[part];
    return typeof value === 'string' ? value : undefined;
}

/** `{name}` in a string, filled in. */
function fill(text: string, params?: Record<string, string | number>): string {
    return params ? text.replace(/\{(\w+)\}/g, (whole, key: string) => (key in params ? String(params[key]) : whole)) : text;
}

/** One of the site's own strings, in the page's language: the English is the key. */
export function t(english: string, params?: Record<string, string | number>): string {
    const ui = catalog('ui') as Record<string, string> | undefined;
    return fill(ui?.[english] ?? english, params);
}

// ---- prose ------------------------------------------------------------------

/** The catalogue the `<T>` blocks on a page read from: a guide provides its own. */
export const proseScope: InjectionKey<{ value: string }> = Symbol('vitral-prose-scope');

/**
 * A translated link has to reach the page in the same language, under the base
 * the site is served from; the JSON says only `/docs/theming`.
 */
let linkTo: (path: string) => string = (path) => path;
export function setLinkResolver(resolve: (path: string) => string): void {
    linkTo = resolve;
}

const localLinks = (html: string) => html.replace(/href="(\/[^"]*)"/g, (_, path: string) => `href="${linkTo(path.replace(/\/$/, '') || '/')}"`);

/**
 * A block of prose: the English is the slot, written in the page as it always
 * was, and a translation is the same key in the page's catalogue, as HTML
 * (inline `<code>`, `<a href="/docs/…">`, `<strong>`). Without one, the
 * English stays.
 *
 *     <T k="intro">A scheme is not a second theme…</T>
 *     <T k="choosing" as="h2">Choosing one</T>
 */
export const T = defineComponent({
    name: 'T',
    props: {
        k: { type: String, required: true },
        as: { type: String, default: 'p' }
    },
    setup(props, { slots }) {
        const scope = inject(proseScope, { value: 'ui' });
        const translated = computed(() => lookup(scope.value, props.k));
        return () => (translated.value === undefined ? h(props.as, slots.default?.()) : h(props.as, { innerHTML: localLinks(translated.value) }));
    }
});
