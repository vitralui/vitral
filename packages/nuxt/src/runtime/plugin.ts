import { collectStyles, colorSchemeAttrs, colorSchemeScript, Vitral, type ColorScheme } from '@vitral/vue';
import { defineNuxtPlugin, useCookie } from 'nuxt/app';
import { directives, locale, options, preset } from '#build/vitral-options.mjs';

// What the module installs. Three things happen here that a plain
// `app.use(Vitral)` does not do: the scheme comes from a cookie so the server
// can render it, `<html>` is marked before anything is painted, and the
// stylesheets collected during the render go into the head of the page.

const schemes: readonly string[] = ['light', 'dark', 'system'];
const year = 60 * 60 * 24 * 365;

export default defineNuxtPlugin({
    name: 'vitral',
    enforce: 'pre',
    setup(nuxtApp) {
        const cookie = options.cookie ? useCookie<ColorScheme | null>(options.cookie, { path: '/', sameSite: 'lax', maxAge: year }) : null;
        const remembered = cookie?.value;
        const colorScheme: ColorScheme = schemes.includes(remembered as string) ? (remembered as ColorScheme) : options.colorScheme;

        nuxtApp.vueApp.use(Vitral, {
            theme: preset ? { preset, colorScheme, storageKey: false, options: { darkModeSelector: options.darkModeSelector, cssLayer: options.cssLayer } } : 'none',
            locale: locale ?? undefined,
            unstyled: options.unstyled,
            inputVariant: options.inputVariant,
            cssLayer: options.cssLayer
        });

        for (const [name, directive] of Object.entries(directives)) nuxtApp.vueApp.directive(name, directive);

        const context = nuxtApp.vueApp.config.globalProperties.$vitral;

        // The cookie is the store rather than localStorage, because only a
        // cookie reaches the server, and the server renders the scheme.
        if (cookie) {
            context.theme?.subscribe((state) => {
                cookie.value = state.colorScheme;
            });
        }

        const head = nuxtApp.ssrContext?.head;
        if (!head) return;

        const attrs = colorSchemeAttrs(context.theme?.getState().dark ?? false, options.darkModeSelector);
        if (Object.keys(attrs).length) head.push({ htmlAttrs: attrs });

        // `'system'` is the one scheme a server cannot resolve, and it has to be
        // resolved before the first paint or a dark page flashes white.
        if (colorScheme === 'system') {
            const script = colorSchemeScript({ colorScheme, darkModeSelector: options.darkModeSelector });
            if (script) head.push({ script: [{ key: 'vitral-scheme', innerHTML: script }] }, { tagPriority: 'critical' });
        }

        // By this point every component has asked for its stylesheet.
        nuxtApp.hook('app:rendered', () => {
            const { elements } = collectStyles(nuxtApp.vueApp);
            if (!elements.length) return;
            head.push({ style: elements.map((element) => ({ ...element.attrs, key: element.key, innerHTML: element.css })) }, { tagPriority: 'high' });
        });
    }
});
