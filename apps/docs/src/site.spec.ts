import { flushPromises, mount } from '@vue/test-utils';
import { Vitral } from '@vitral/vue';
import { iconList } from '@vitral/icons/registry';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations } from '../../../packages/vue/test/a11y';
import App from './App.vue';
import { entries } from './lib/catalog';
import { themes } from './lib/presets';
import { direction, presetId } from './lib/theme';
import { apiOf } from './lib/api';
import { guides } from './lib/guides';
import { sectionSources } from './lib/source';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { repoPath } from './lib/links';
import { shotOf } from './lib/shots';
import { templates } from './templates';

/**
 * The site is a Vue application like any other, so it is tested like one: the
 * pages have to mount, and the two things generated from the library's own
 * source (the code beside each example and the API tables) have to come out
 * with something in them.
 */
const mounted: { unmount: () => void }[] = [];
const publicDir = join(dirname(fileURLToPath(import.meta.url)), '../public');

function mountSite(path: string) {
    history.replaceState(null, '', path);
    dispatchEvent(new PopStateEvent('popstate'));
    const wrapper = mount(App, { attachTo: document.body, global: { plugins: [[Vitral, { theme: 'none' }]] } });
    mounted.push(wrapper);
    return wrapper;
}

beforeEach(() => {
    history.replaceState(null, '', '/');
});

// A site left mounted keeps following the URL, so each test cleans up after itself.
afterEach(() => {
    for (const wrapper of mounted.splice(0)) {
        try {
            wrapper.unmount();
        } catch {
            // Already unmounted by the test.
        }
    }
});

describe('the site', () => {
    it('shows the landing page at the root', async () => {
        const wrapper = mountSite('/');
        expect(wrapper.find('h1').text()).toContain('Components that take the shape of your brand');
        // The hero shows the library itself, and every category links to its components.
        expect(wrapper.findAll('.home-category').length).toBeGreaterThan(5);
        await expectNoA11yViolations(wrapper.find('.home').element);
        // The hero shows the components themselves, not theme switches.
        const hero = wrapper.find('.home-hero');
        expect(hero.findAll('[aria-pressed]').filter((b) => ['Prism', 'Ink'].includes(b.text()))).toHaveLength(0);
        expect(hero.find('.home-profile input[type="email"]').exists()).toBe(true);
        expect(hero.find('.home-card-stat .vt-chart').exists()).toBe(true);
    });

    it('shows templates on the landing page, each linking to its page', () => {
        const wrapper = mountSite('/');
        const cards = wrapper.findAll('.home-template');
        expect(cards.length).toBeGreaterThanOrEqual(4);
        expect(cards.length).toBeLessThanOrEqual(6);
        for (const card of cards) expect(card.attributes('href')).toMatch(/^\/templates\/[a-z]+\/$/);
        expect(wrapper.find('a[href="/templates/"]').exists()).toBe(true);
        expect(wrapper.html()).not.toContain('/themes');
    });

    it('opens a component page with its demos, its import and its API', () => {
        const wrapper = mountSite('/components/button');
        expect(wrapper.find('.doc-head h1').text()).toBe('Button');
        expect(wrapper.findAll('.demo-section').length).toBeGreaterThan(0);
        expect(wrapper.find('.code pre').text()).toContain("import { Button } from '@vitral/vue'");
        expect(wrapper.find('.api-table').exists()).toBe(true);
    });

    it('lists every template in the gallery, and filters them by category', async () => {
        const wrapper = mountSite('/templates');
        expect(wrapper.find('.topbar').exists()).toBe(true);
        expect(wrapper.findAll('.tpl-card')).toHaveLength(templates.length);
        for (const entry of templates) {
            expect(wrapper.find(`.tpl-card a[href="/templates/${entry.id}/"]`).exists()).toBe(true);
            expect(wrapper.find(`.tpl-card a[href="/templates/${entry.id}/preview/"]`).exists()).toBe(true);
        }
        // The previews are decoration: inert, and hidden from assistive technology.
        for (const stage of wrapper.findAll('.tpl-thumb-stage')) {
            expect(stage.attributes('aria-hidden')).toBe('true');
            expect(stage.attributes()).toHaveProperty('inert');
        }
        const commerce = wrapper.findAll('.tpl-filter button').find((button) => button.text().startsWith('Commerce'))!;
        await commerce.trigger('click');
        const shown = templates.filter((entry) => entry.category === 'Commerce');
        expect(wrapper.findAll('.tpl-card')).toHaveLength(shown.length);
        await expectNoA11yViolations(wrapper.find('.tpl-filter').element);
    });

    it('describes every template completely, with real components and a picture of every screen', () => {
        const titles = new Set(entries.map((entry) => entry.meta.title));
        expect(templates.length).toBeGreaterThanOrEqual(9);
        for (const entry of templates) {
            expect(entry.screens.length, entry.id).toBeGreaterThanOrEqual(3);
            expect(entry.features.length, entry.id).toBeGreaterThan(0);
            expect(entry.faq.length, entry.id).toBeGreaterThan(0);
            for (const name of entry.components) expect(titles.has(name), `${entry.id} uses ${name}`).toBe(true);
            // Taken by scripts/shoot-templates.mjs; rerun it after changing a template.
            for (const screen of entry.screens) {
                for (const scheme of ['light', 'dark']) {
                    expect(existsSync(join(publicDir, 'templates', entry.id, `${screen.id}-${scheme}.webp`)), `${entry.id}/${screen.id} ${scheme}`).toBe(true);
                }
            }
        }
    });

    for (const entry of templates) {
        it(`shows the ${entry.name} template in pictures, with its demo and source a click away`, async () => {
            const wrapper = mountSite(`/templates/${entry.id}`);
            await flushPromises();
            expect(wrapper.find('.tpl-detail h1').text()).toBe(entry.name);
            const demo = () => wrapper.findAll('.tpl-hero a').find((link) => link.text() === 'Live demo')!;
            const source = wrapper.findAll('.tpl-hero a').find((link) => link.text().includes('GitHub'))!;
            expect(source.attributes('href')).toBe(repoPath(`apps/docs/src/templates/${entry.id}`));
            expect(source.attributes('target')).toBe('_blank');

            // No template runs on this page: every screen is a whole-page picture, in order, each opening the demo on itself.
            expect(wrapper.findAllComponents(entry.layout)).toHaveLength(0);
            const items = wrapper.findAll('.tpl-shots .tpl-shot-item');
            expect(items.map((item) => item.find('h3').text())).toEqual(entry.screens.map((screen) => screen.name));
            for (const [i, screen] of entry.screens.entries()) {
                expect(items[i]!.find('img').attributes('src')).toBe(shotOf(entry.id, screen.id, false));
                expect(items[i]!.find('.tpl-shot-frame').attributes('href')).toBe(`/templates/${entry.id}/preview/${screen.id}/`);
            }
            expect(demo().attributes('href')).toBe(`/templates/${entry.id}/preview/`);

            expect(wrapper.findAll('.tpl-components a').length).toBe(entry.components.length);
            expect(wrapper.findAll('.tpl-faq [aria-expanded]').length).toBe(entry.faq.length);
            expect(wrapper.find('#template-source').exists()).toBe(false);

            await expectNoA11yViolations(wrapper.find('.tpl-hero').element);
            await expectNoA11yViolations(wrapper.find('.tpl-shots-band').element);
            await expectNoA11yViolations(wrapper.find('.tpl-inside').element);
            await expectNoA11yViolations(wrapper.find('.tpl-faq').element);
        });
    }

    it('opens a template full screen, without the site around it', async () => {
        const entry = templates[0]!;
        const wrapper = mountSite(`/templates/${entry.id}/preview/${entry.screens[1]!.id}`);
        // The layout and its screens are loaded on demand.
        await vi.waitFor(async () => {
            await flushPromises();
            expect(wrapper.find('.tpl-full main').exists()).toBe(true);
        });
        expect(wrapper.find('.topbar').exists()).toBe(false);
        expect(wrapper.find('.footer').exists()).toBe(false);
        expect(wrapper.find('.tpl-full main').exists()).toBe(true);
        expect(wrapper.findComponent(entry.screens[1]!.component).exists()).toBe(true);
        expect(wrapper.find('.tpl-float a').attributes('href')).toBe(`/templates/${entry.id}/`);
        // The same theme menu as the site's bar, opening upwards from the foot.
        expect(wrapper.find('.tpl-float button[aria-label="Theme settings"]').exists()).toBe(true);
        await expectNoA11yViolations(wrapper.find('.tpl-float').element);
    });

    it('drops the bar when the screen is being photographed', () => {
        const entry = templates[0]!;
        const wrapper = mountSite(`/templates/${entry.id}/preview?shot`);
        expect(wrapper.find('.tpl-full').exists()).toBe(true);
        expect(wrapper.find('.tpl-float').exists()).toBe(false);
    });

    it('lists the templates by category in the bar, with the search finding them too', async () => {
        const wrapper = mountSite('/');
        const button = wrapper.findAll('.top-nav button').find((entry) => entry.text().startsWith('Templates'))!;
        await button.trigger('click');
        expect(button.attributes('aria-expanded')).toBe('true');
        const panel = wrapper.find('.mega-panel');
        for (const entry of templates) expect(panel.find(`a[href="/templates/${entry.id}/"]`).exists()).toBe(true);
        expect(panel.find('a[href="/templates/"]').exists()).toBe(true);
        expect(panel.findAll('.mega-group-title').length).toBeGreaterThan(1);
        expect(wrapper.find('.footer a[href="/templates/"]').exists()).toBe(true);
        expect(wrapper.find('.footer').html()).not.toContain('/themes');
    });

    it('opens the search across the bar, and puts the bar back when it closes', async () => {
        const wrapper = mountSite('/');
        await wrapper.find('.search-btn').trigger('click');
        // The field is laid over the menus; the buttons after it stay.
        expect(wrapper.find('.topbar').classes()).toContain('is-searching');
        expect(wrapper.find('.top-actions').isVisible()).toBe(true);
        const input = wrapper.find('.searchbar-input');
        await input.setValue('datepicker');
        expect(wrapper.findAll('.search-item').map((item) => item.text())).toEqual([expect.stringContaining('DatePicker')]);
        await input.trigger('keydown', { key: 'Escape' });
        await flushPromises();
        expect(wrapper.find('.topbar').classes()).not.toContain('is-searching');
    });

    it('closes the menus when the page turns over to the other direction', async () => {
        const wrapper = mountSite('/');
        const button = wrapper.findAll('.top-nav button')[0]!;
        await button.trigger('click');
        expect(wrapper.find('.mega-panel').exists()).toBe(true);
        direction.value = 'rtl';
        await flushPromises();
        expect(wrapper.find('.mega-panel').exists()).toBe(false);
        direction.value = 'ltr';
        await flushPromises();
    });

    it('sends the retired theme pages, and the old fragment links, to where they live now', () => {
        for (const old of ['/themes', '/themes/ink']) {
            const wrapper = mountSite(old);
            expect(location.pathname).toBe('/templates/');
            expect(wrapper.find('.tpl-gallery-page').exists()).toBe(true);
        }
    });

    it('sends a page that was renamed to the name it has now', () => {
        const wrapper = mountSite('/components/password');
        expect(location.pathname).toBe('/components/inputpassword/');
        expect(wrapper.find('.doc-head h1').text()).toBe('InputPassword');
    });

    it('opens a guide', () => {
        const wrapper = mountSite('/docs/theming');
        expect(wrapper.find('.doc-head h1').text()).toBe('Theming');
        expect(wrapper.find('.prose').text()).toContain('token');
    });

    it('reads the same page in Portuguese under /pt-br, and links to the other language', async () => {
        const wrapper = mountSite('/pt-br/docs/dark-mode');
        await flushPromises();
        expect(document.documentElement.lang).toBe('pt-BR');
        expect(wrapper.find('.doc-head h1').text()).toBe('Esquemas de cores');
        // Links stay in the language the reader is in.
        expect(wrapper.find('.pane a[href="/pt-br/docs/theming/"]').exists()).toBe(true);
        // The language menu offers the same page in each language, by its own name.
        await wrapper.find('.lang-switch').trigger('click');
        await flushPromises();
        const english = document.querySelector<HTMLAnchorElement>('.lang-list a[hreflang="en"]')!;
        expect(english.getAttribute('href')).toBe('/docs/dark-mode/');
        expect(english.textContent).toContain('English');
        expect(document.querySelector('.lang-list a[aria-current]')?.textContent).toContain('Português (Brasil)');
        // Every version is announced to a search engine, the page itself included.
        const alternates = [...document.head.querySelectorAll<HTMLLinkElement>('link[rel="alternate"][hreflang]')].map((tag) => tag.hreflang);
        expect(alternates).toEqual(['en', 'pt-BR', 'x-default']);
    });

    it('lists every component at /components, rather than opening the first one', () => {
        const wrapper = mountSite('/components');
        expect(wrapper.find('.components-page h1').text()).toBe(`${entries.length} components`);
        const links = wrapper.findAll('.components-card').map((link) => link.attributes('href'));
        expect(links).toHaveLength(entries.length);
        for (const entry of entries) expect(links).toContain(`/components/${entry.id}/`);
    });

    it('lists every component in the pane', () => {
        const wrapper = mountSite('/components/button');
        const links = wrapper.findAll('.pane a').map((link) => link.attributes('href'));
        for (const entry of entries) expect(links).toContain(`/components/${entry.id}/`);
    });

    it('reads a snippet for every demo section', () => {
        for (const entry of entries) {
            const sources = sectionSources(entry.file);
            expect(sources.size, `${entry.file} has no sections`).toBeGreaterThan(0);
            for (const [title, source] of sources) expect(source.code.trim(), `${entry.file} › ${title}`).not.toBe('');
        }
    });

    it('keeps every example a component of its own, that runs where it is pasted', () => {
        // An example file is what the reader copies: it may import the library,
        // Vue and other packages, but nothing from the site around it.
        const examples = import.meta.glob('./demos/*/*.vue', { query: '?raw', import: 'default', eager: true }) as Record<string, string>;
        for (const [path, source] of Object.entries(examples)) {
            expect(source, path).toMatch(/<template>/);
            expect(source.match(/from '\.[^']*'/g) ?? [], `${path} imports from the site`).toEqual([]);
        }
    });

    it('reads props out of every component that declares them', () => {
        const missing = entries.filter((entry) => !apiOf(entry.file)?.props.length);
        // Layout panels take their configuration through slots, not props, so a
        // handful legitimately have none; a whole-catalog blank means the parser broke.
        expect(missing.length).toBeLessThan(entries.length / 2);
    });

    it('shows every icon, filters them, and copies from the one picked', async () => {
        const writes: string[] = [];
        Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async (text: string) => void writes.push(text) } });
        const wrapper = mountSite('/icons');
        expect(wrapper.find('.doc-head h1').text()).toContain(String(iconList.length));
        expect(wrapper.findAll('.icons-tile')).toHaveLength(iconList.length);
        expect(wrapper.find('.top-nav a[href="/icons/"]').attributes('aria-current')).toBe('page');

        await wrapper.find('input[type="search"]').setValue('cart plus');
        const tiles = wrapper.findAll('.icons-tile');
        expect(tiles.map((tile) => tile.attributes('aria-label'))).toEqual(['cartPlus']);
        expect(wrapper.find('.icons-count').text()).toBe(`1 of ${iconList.length} icons`);

        await tiles[0]!.trigger('click');
        expect(wrapper.find('.icons-tile').attributes('aria-pressed')).toBe('true');
        expect(wrapper.find('.icons-panel h2').text()).toBe('cartPlus');
        const copyButtons = wrapper.findAll('.icons-actions button');
        await copyButtons[1]!.trigger('click');
        await new Promise((resolve) => setTimeout(resolve, 30));
        expect(writes.at(-1)).toBe(`import { cartPlus } from '@vitral/icons';\n<Icon :icon="cartPlus" />`);
        await copyButtons[2]!.trigger('click');
        await new Promise((resolve) => setTimeout(resolve, 30));
        expect(writes.at(-1)).toMatch(/^<svg [^>]*viewBox="0 0 24 24"/);
        expect(wrapper.find('.icons-page > .vt-sr-only').text()).toBe('Copied the SVG of cartPlus.');
        await expectNoA11yViolations(wrapper.find('.icons-page').element);

        await wrapper.find('input[type="search"]').setValue('zzzz');
        expect(wrapper.find('.icons-empty').exists()).toBe(true);
    });

    it('gives every guide a title and a section', () => {
        for (const guide of guides) {
            expect(guide.meta.title).toBeTruthy();
            expect(guide.meta.description).toBeTruthy();
        }
    });
});
