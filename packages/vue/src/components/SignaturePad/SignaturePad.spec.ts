import { describe, expect, it } from 'vitest';
import { nextTick } from 'vue';
import { expectNoA11yViolations } from '../../../test/a11y';
import { mountVt } from '../../../test/utils';
import SignaturePad from './SignaturePad.vue';

const pointer = (type: string, x: number, y: number) => new PointerEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y, pointerId: 1, button: 0, pointerType: 'pen' });

function draw(svg: Element, points: [number, number][]) {
    svg.dispatchEvent(pointer('pointerdown', ...points[0]!));
    for (const p of points.slice(1)) svg.dispatchEvent(pointer('pointermove', ...p));
    svg.dispatchEvent(pointer('pointerup', ...points[points.length - 1]!));
}

function mount(props: Record<string, unknown> = {}) {
    const wrapper = mountVt(SignaturePad, { props });
    const svg = wrapper.get('svg').element;
    svg.getBoundingClientRect = () => ({ left: 0, top: 0, width: 600, height: 200, right: 600, bottom: 200, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect;
    return { wrapper, svg };
}

describe('SignaturePad', () => {
    it('draws what the pointer draws, and hands the signature over as an SVG image', async () => {
        const { wrapper, svg } = mount();
        expect(wrapper.find('.vt-signaturepad-placeholder').text()).toBe('Sign here');
        draw(svg, [[10, 100], [40, 80], [80, 120], [120, 90]]);
        await nextTick();
        expect(wrapper.findAll('path.vt-signaturepad-ink')).toHaveLength(1);
        const value = wrapper.emitted('update:modelValue')!.at(-1)![0] as string;
        expect(value.startsWith('data:image/svg+xml;charset=utf-8,')).toBe(true);
        // Ink that thins, by default: the outline of the stroke, filled.
        expect(decodeURIComponent(value)).toMatch(/<g fill="[^"]+" stroke="none"><path d="M[^"]+Z"\/>/);
        expect(wrapper.find('path.vt-signaturepad-ink-filled').exists()).toBe(true);
        expect(wrapper.find('.vt-signaturepad-placeholder').exists()).toBe(false);
        expect(wrapper.emitted('begin')).toHaveLength(1);
        expect(wrapper.emitted('end')).toHaveLength(1);
    });

    it('undoes a stroke, clears, and empties the model with the last one', async () => {
        const { wrapper, svg } = mount();
        draw(svg, [[10, 10], [50, 50]]);
        draw(svg, [[60, 60], [90, 90]]);
        await nextTick();
        const [undo, clear] = wrapper.findAll('button');
        await undo!.trigger('click');
        expect(wrapper.findAll('path.vt-signaturepad-ink')).toHaveLength(1);
        await clear!.trigger('click');
        expect(wrapper.findAll('path.vt-signaturepad-ink')).toHaveLength(0);
        expect(wrapper.emitted('update:modelValue')!.at(-1)![0]).toBeNull();
    });

    it('draws again from the strokes it is given, and takes no ink when read only', async () => {
        const { wrapper, svg } = mount({ strokes: [[[1, 1], [20, 20]]], readonly: true });
        expect(wrapper.findAll('path.vt-signaturepad-ink')).toHaveLength(1);
        draw(svg, [[30, 30], [60, 60]]);
        await nextTick();
        expect(wrapper.findAll('path.vt-signaturepad-ink')).toHaveLength(1);
        expect(wrapper.find('button').exists()).toBe(false);
    });

    it('is named, and says how to sign on it', async () => {
        const { wrapper } = mount();
        expect(wrapper.attributes('role')).toBe('group');
        expect(document.getElementById(wrapper.attributes('aria-describedby')!)!.textContent).toContain('mouse, a pen or a finger');
        await expectNoA11yViolations();
    });

    it('draws a line of one width, exactly where the pointer went, with no thinning or smoothing', async () => {
        const { wrapper, svg } = mount({ thinning: 0, smoothing: 0 });
        draw(svg, [[10, 100], [40, 80], [80, 120], [120, 90]]);
        await nextTick();
        expect(wrapper.find('path.vt-signaturepad-ink-filled').exists()).toBe(false);
        const value = wrapper.emitted('update:modelValue')!.at(-1)![0] as string;
        expect(decodeURIComponent(value)).toContain('<path d="M10,100Q40,80 60,100Q80,120 100,105L120,90"/>');
    });

    it('keeps the pressure of each point, from the pen when it reports one', async () => {
        const { wrapper, svg } = mount();
        const press = (type: string, x: number, pressure: number) =>
            new PointerEvent(type, { bubbles: true, clientX: x, clientY: 50, pointerId: 1, button: 0, pointerType: 'pen', pressure });
        svg.dispatchEvent(press('pointerdown', 10, 0.9));
        svg.dispatchEvent(press('pointermove', 60, 0.3));
        svg.dispatchEvent(press('pointerup', 60, 0.3));
        await nextTick();
        const strokes = wrapper.emitted('update:strokes')!.at(-1)![0] as number[][][];
        expect(strokes[0]!.map((p) => p[2])).toEqual([0.9, 0.3]);
    });
});
