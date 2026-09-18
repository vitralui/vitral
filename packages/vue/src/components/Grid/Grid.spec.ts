import { describe, expect, it } from 'vitest';
import { h } from 'vue';
import { expectNoA11yViolations } from '../../../test/a11y';
import { mountVt } from '../../../test/utils';
import Grid from './Grid.vue';
import GridItem from './GridItem.vue';

const styleOf = (el: Element) => (el as HTMLElement).style;

describe('Grid', () => {
    it('reads row and column definitions', () => {
        const wrapper = mountVt(Grid, { props: { rows: 'Auto,*,2*,120', columns: '200,*' } });
        const style = styleOf(wrapper.element);
        expect(style.display).toBe('grid');
        expect(style.gridTemplateRows).toBe('auto 1fr 2fr 120px');
        expect(style.gridTemplateColumns).toBe('200px 1fr');
        expect(style.rowGap).toBe('var(--vt-grid-row-spacing)');
        expect(style.columnGap).toBe('var(--vt-grid-column-spacing)');
    });

    it('takes arrays, CSS passed through, and separate row and column spacing', () => {
        const wrapper = mountVt(Grid, { props: { rows: ['Auto', 48], columns: ['minmax(8rem, 1fr)', '3*'], rowSpacing: 4, columnSpacing: '1rem' } });
        const style = styleOf(wrapper.element);
        expect(style.gridTemplateRows).toBe('auto 48px');
        expect(style.gridTemplateColumns).toBe('minmax(8rem, 1fr) 3fr');
        expect(style.rowGap).toBe('4px');
        expect(style.columnGap).toBe('1rem');
    });

    it('places items on 0-based rows and columns, spanning as asked', () => {
        const wrapper = mountVt(Grid, {
            props: { rows: '*,*', columns: '*,*,*' },
            slots: {
                default: () => [
                    h(GridItem, { class: 'a' }, () => 'A'),
                    h(GridItem, { class: 'b', row: 1, column: 1, columnSpan: 2 }, () => 'B'),
                    h(GridItem, { class: 'c', row: '1', column: '0', rowSpan: '2' }, () => 'C')
                ]
            }
        });
        const place = (cls: string) => {
            const style = styleOf(wrapper.get(cls).element);
            return [style.gridRow, style.gridColumn];
        };
        expect(place('.a')).toEqual(['1 / span 1', '1 / span 1']);
        expect(place('.b')).toEqual(['2 / span 1', '2 / span 2']);
        expect(place('.c')).toEqual(['2 / span 2', '1 / span 1']);
        expect(wrapper.get('.a').classes()).toContain('vt-griditem');
    });

    it('draws a box for every cell with showGridLines, out of the way of layout and assistive technology', async () => {
        const wrapper = mountVt(Grid, { props: { rows: 'Auto,*', columns: '100,*,*' } });
        expect(wrapper.findAll('.vt-grid-line')).toHaveLength(0);
        await wrapper.setProps({ showGridLines: true });
        expect(wrapper.classes()).toContain('vt-grid-show-lines');
        expect(styleOf(wrapper.element).position).toBe('relative');
        const lines = wrapper.findAll('.vt-grid-line');
        expect(lines).toHaveLength(6);
        const last = styleOf(lines[5]!.element);
        expect(last.position).toBe('absolute');
        expect(last.gridRow).toBe('2 / 3');
        expect(last.gridColumn).toBe('3 / 4');
        expect(lines.every((line) => line.attributes('aria-hidden') === 'true')).toBe(true);
    });

    it('keeps its layout unstyled', () => {
        const bare = mountVt(Grid, { props: { unstyled: true, columns: 'Auto,*' }, slots: { default: () => h(GridItem, { column: 1, unstyled: true }, () => 'x') } });
        expect(bare.classes()).toEqual([]);
        expect(styleOf(bare.element).gridTemplateColumns).toBe('auto 1fr');
        expect(styleOf(bare.element.firstElementChild!).gridColumn).toBe('2 / span 1');
    });

    it('has no accessibility violations', async () => {
        mountVt(Grid, {
            props: { rows: 'Auto,Auto', columns: 'Auto,*', rowSpacing: 8, columnSpacing: 12, showGridLines: true },
            slots: {
                default: () => [
                    h(GridItem, { as: 'label', for: 'g-name' }, () => 'Name'),
                    h(GridItem, { column: 1 }, () => h('input', { id: 'g-name' })),
                    h(GridItem, { as: 'label', row: 1, for: 'g-mail' }, () => 'Email'),
                    h(GridItem, { row: 1, column: 1 }, () => h('input', { id: 'g-mail', type: 'email' }))
                ]
            }
        });
        await expectNoA11yViolations();
    });
});
