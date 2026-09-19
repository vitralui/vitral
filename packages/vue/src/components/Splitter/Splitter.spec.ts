import { afterEach, describe, expect, it, vi } from 'vitest';
import { h, nextTick } from 'vue';
import { expectNoA11yViolations } from '../../../test/a11y';
import { mountVt, press } from '../../../test/utils';
import Splitter from './Splitter.vue';
import SplitterPanel from './SplitterPanel.vue';

type PanelProps = Record<string, unknown>;

function mountSplitter(props: Record<string, unknown> = {}, panels: PanelProps[] = [{ size: 30 }, { size: 70 }]) {
    const wrapper = mountVt(Splitter, { props, slots: { default: () => panels.map((p, i) => h(SplitterPanel, p, () => `Panel ${i + 1}`)) } });
    const gutters = () => Array.from(document.querySelectorAll<HTMLElement>('[role="separator"]'));
    const panelEls = () => Array.from(document.querySelectorAll<HTMLElement>('.vt-splitterpanel'));
    const sizes = (event: string) => (wrapper.emitted(event) ?? []).map((args) => (args[0] as { sizes: number[] }).sizes);
    return { wrapper, gutters, panelEls, sizes };
}

const pointer = (type: string, init: PointerEventInit) => new PointerEvent(type, { bubbles: true, cancelable: true, button: 0, pointerId: 1, ...init });

afterEach(() => vi.restoreAllMocks());

describe('Splitter', () => {
    it('puts a named, focusable separator between each pair of panels', () => {
        const { gutters, panelEls } = mountSplitter({}, [{ size: 20 }, { size: 30 }, { size: 50 }]);
        expect(gutters()).toHaveLength(2);
        const [first, second] = gutters();
        expect(first!.getAttribute('tabindex')).toBe('0');
        expect(first!.getAttribute('aria-orientation')).toBe('vertical');
        expect(first!.getAttribute('aria-label')).toBe('Resize');
        expect(first!.getAttribute('aria-valuenow')).toBe('20');
        expect(first!.getAttribute('aria-valuemin')).toBe('0');
        expect(first!.getAttribute('aria-valuemax')).toBe('50');
        expect(second!.getAttribute('aria-valuenow')).toBe('30');
        expect(first!.getAttribute('aria-controls')).toBe(panelEls()[0]!.id);
        expect(second!.getAttribute('aria-controls')).toBe(panelEls()[1]!.id);
        expect(new Set(panelEls().map((el) => el.id)).size).toBe(3);
    });

    it('sizes the panels from their share of the space the gutters leave', () => {
        const { panelEls, wrapper } = mountSplitter({ gutterSize: 8 });
        expect(panelEls()[0]!.style.flex).toContain('calc((100% - 1 * var(--vt-splitter-gutter-size, 4px)) * 0.3)');
        expect((wrapper.element as HTMLElement).style.getPropertyValue('--vt-splitter-gutter-size')).toBe('8px');
        expect((wrapper.element as HTMLElement).style.flexDirection).toBe('row');
    });

    it('shares the space among panels that did not ask for a size', () => {
        const { gutters } = mountSplitter({}, [{}, {}, {}, {}]);
        expect(gutters().map((g) => g.getAttribute('aria-valuenow'))).toEqual(['25', '25', '25']);
    });

    it('moves a gutter by step with the arrows, and to its limits with Home and End', async () => {
        const { gutters, sizes } = mountSplitter({ step: 10 }, [{ size: 30, minSize: 10 }, { size: 70, minSize: 20 }]);
        const gutter = () => gutters()[0]!;
        await press(gutter(), 'ArrowRight');
        expect(gutter().getAttribute('aria-valuenow')).toBe('40');
        await press(gutter(), 'ArrowLeft');
        await press(gutter(), 'ArrowLeft');
        expect(gutter().getAttribute('aria-valuenow')).toBe('20');
        await press(gutter(), 'ArrowDown');
        expect(gutter().getAttribute('aria-valuenow')).toBe('20');
        await press(gutter(), 'Home');
        expect(gutter().getAttribute('aria-valuenow')).toBe('10');
        expect(gutter().getAttribute('aria-valuemin')).toBe('10');
        await press(gutter(), 'End');
        expect(gutter().getAttribute('aria-valuenow')).toBe('80');
        expect(gutter().getAttribute('aria-valuemax')).toBe('80');
        expect(sizes('resize')).toEqual([
            [40, 60],
            [30, 70],
            [20, 80],
            [10, 90],
            [80, 20]
        ]);
        expect(sizes('resizeend')).toHaveLength(5);
        expect(sizes('resizestart')).toHaveLength(5);
    });

    it('stacks panels with layout vertical and moves with Up and Down', async () => {
        const { gutters, wrapper } = mountSplitter({ layout: 'vertical' });
        const gutter = gutters()[0]!;
        expect(wrapper.classes()).toContain('vt-splitter-vertical');
        expect((wrapper.element as HTMLElement).style.flexDirection).toBe('column');
        expect(gutter.getAttribute('aria-orientation')).toBe('horizontal');
        await press(gutter, 'ArrowDown');
        expect(gutter.getAttribute('aria-valuenow')).toBe('35');
        await press(gutter, 'ArrowRight');
        expect(gutter.getAttribute('aria-valuenow')).toBe('35');
        await press(gutter, 'ArrowUp');
        expect(gutter.getAttribute('aria-valuenow')).toBe('30');
    });

    it('follows a pointer drag wherever it goes, and honours the minimums', async () => {
        vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ width: 250, height: 250, top: 0, left: 0, right: 250, bottom: 250, x: 0, y: 0, toJSON: () => ({}) });
        const { gutters, sizes } = mountSplitter({}, [{ size: 50 }, { size: 50, minSize: 25 }]);
        const gutter = gutters()[0]!;
        gutter.dispatchEvent(pointer('pointerdown', { clientX: 100 }));
        await nextTick();
        expect(document.activeElement).toBe(gutter);
        expect(gutter.classList).toContain('vt-splitter-gutter-active');

        gutter.dispatchEvent(pointer('pointermove', { clientX: 150 }));
        await nextTick();
        expect(gutter.getAttribute('aria-valuenow')).toBe('60');
        // Off the gutter entirely: the drag is followed from the document, so a
        // finger that leaves the handle still moves the panels.
        document.body.dispatchEvent(pointer('pointermove', { clientX: 900 }));
        await nextTick();
        expect(gutter.getAttribute('aria-valuenow')).toBe('75');
        gutter.dispatchEvent(pointer('pointerup', { clientX: 900 }));
        await nextTick();
        expect(gutter.classList).not.toContain('vt-splitter-gutter-active');
        expect(sizes('resizestart')).toEqual([[50, 50]]);
        expect(sizes('resize')).toEqual([
            [60, 40],
            [75, 25]
        ]);
        expect(sizes('resizeend')).toEqual([[75, 25]]);
    });

    it('reads only SplitterPanels, and keeps an id a panel brings', () => {
        const wrapper = mountVt(Splitter, {
            slots: { default: () => [h(SplitterPanel, { id: 'files' }, () => 'Files'), h('span', 'stray'), h(SplitterPanel, () => 'Editor')] }
        });
        expect(wrapper.find('span').exists()).toBe(false);
        expect(wrapper.get('[role="separator"]').attributes('aria-controls')).toBe('files');
    });

    it('keeps its layout unstyled', () => {
        const { wrapper, gutters } = mountSplitter({ unstyled: true });
        const [first, gutter] = Array.from(wrapper.element.children) as HTMLElement[];
        expect(wrapper.classes()).toEqual([]);
        expect((wrapper.element as HTMLElement).style.display).toBe('flex');
        expect(first!.style.flex).toContain('* 0.3)');
        expect(gutter).toBe(gutters()[0]);
        expect(gutter!.getAttribute('class')).toBeNull();
        expect(gutter!.style.touchAction).toBe('none');
    });

    it('has no accessibility violations', async () => {
        mountSplitter({}, [{ size: 25 }, { size: 50 }, { size: 25 }]);
        mountSplitter({ layout: 'vertical' });
        await expectNoA11yViolations();
    });
});
