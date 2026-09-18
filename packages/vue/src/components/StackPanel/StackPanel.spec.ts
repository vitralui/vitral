import { describe, expect, it } from 'vitest';
import { h } from 'vue';
import { expectNoA11yViolations } from '../../../test/a11y';
import { mountVt } from '../../../test/utils';
import StackPanel from './StackPanel.vue';

const children = () => [h('div', 'One'), h('div', 'Two'), h('div', 'Three')];
const styleOf = (wrapper: { element: Element }) => (wrapper.element as HTMLElement).style;

describe('StackPanel', () => {
    it('stacks its children vertically by default, spaced by its token', () => {
        const wrapper = mountVt(StackPanel, { slots: { default: children } });
        expect(wrapper.element.tagName).toBe('DIV');
        expect(wrapper.element.children).toHaveLength(3);
        expect(wrapper.classes()).toEqual(expect.arrayContaining(['vt-stackpanel', 'vt-stackpanel-vertical']));
        expect(styleOf(wrapper).display).toBe('flex');
        expect(styleOf(wrapper).flexDirection).toBe('column');
        expect(styleOf(wrapper).gap).toBe('var(--vt-stackpanel-spacing)');
    });

    it('lays out side by side, with spacing in pixels or any CSS length', async () => {
        const wrapper = mountVt(StackPanel, { props: { orientation: 'horizontal', spacing: 12 }, slots: { default: children } });
        expect(wrapper.classes()).toContain('vt-stackpanel-horizontal');
        expect(styleOf(wrapper).flexDirection).toBe('row');
        expect(styleOf(wrapper).gap).toBe('12px');
        await wrapper.setProps({ spacing: '1.5rem' });
        expect(styleOf(wrapper).gap).toBe('1.5rem');
    });

    it('passes alignment, distribution and wrapping to the flex box', () => {
        const wrapper = mountVt(StackPanel, { props: { orientation: 'horizontal', align: 'center', justify: 'space-between', wrap: true }, slots: { default: children } });
        expect(styleOf(wrapper).alignItems).toBe('center');
        expect(styleOf(wrapper).justifyContent).toBe('space-between');
        expect(styleOf(wrapper).flexWrap).toBe('wrap');
        expect(wrapper.classes()).toContain('vt-stackpanel-wrap');
    });

    it('renders as another element', () => {
        const wrapper = mountVt(StackPanel, { props: { as: 'ul' }, slots: { default: () => [h('li', 'A'), h('li', 'B')] } });
        expect(wrapper.element.tagName).toBe('UL');
        expect(wrapper.findAll('li')).toHaveLength(2);
    });

    it('keeps its layout unstyled, and takes pass-through and per-instance tokens', () => {
        const bare = mountVt(StackPanel, { props: { unstyled: true, orientation: 'horizontal', pt: { root: 'mine' } }, slots: { default: children } });
        expect(bare.classes()).toEqual(['mine']);
        expect(styleOf(bare).display).toBe('flex');
        expect(styleOf(bare).flexDirection).toBe('row');

        const themed = mountVt(StackPanel, { props: { dt: { stackpanel: { spacing: '2rem' } } }, slots: { default: children } });
        expect(styleOf(themed).getPropertyValue('--vt-stackpanel-spacing')).toBe('2rem');
    });

    it('has no accessibility violations', async () => {
        mountVt(StackPanel, { props: { as: 'ul' }, slots: { default: () => [h('li', 'A'), h('li', 'B')] } });
        mountVt(StackPanel, { props: { as: 'nav', orientation: 'horizontal' }, attrs: { 'aria-label': 'Sections' }, slots: { default: () => [h('a', { href: '#a' }, 'A'), h('a', { href: '#b' }, 'B')] } });
        await expectNoA11yViolations();
    });
});
