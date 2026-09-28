import { afterEach, describe, expect, it } from 'vitest';
import { createChart, type ChartHandle } from './chart';
import type { ChartOptions } from './engine/types';

const handles: ChartHandle[] = [];
afterEach(() => {
    handles.splice(0).forEach((c) => c.destroy());
    document.body.innerHTML = '';
});

function mount(options: ChartOptions) {
    const el = document.createElement('div');
    Object.defineProperty(el, 'clientWidth', { value: 600 });
    document.body.appendChild(el);
    handles.push(
        createChart(el, {
            type: 'line',
            series: [{ name: 'Price', data: [10, 20, 30, 40] }],
            options: { chart: { width: 600, height: 300, animations: { enabled: false } }, ...options }
        })
    );
    const boxes = () => [...el.querySelectorAll('.vt-chart-annotation-label-box')];
    const labels = () => [...el.querySelectorAll<SVGTextElement>('.vt-chart-annotation-label')];
    return { el, boxes, labels };
}

describe('annotation labels', () => {
    it('are drawn on a chip, or without one when told, in the line’s own colour', () => {
        const chip = mount({ annotations: { yaxis: [{ y: 25, borderColor: 'tomato', label: { text: 'Target' } }] } });
        expect(chip.boxes()).toHaveLength(1);
        chip.el.remove();

        const bare = mount({ annotations: { yaxis: [{ y: 25, borderColor: 'tomato', label: { text: 'Target', background: false } }] } });
        expect(bare.boxes()).toHaveLength(0);
        const [label] = bare.labels();
        expect(label!.classList.contains('vt-chart-annotation-label-bare')).toBe(true);
        expect(label!.style.fill).toBe('tomato');
    });

    it('can all go without chips, a label of its own saying otherwise', () => {
        const { boxes } = mount({
            annotations: { labelBackground: false, yaxis: [{ y: 15, label: { text: 'Floor' } }, { y: 35, label: { text: 'Ceiling', background: true } }] }
        });
        expect(boxes()).toHaveLength(1);
    });

    it('step away from each other when two lines meet', () => {
        const { boxes } = mount({
            annotations: {
                yaxis: [
                    { y: 25, label: { text: 'Prev close 25', position: 'left' } },
                    { y: 25, label: { text: 'Low 25', position: 'left' } }
                ]
            }
        });
        const [a, b] = boxes().map((r) => ({ y: Number(r.getAttribute('y')), h: Number(r.getAttribute('height')) }));
        expect(Math.abs(a!.y - b!.y)).toBeGreaterThanOrEqual(a!.h);
    });
});
