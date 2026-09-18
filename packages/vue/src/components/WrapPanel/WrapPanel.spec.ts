import { classOf, wrappanelStyle } from '@vitral/styles';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { h } from 'vue';
import { expectNoA11yViolations } from '../../../test/a11y';
import { mountVt } from '../../../test/utils';
import WrapPanel from './WrapPanel.vue';

const children = () => Array.from({ length: 6 }, (_, i) => h('div', `Item ${i + 1}`));
const styleOf = (wrapper: { element: Element }) => (wrapper.element as HTMLElement).style;

describe('WrapPanel', () => {
    it('fills rows and wraps, with lines packed at the start', () => {
        const wrapper = mountVt(WrapPanel, { slots: { default: children } });
        expect(wrapper.classes()).toEqual(expect.arrayContaining(['vt-wrappanel', 'vt-wrappanel-horizontal']));
        expect(styleOf(wrapper).display).toBe('flex');
        expect(styleOf(wrapper).flexDirection).toBe('row');
        expect(styleOf(wrapper).flexWrap).toBe('wrap');
        expect(styleOf(wrapper).alignContent).toBe('flex-start');
        expect(styleOf(wrapper).gap).toBe('var(--vt-wrappanel-spacing)');
    });

    it('fills columns when vertical', () => {
        const wrapper = mountVt(WrapPanel, { props: { orientation: 'vertical', spacing: 4 }, slots: { default: children } });
        expect(wrapper.classes()).toContain('vt-wrappanel-vertical');
        expect(styleOf(wrapper).flexDirection).toBe('column');
        expect(styleOf(wrapper).gap).toBe('4px');
    });

    it('sizes every child through custom properties and a child rule', async () => {
        const wrapper = mountVt(WrapPanel, { slots: { default: children } });
        expect(wrapper.classes()).not.toContain('vt-wrappanel-item-width');
        expect(styleOf(wrapper).getPropertyValue('--vt-wrappanel-item-width')).toBe('');

        await wrapper.setProps({ itemWidth: 120, itemHeight: '3rem' });
        expect(wrapper.classes()).toEqual(expect.arrayContaining(['vt-wrappanel-item-width', 'vt-wrappanel-item-height']));
        expect(styleOf(wrapper).getPropertyValue('--vt-wrappanel-item-width')).toBe('120px');
        expect(styleOf(wrapper).getPropertyValue('--vt-wrappanel-item-height')).toBe('3rem');
        // The specs load stylesheets as empty strings; read the rule the class switches on from the file.
        const css = readFileSync(join(process.cwd(), 'packages/styles/src/wrappanel/wrappanel.css'), 'utf8');
        expect(css).toMatch(/\.vt-wrappanel-item-width > \*\s*\{[^}]*width: var\(--vt-wrappanel-item-width\)/);
        expect(css).toMatch(/\.vt-wrappanel-item-height > \*\s*\{[^}]*height: var\(--vt-wrappanel-item-height\)/);
        expect(classOf(wrappanelStyle, 'root', { itemWidth: true })).toContain('vt-wrappanel-item-width');
    });

    it('keeps its flow and item sizes unstyled', () => {
        const bare = mountVt(WrapPanel, { props: { unstyled: true, itemWidth: 80 }, slots: { default: children } });
        expect(bare.classes()).toEqual([]);
        expect(styleOf(bare).flexWrap).toBe('wrap');
        expect(styleOf(bare).getPropertyValue('--vt-wrappanel-item-width')).toBe('80px');
    });

    it('has no accessibility violations', async () => {
        mountVt(WrapPanel, { props: { as: 'ul', itemWidth: 100 }, slots: { default: () => [h('li', 'Red'), h('li', 'Green'), h('li', 'Blue')] } });
        await expectNoA11yViolations();
    });
});
