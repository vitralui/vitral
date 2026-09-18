import { ptBR } from '@vitral/core';
import type { ChartOptions, ChartSeries } from '@vitral/chart';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h, inject, nextTick, provide, reactive, ref } from 'vue';
import { useVitral } from '../../config/config';
import Tag from '../Tag/Tag.vue';
import { expectNoA11yViolations } from '../../../test/a11y';
import { mountVt, press } from '../../../test/utils';
import Chart from './Chart.vue';
import type { ChartKind } from './types';

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

const sales: ChartSeries = [
    { name: 'Sales', data: [3, 7, 12] },
    { name: 'Costs', data: [2, 4, 5] }
];
const quarter: ChartOptions = { xaxis: { categories: ['Jan', 'Feb', 'Mar'] }, chart: { animations: { enabled: false } } };

function mountChart(props: Record<string, unknown> = {}) {
    const events = { selection: vi.fn(), legend: vi.fn(), zoomed: vi.fn(), select: vi.fn() };
    const chart = ref<InstanceType<typeof Chart> | null>(null);
    const wrapper = mountVt(
        defineComponent(() => () =>
            h(Chart, {
                ref: chart,
                type: 'line',
                series: sales,
                options: quarter,
                onDataPointSelection: events.select,
                onLegendClick: events.legend,
                onZoomed: events.zoomed,
                onSelection: events.selection,
                ...props
            })
        )
    );
    const svg = () => document.querySelector<SVGSVGElement>('svg[role="img"]')!;
    const canvas = () => document.querySelector<HTMLElement>('[aria-roledescription]')!;
    const status = () => document.querySelector('[role="status"]')!.textContent;
    const button = (name: string) => [...document.querySelectorAll<HTMLButtonElement>('button')].find((b) => (b.getAttribute('aria-label') ?? b.textContent?.trim()) === name)!;
    return { wrapper, chart, events, svg, canvas, status, button };
}

const pointer = (type: string, x: number, y: number, init: PointerEventInit = {}) =>
    new PointerEvent(type, { bubbles: true, clientX: x, clientY: y, pointerId: 1, pointerType: 'mouse', button: 0, ...init });

describe('Chart', () => {
    it('is an image named by a generated summary, inside a focusable chart with key help', async () => {
        const { svg, canvas } = mountChart({ options: { ...quarter, title: { text: 'First quarter' } } });
        const name = document.getElementById(svg().getAttribute('aria-labelledby')!)!.textContent;
        expect(name).toBe('First quarter. Line chart, 2 series: Sales, Costs. Sales, 3 points from 3 to 12. Costs, 3 points from 2 to 5. from Jan to Mar');
        expect(canvas().getAttribute('tabindex')).toBe('0');
        expect(canvas().getAttribute('role')).toBe('group');
        expect(document.getElementById(canvas().getAttribute('aria-describedby')!)!.textContent).toContain('arrow keys');
        expect(svg().querySelectorAll('.vt-chart-line')).toHaveLength(2);
        expect([...svg().querySelectorAll('.vt-chart-axis-bottom .vt-chart-axis-label')].map((t) => t.textContent)).toEqual(['Jan', 'Feb', 'Mar']);
        await expectNoA11yViolations();
    });

    it('walks the data with the arrow keys and reads each point', async () => {
        const { canvas, status, events } = mountChart();
        canvas().focus();
        await press(canvas(), 'ArrowRight');
        expect(status()).toBe('Sales, Jan: 3. 1 of 3');
        await press(canvas(), 'ArrowRight');
        await press(canvas(), 'ArrowDown');
        expect(status()).toBe('Costs, Feb: 4. 2 of 3');
        expect(document.querySelector('.vt-chart-focus-ring')).not.toBeNull();
        expect(document.querySelector('.vt-chart-tooltip')?.textContent).toContain('Feb');
        await press(canvas(), 'Enter');
        expect(events.select).toHaveBeenCalledWith(expect.objectContaining({ seriesIndex: 1, dataPointIndex: 1, value: 4 }));
        await press(canvas(), 'Escape');
        expect(document.querySelector('.vt-chart-focus-ring')).toBeNull();
    });

    it('toggles series from the legend, but never the last one', async () => {
        const { button, svg, events, status } = mountChart();
        const sales = button('Sales');
        expect(sales.getAttribute('aria-pressed')).toBe('true');
        sales.click();
        await settle();
        expect(sales.getAttribute('aria-pressed')).toBe('false');
        expect(svg().querySelectorAll('.vt-chart-line')).toHaveLength(1);
        expect(events.legend).toHaveBeenCalledWith({ seriesIndex: 0, seriesName: 'Sales', hidden: true });
        expect(status()).toBe('Sales hidden');
        button('Costs').click();
        await settle();
        expect(button('Costs').getAttribute('aria-pressed')).toBe('true');
    });

    it('shows a shared tooltip with swatches under the pointer', async () => {
        const { chart, svg } = mountChart();
        await nextTick();
        const scene = chart.value!.scene();
        const column = scene.columns[1]!;
        svg().dispatchEvent(pointer('pointermove', column.pos, scene.plot.y + 20));
        await nextTick();
        const tip = document.querySelector('.vt-chart-tooltip')!;
        expect(tip.getAttribute('aria-hidden')).toBe('true');
        expect(tip.querySelector('.vt-chart-tooltip-title')?.textContent).toBe('Feb');
        expect([...tip.querySelectorAll('.vt-chart-tooltip-row')].map((r) => r.textContent)).toEqual(['Sales7', 'Costs4']);
        expect(tip.querySelectorAll('.vt-chart-tooltip-swatch')).toHaveLength(2);
        expect(svg().querySelector('.vt-chart-crosshair')).not.toBeNull();
        svg().dispatchEvent(pointer('pointerleave', 0, 0));
        await nextTick();
        expect(document.querySelector('.vt-chart-tooltip')).toBeNull();
    });

    it('zooms to a dragged range and resets from the toolbar', async () => {
        const { chart, svg, events, button } = mountChart({ series: [{ name: 'A', data: [1, 2, 3, 4, 5, 6, 7, 8] }], options: { chart: { animations: { enabled: false } } } });
        await nextTick();
        const scene = chart.value!.scene();
        const y = scene.plot.y + 10;
        const from = scene.columns[2]!.pos;
        const to = scene.columns[5]!.pos;
        svg().dispatchEvent(pointer('pointerdown', from, y));
        document.dispatchEvent(pointer('pointermove', to, y));
        await nextTick();
        expect(svg().querySelector('.vt-chart-selection')).not.toBeNull();
        document.dispatchEvent(pointer('pointerup', to, y));
        await settle();
        const window = events.zoomed.mock.calls[0]![0];
        expect(window.min).toBeCloseTo(2, 5);
        expect(window.max).toBeCloseTo(5, 5);
        expect(chart.value!.scene().columns.filter((c) => c.visible).map((c) => c.index)).toEqual([2, 3, 4, 5]);
        const reset = button('Reset zoom');
        expect(reset.disabled).toBe(false);
        reset.click();
        await nextTick();
        expect(events.zoomed).toHaveBeenLastCalledWith(null);
        expect(button('Reset zoom').disabled).toBe(true);
    });

    it('leaves the wheel to the page unless asked, and then wants Ctrl', async () => {
        const { svg, events, wrapper } = mountChart();
        const wheel = (ctrlKey: boolean) => new WheelEvent('wheel', { deltaY: -100, clientX: 200, clientY: 100, ctrlKey, cancelable: true });
        const plain = wheel(false);
        svg().dispatchEvent(plain);
        expect(plain.defaultPrevented).toBe(false);
        wrapper.unmount();
        const next = mountChart({ options: { ...quarter, chart: { zoom: { allowMouseWheelZoom: true } } } });
        const without = wheel(false);
        next.svg().dispatchEvent(without);
        expect(without.defaultPrevented).toBe(false);
        const withCtrl = wheel(true);
        next.svg().dispatchEvent(withCtrl);
        expect(withCtrl.defaultPrevented).toBe(true);
        expect(next.events.zoomed).toHaveBeenCalled();
        expect(events.zoomed).not.toHaveBeenCalled();
    });

    it('has a toolbar with toggle modes and a download menu', async () => {
        const { button, chart } = mountChart();
        const toolbar = document.querySelector('[role="toolbar"]')!;
        expect(toolbar.getAttribute('aria-label')).toBe('Chart tools');
        expect(button('Zoom by selection').getAttribute('aria-pressed')).toBe('true');
        // With the whole range on show there is nothing to pan.
        expect(button('Pan').disabled).toBe(true);
        expect(document.querySelector('.vt-chart-mode-pan')).toBeNull();
        chart.value!.zoomX(1, 2);
        await settle();
        expect(button('Pan').disabled).toBe(false);
        button('Pan').click();
        await nextTick();
        expect(button('Pan').getAttribute('aria-pressed')).toBe('true');
        expect(document.querySelector('.vt-chart-mode-pan')).not.toBeNull();
        // Back to the whole range: the pan tool gives way to zooming.
        button('Reset zoom').click();
        await settle();
        expect(button('Pan').disabled).toBe(true);
        expect(button('Zoom by selection').getAttribute('aria-pressed')).toBe('true');
        expect(document.querySelector('.vt-chart-mode-pan')).toBeNull();
        const download = button('Download');
        download.focus();
        await press(download, 'ArrowDown');
        await settle();
        const menu = document.querySelector('[role="menu"]')!;
        expect(download.getAttribute('aria-expanded')).toBe('true');
        expect([...menu.querySelectorAll('[role="menuitem"]')].map((m) => m.textContent)).toEqual(['Download SVG', 'Download PNG', 'Download CSV']);
        expect(document.activeElement?.textContent).toBe('Download SVG');
        await press(document.activeElement!, 'ArrowUp');
        expect(document.activeElement?.textContent).toBe('Download CSV');
        await expectNoA11yViolations();
        await press(document.activeElement!, 'Escape');
        await settle();
        expect(document.querySelector('[role="menu"]')).toBeNull();
        expect(document.activeElement).toBe(download);
    });

    it('draws a donut with its total, and selects a slice', async () => {
        const { svg, events, canvas, status } = mountChart({ type: 'donut', series: [30, 10, 60], options: { labels: ['Rent', 'Food', 'Other'], chart: { animations: { enabled: false } } } });
        expect(svg().querySelectorAll('.vt-chart-slice')).toHaveLength(3);
        expect(svg().querySelector('.vt-chart-center-label')?.textContent).toBe('Total');
        expect(svg().querySelector('.vt-chart-center-value')?.textContent).toBe('100');
        expect([...svg().querySelectorAll('.vt-chart-data-label')].map((t) => t.textContent)).toEqual(['30%', '10%', '60%']);
        canvas().focus();
        await press(canvas(), 'ArrowRight');
        expect(status()).toBe('Rent, Rent: 30. 1 of 1');
        expect(svg().querySelector('.vt-chart-center-label')?.textContent).toBe('Rent');
        await press(canvas(), ' ');
        expect(events.select).toHaveBeenCalledWith(expect.objectContaining({ seriesIndex: 0, selected: true }));
        expect(svg().querySelector('.vt-chart-slice.vt-chart-selected')).not.toBeNull();
        await expectNoA11yViolations();
    });

    it('shares the crosshair across a group', async () => {
        const Pair = defineComponent(() => () => [
            h(Chart, { type: 'line', series: sales, options: { ...quarter, chart: { group: 'pair', id: 'top', animations: { enabled: false } } } }),
            h(Chart, { type: 'bar', series: sales, options: { ...quarter, chart: { group: 'pair', id: 'bottom', animations: { enabled: false } } } })
        ]);
        mountVt(Pair);
        await nextTick();
        const [top, bottom] = document.querySelectorAll<SVGSVGElement>('svg[role="img"]');
        const pos = Number(top!.querySelector('.vt-chart-axis-bottom .vt-chart-axis-label')!.getAttribute('x'));
        top!.dispatchEvent(pointer('pointermove', pos, 40));
        await nextTick();
        expect(bottom!.querySelector('.vt-chart-crosshair-band')).not.toBeNull();
        top!.dispatchEvent(pointer('pointerleave', 0, 0));
        await nextTick();
        expect(bottom!.querySelector('.vt-chart-crosshair-band')).toBeNull();
    });

    it('drives its target from a brush', async () => {
        const data = Array.from({ length: 20 }, (_, i) => i * 2);
        const zoomed = vi.fn();
        mountVt(
            defineComponent(() => () => [
                h(Chart, { type: 'line', series: [{ name: 'A', data }], options: { chart: { id: 'main', toolbar: { show: false }, animations: { enabled: false } } }, onZoomed: zoomed }),
                h(Chart, { type: 'area', series: [{ name: 'A', data }], height: 120, options: { chart: { brush: { enabled: true, target: 'main' }, selection: { enabled: true, xaxis: { min: 5, max: 10 } }, animations: { enabled: false } } } })
            ])
        );
        await settle();
        expect(zoomed).toHaveBeenCalledWith({ min: 5, max: 10 });
        const brush = document.querySelectorAll<SVGSVGElement>('svg[role="img"]')[1]!;
        expect(brush.querySelectorAll('.vt-chart-brush-shade')).toHaveLength(2);
    });

    it('renders every type, the sparkline and the empty state', async () => {
        const cases: [ChartKind, ChartSeries, ChartOptions?][] = [
            ['area', sales, { chart: { stacked: true } }],
            ['bar', sales, { plotOptions: { bar: { horizontal: true } }, dataLabels: { enabled: true } }],
            ['lollipop', sales],
            ['scatter', [{ name: 'P', data: [[1, 2], [3, 4], [5, 1]] }]],
            ['bubble', [{ name: 'B', data: [{ x: 1, y: 2, z: 10 }, { x: 3, y: 5, z: 30 }] }]],
            ['heatmap', [{ name: 'Mon', data: [{ x: 'a', y: 1 }, { x: 'b', y: 5 }] }, { name: 'Tue', data: [{ x: 'a', y: 3 }, { x: 'b', y: 2 }] }]],
            ['candlestick', [{ name: 'Price', data: [{ x: 'a', y: [10, 14, 8, 12] }, { x: 'b', y: [12, 13, 7, 9] }] }]],
            ['pie', [1, 2, 3], { labels: ['a', 'b', 'c'] }],
            ['radar', [{ name: 'Skill', data: [3, 4, 2, 5] }], { xaxis: { categories: ['w', 'x', 'y', 'z'] } }]
        ];
        for (const [type, series, options] of cases) {
            const { svg, wrapper } = mountChart({ type, series, options: { ...options, chart: { ...options?.chart, animations: { enabled: false } } } });
            expect(svg().querySelectorAll('path, rect').length, type).toBeGreaterThan(2);
            expect(document.getElementById(svg().getAttribute('aria-labelledby')!)!.textContent, type).not.toContain('No data');
            if (type === 'heatmap' || type === 'candlestick') await expectNoA11yViolations();
            wrapper.unmount();
        }
        const spark = mountChart({ series: [{ name: 'A', data: [1, 3, 2] }], options: { chart: { sparkline: { enabled: true } } } });
        expect(document.querySelector('.vt-chart-axis-label')).toBeNull();
        expect(document.querySelector('.vt-chart-legend')).toBeNull();
        expect(document.querySelector('[role="toolbar"]')).toBeNull();
        spark.wrapper.unmount();
        mountChart({ series: [] });
        expect(document.querySelector('.vt-chart-no-data')?.textContent).toBe('No data to show');
        expect(document.querySelector('[aria-roledescription]')).toBeNull();
        await expectNoA11yViolations();
    });

    it('takes options that went through JSON, and adds a hidden data table on request', async () => {
        const options: ChartOptions = JSON.parse(
            JSON.stringify({
                ...quarter,
                yaxis: [{ labels: { formatter: '{value|currency:USD}' } }],
                chart: { accessibility: { dataTable: true }, animations: { enabled: false } },
                annotations: { yaxis: [{ y: 5, label: { text: 'Goal' } }] }
            })
        );
        const { svg } = mountChart({ type: 'bar', options });
        expect([...svg().querySelectorAll('.vt-chart-axis-left .vt-chart-axis-label')].map((t) => t.textContent)).toContain('$10.00');
        expect(svg().querySelector('.vt-chart-annotation-label')?.textContent).toBe('Goal');
        const table = document.querySelector('table')!;
        expect(table.querySelector('caption')?.textContent).toBe('Data of Chart');
        expect([...table.querySelectorAll('tbody tr')].map((r) => r.textContent)).toEqual(['Jan$3.00$2.00', 'Feb$7.00$4.00', 'Mar$12.00$5.00']);
        await expectNoA11yViolations();
    });

    describe('as a wrapper around @vitral/chart', () => {
        it('puts class and style on the root and every other attribute on the plot', () => {
            mountChart({ class: 'mine', style: 'margin: 3px', 'aria-label': 'Sales by month', 'data-test': 'plot' });
            const root = document.querySelector<HTMLElement>('.vt-chart')!;
            expect(root.classList.contains('mine')).toBe(true);
            expect(root.style.margin).toBe('3px');
            expect(root.style.height).toBe('320px');
            const canvas = document.querySelector('[aria-roledescription]')!;
            expect(canvas.getAttribute('aria-label')).toBe('Sales by month');
            expect(canvas.getAttribute('data-test')).toBe('plot');
            expect(root.hasAttribute('aria-label')).toBe(false);
        });

        it('forwards every event as an emit', async () => {
            const enter = vi.fn();
            const leave = vi.fn();
            const click = vi.fn();
            const { chart, svg } = mountChart({ type: 'bar', onDataPointMouseEnter: enter, onDataPointMouseLeave: leave, onClick: click });
            const bars = chart.value!.scene().marks[0]!;
            const bar = bars.kind === 'bar' ? bars.bars[2]! : null;
            const at = { x: bar!.x + bar!.width / 2, y: bar!.y + bar!.height / 2 };
            svg().dispatchEvent(pointer('pointermove', at.x, at.y));
            expect(enter).toHaveBeenCalledWith({ seriesIndex: 0, dataPointIndex: 2, column: 2, value: 12 });
            svg().dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: at.x, clientY: at.y }));
            expect(click).toHaveBeenCalledWith(expect.objectContaining({ seriesIndex: 0, dataPointIndex: 2, column: 2, originalEvent: expect.any(MouseEvent) }));
            svg().dispatchEvent(pointer('pointerleave', 0, 0));
            expect(leave).toHaveBeenCalledTimes(1);
            chart.value!.hideSeries('Costs');
            chart.value!.zoomX(0, 1);
            await settle();
            expect(chart.value!.chart()!.element).toBe(document.querySelector('.vt-chart'));
        });

        it('maps the tooltip, legend, noData and center slots onto the renderer, with the app around them', async () => {
            const picked = ref('none');
            const Host = defineComponent(() => {
                provide('where', 'inside the chart');
                return () =>
                    h(
                        Chart,
                        { type: 'line', series: sales, options: quarter },
                        {
                            tooltip: ({ title, rows }: { title: string; rows: { value: string }[] }) => [h('strong', title), h('span', `${rows[0]!.value} sold (${picked.value})`)],
                            legend: ({ name, hidden }: { name: string; hidden: boolean }) => h(Tag, { value: hidden ? `${name} off` : name })
                        }
                    );
            });
            mountVt(Host);
            const legendTexts = () => [...document.querySelectorAll('.vt-chart-legend-text')].map((t) => t.textContent);
            expect(legendTexts()).toEqual(['Sales', 'Costs']);
            expect(document.querySelectorAll('.vt-chart-legend-text .vt-tag')).toHaveLength(2);
            const svg = document.querySelector<SVGSVGElement>('svg[role="img"]')!;
            const label = svg.querySelectorAll('.vt-chart-axis-bottom .vt-chart-axis-label')[1]!;
            svg.dispatchEvent(pointer('pointermove', Number(label.getAttribute('x')), 30));
            await nextTick();
            const tip = document.querySelector('.vt-chart-tooltip')!;
            expect(tip.textContent).toBe('Feb7 sold (none)');
            expect(tip.querySelector('.vt-chart-tooltip-row')).toBeNull();
            // Slot content follows its own reactive state.
            picked.value = 'Feb';
            await nextTick();
            expect(document.querySelector('.vt-chart-tooltip')!.textContent).toBe('Feb7 sold (Feb)');
            [...document.querySelectorAll<HTMLButtonElement>('.vt-chart-legend button')][1]!.click();
            await settle();
            expect(legendTexts()).toEqual(['Sales', 'Costs off']);

            const Injected = defineComponent(() => {
                const where = inject('where', 'nowhere');
                const { config } = useVitral();
                return () => h('em', `${where}, ${config.locale.code}`);
            });
            mountVt(
                defineComponent(() => {
                    provide('where', 'inside the chart');
                    return () => [
                        h(Chart, { type: 'bar', series: [] }, { noData: () => h(Injected) }),
                        h(Chart, { type: 'donut', series: [2, 3], options: { labels: ['a', 'b'] } }, { center: ({ name, value }: { name: string; value: string }) => h('b', `${name}=${value}`) })
                    ];
                })
            );
            expect(document.querySelector('.vt-chart-no-data')!.textContent).toBe('inside the chart, en');
            const center = document.querySelector('foreignObject');
            expect(center?.textContent).toBe('Total=5');
            expect(document.querySelector('.vt-chart-center-label')).toBeNull();
        });

        it('follows the Vitral configuration: locale, unstyled, global and local pass-through', async () => {
            let config!: ReturnType<typeof useVitral>['config'];
            const local = { svg: { 'data-local': 'yes' }, legendItem: ({ state }: { state: unknown }) => ((state as { hidden: boolean }).hidden ? 'is-off' : 'is-on') };
            mountVt(
                defineComponent(() => {
                    config = useVitral().config;
                    return () => h(Chart, { type: 'line', series: sales, options: quarter, pt: local });
                }),
                {},
                { theme: 'none', pt: { chart: { root: 'from-config', canvas: { 'data-global': 'yes' } } } }
            );
            const root = document.querySelector<HTMLElement>('.vt-chart')!;
            expect(root.classList.contains('from-config')).toBe(true);
            expect(document.querySelector('[aria-roledescription]')!.getAttribute('data-global')).toBe('yes');
            expect(document.querySelector('svg[role="img"]')!.getAttribute('data-local')).toBe('yes');
            expect([...document.querySelectorAll('.vt-chart-legend button')].map((b) => b.classList.contains('is-on'))).toEqual([true, true]);
            config.locale = ptBR;
            await nextTick();
            expect(document.querySelector('[role="toolbar"]')!.getAttribute('aria-label')).toBe(ptBR.chart.toolbar);
            config.unstyled = true;
            await nextTick();
            expect(root.classList.contains('vt-chart')).toBe(false);
            expect(root.classList.contains('from-config')).toBe(true);
            expect(document.querySelector('.vt-chart-legend')).toBeNull();
        });

        it('redraws when the options change in place, and cleans up when unmounted', async () => {
            const options = reactive<ChartOptions>({ xaxis: { categories: ['Jan', 'Feb', 'Mar'] }, chart: { animations: { enabled: false } } });
            const { wrapper, svg } = mountChart({ options });
            options.xaxis!.categories = ['Q1', 'Q2', 'Q3'];
            await nextTick();
            expect([...svg().querySelectorAll('.vt-chart-axis-bottom .vt-chart-axis-label')].map((t) => t.textContent)).toEqual(['Q1', 'Q2', 'Q3']);
            options.chart!.height = 200;
            await nextTick();
            expect(document.querySelector<HTMLElement>('.vt-chart')!.style.height).toBe('200px');
            wrapper.unmount();
            expect(document.querySelector('.vt-chart')).toBeNull();
            expect(document.querySelector('svg')).toBeNull();
        });
    });
});

