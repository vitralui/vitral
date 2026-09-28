import { afterEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import { expectNoA11yViolations } from '../../../test/a11y';
import { mountVt } from '../../../test/utils';
import TableOfContents from './TableOfContents.vue';

const frame = () => new Promise((resolve) => setTimeout(resolve, 20));

afterEach(() => {
    document.body.innerHTML = '';
});

function page() {
    const article = document.createElement('article');
    article.id = 'doc';
    article.innerHTML = '<h2 id="install">Install</h2><p>…</p><h3 id="npm">With npm</h3><h2 id="usage">Usage</h2><h2>No id</h2>';
    document.body.appendChild(article);
    return article;
}

describe('TableOfContents', () => {
    it('reads the headings that can be linked to, nesting by level', async () => {
        page();
        const wrapper = mountVt(TableOfContents, { props: { source: '#doc' } });
        await nextTick();
        const links = wrapper.findAll('a');
        expect(links.map((a) => a.text())).toEqual(['Install', 'With npm', 'Usage']);
        expect(links.map((a) => a.attributes('href'))).toEqual(['#install', '#npm', '#usage']);
        expect((links[1]!.element as HTMLElement).style.getPropertyValue('--_level')).toBe('2');
        expect(wrapper.get('nav').attributes('aria-labelledby')).toBeTruthy();
        expect(wrapper.text()).toContain('On this page');
    });

    it('marks the section being read as the current location', async () => {
        const article = page();
        const tops: Record<string, number> = { install: -400, npm: 40, usage: 700 };
        article.querySelectorAll('h2, h3').forEach((h) => ((h as HTMLElement).getBoundingClientRect = () => ({ top: tops[h.id] ?? 0 }) as DOMRect));
        const wrapper = mountVt(TableOfContents, { props: { source: '#doc', offset: 80 } });
        await frame();
        expect(wrapper.find('[aria-current="location"]').text()).toBe('With npm');
        expect(wrapper.emitted('update:active')!.at(-1)).toEqual(['npm']);
    });

    it('goes to a heading when its link is followed, and takes an outline it is given', async () => {
        page();
        const scrollTo = vi.fn();
        window.scrollTo = scrollTo as never;
        const wrapper = mountVt(TableOfContents, { props: { items: [{ id: 'usage', label: 'Usage', level: 2 }], title: false } });
        await wrapper.get('a').trigger('click');
        expect(scrollTo).toHaveBeenCalled();
        expect(document.activeElement?.id).toBe('usage');
        expect(wrapper.emitted('navigate')![0]).toEqual(['usage']);
        expect(wrapper.find('p').exists()).toBe(false);
        expect(wrapper.get('nav').attributes('aria-label')).toBe('On this page');
    });

    it('has no accessibility violations', async () => {
        page();
        mountVt(TableOfContents, { props: { source: '#doc' } });
        await nextTick();
        await expectNoA11yViolations();
    });
});
