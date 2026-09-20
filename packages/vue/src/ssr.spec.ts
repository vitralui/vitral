// @vitest-environment node
// No jsdom here, on purpose. This is the environment a Node server renders in,
// and these specs are about what the components do without a document.
import { describe, expect, it } from 'vitest';
import { createSSRApp, defineComponent, h } from 'vue';
import { renderToString } from 'vue/server-renderer';
import Button from './components/Button/Button.vue';
import Chart from './components/Chart/Chart.vue';
import InputText from './components/InputText/InputText.vue';
import { Vitral } from './plugin';
import { collectStyles, colorSchemeTag } from './ssr';
import type { VitralOptions } from './config/config';

const Page = defineComponent({
    setup: () => () => h('main', [h(Button, { label: 'Save' }), h(InputText, { modelValue: 'text' })])
});

function render(options: VitralOptions = {}) {
    const app = createSSRApp(Page).use(Vitral, options);
    return renderToString(app).then((html) => ({ app, html }));
}

describe('server-side rendering', () => {
    it('renders the components without a document', async () => {
        const { html } = await render();
        expect(html).toContain('class="vt-button');
        expect(html).toContain('<input');
        expect(html).toContain('value="text"');
    });

    it('collects the theme and every stylesheet that was used', async () => {
        const { app } = await render();
        const { css, tags, elements, empty } = collectStyles(app);

        expect(empty).toBe(false);
        // Theme first, so the app's own CSS still comes after it.
        expect(tags.startsWith('<style data-vitral-theme>')).toBe(true);
        expect(css).toContain('--vt-primary-color');
        expect(tags).toContain('data-vitral-style="base"');
        expect(tags).toContain('data-vitral-style="button"');
        expect(tags).toContain('data-vitral-style="inputtext"');
        expect(elements.map((element) => element.key)).toEqual(['vitral:theme', 'vitral:base', 'vitral:button', 'vitral:inputtext']);
        // Only what rendered, not the whole library.
        expect(tags).not.toContain('data-vitral-style="datagrid"');
    });

    it('marks the styles the way the browser does, so hydration skips them', async () => {
        const { app } = await render();
        const { tags } = collectStyles(app);
        for (const name of ['base', 'button', 'inputtext']) {
            expect(tags).toContain(`<style data-vitral-style="${name}">`);
        }
    });

    it('puts the nonce and the CSS layer in the markup', async () => {
        const { app } = await render({ csp: { nonce: 'n0nce' }, cssLayer: 'vitral' });
        const { css, tags } = collectStyles(app);
        expect(tags).toContain('<style data-vitral-theme nonce="n0nce">');
        expect(tags).toContain('<style data-vitral-style="button" nonce="n0nce">');
        expect(css).toContain('@layer vitral {');
    });

    it('collects nothing when the app is unstyled and brings its own theme', async () => {
        const { app } = await render({ unstyled: true, theme: 'none' });
        expect(collectStyles(app)).toEqual({ css: '', tags: '', elements: [], empty: true });
    });

    it('gives the same ids on every render', async () => {
        const first = await render();
        const second = await render();
        const ids = (html: string) => Array.from(html.matchAll(/id="([^"]+)"/g), (m) => m[1]);
        expect(ids(first.html)).toEqual(ids(second.html));
    });

    it('renders the chart as an empty host', async () => {
        // A chart is drawn by measuring its element, which no server can do. It
        // still renders that element, so what hydrates matches what was sent and
        // to be held back until after mount.
        const app = createSSRApp(defineComponent({ setup: () => () => h(Chart, { type: 'line', series: [{ name: 'a', data: [1, 2] }] }) })).use(Vitral);
        const html = await renderToString(app);
        expect(html).toBe('<div></div>');
    });

    it('writes the script that marks <html> before the first paint', async () => {
        const { app } = await render({ theme: { storageKey: 'vt-scheme' }, csp: { nonce: 'n0nce' } });
        const tag = colorSchemeTag(app);
        expect(tag).toContain('<script nonce="n0nce">');
        expect(tag).toContain('localStorage.getItem("vt-scheme")');
        expect(tag).toContain('classList.toggle("vt-dark"');
        expect(tag.endsWith('</script>')).toBe(true);
    });

    it('writes no script when the dark scheme follows the system', async () => {
        const { app } = await render({ theme: { options: { darkModeSelector: 'system' } } });
        expect(colorSchemeTag(app)).toBe('');
    });
});
