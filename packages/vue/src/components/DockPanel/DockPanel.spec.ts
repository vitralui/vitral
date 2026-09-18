import { describe, expect, it } from 'vitest';
import { h } from 'vue';
import { expectNoA11yViolations } from '../../../test/a11y';
import { mountVt } from '../../../test/utils';
import DockPanel from './DockPanel.vue';

const all = {
    top: () => 'Toolbar',
    bottom: () => 'Status',
    left: () => 'Tree',
    right: () => 'Properties',
    default: () => 'Editor'
};
const styleOf = (el: Element) => (el as HTMLElement).style;

describe('DockPanel', () => {
    it('lets top and bottom span the full width by default, with the fill in the middle', () => {
        const wrapper = mountVt(DockPanel, { slots: all });
        const style = styleOf(wrapper.element);
        expect(style.display).toBe('grid');
        expect(style.gridTemplateAreas).toBe('"top top top" "left fill right" "bottom bottom bottom"');
        expect(style.gridTemplateColumns).toBe('auto minmax(0, 1fr) auto');
        expect(style.gridTemplateRows).toBe('auto minmax(0, 1fr) auto');
        expect(style.gap).toBe('var(--vt-dockpanel-spacing)');
    });

    it('puts each slot in its area, in reading order', () => {
        const wrapper = mountVt(DockPanel, { slots: all });
        const regions = Array.from(wrapper.element.children) as HTMLElement[];
        expect(regions.map((el) => el.textContent)).toEqual(['Toolbar', 'Tree', 'Editor', 'Properties', 'Status']);
        expect(regions.map((el) => el.style.gridArea)).toEqual(['top', 'left', 'fill', 'right', 'bottom']);
        expect(regions.map((el) => el.className)).toEqual(['vt-dockpanel-top', 'vt-dockpanel-left', 'vt-dockpanel-fill', 'vt-dockpanel-right', 'vt-dockpanel-bottom']);
    });

    it('gives the corners to whichever edges dock first', async () => {
        const wrapper = mountVt(DockPanel, { props: { dockOrder: ['left', 'right'] }, slots: all });
        expect(styleOf(wrapper.element).gridTemplateAreas).toBe('"left top right" "left fill right" "left bottom right"');
        await wrapper.setProps({ dockOrder: 'top,left,bottom,right' });
        expect(styleOf(wrapper.element).gridTemplateAreas).toBe('"top top top" "left fill right" "left bottom bottom"');
    });

    it('makes no track, and no gap, for an edge that is not there', () => {
        const wrapper = mountVt(DockPanel, { props: { spacing: 8 }, slots: { left: () => 'Nav', default: () => 'Page' } });
        const style = styleOf(wrapper.element);
        expect(style.gridTemplateAreas).toBe('"left fill"');
        expect(style.gridTemplateColumns).toBe('auto minmax(0, 1fr)');
        expect(style.gridTemplateRows).toBe('minmax(0, 1fr)');
        expect(style.gap).toBe('8px');
        expect(wrapper.element.children).toHaveLength(2);
    });

    it('keeps its layout unstyled and takes pass-through per region', () => {
        const bare = mountVt(DockPanel, { props: { unstyled: true, pt: { fill: 'fill-me', top: { 'data-region': 'top' } } }, slots: all });
        expect(bare.classes()).toEqual([]);
        expect(styleOf(bare.element).gridTemplateAreas).toBe('"top top top" "left fill right" "bottom bottom bottom"');
        expect(bare.get('.fill-me').text()).toBe('Editor');
        expect(bare.get('[data-region="top"]').text()).toBe('Toolbar');
    });

    it('has no accessibility violations', async () => {
        mountVt(DockPanel, {
            slots: {
                top: () => h('div', { role: 'toolbar', 'aria-label': 'Formatting' }, [h('button', { type: 'button' }, 'Bold')]),
                left: () => h('nav', { 'aria-label': 'Files' }, [h('a', { href: '#a' }, 'a.txt')]),
                default: () => h('p', 'Editor')
            }
        });
        await expectNoA11yViolations();
    });
});
