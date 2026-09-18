import { ptBR } from '@vitral/core';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations } from '../../vue/test/a11y';
import { createChart, type ChartConfig, type ChartHandle } from './chart';
import { chartBus, groupChannel } from './engine/group';
import type { ChartOptions, ChartSeries, ChartType } from './engine/types';

// The framework-free renderer, driven directly: no component in sight.

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));
const tick = () => Promise.resolve();

const sales: ChartSeries = [
    { name: 'Sales', data: [3, 7, 12] },
    { name: 'Costs', data: [2, 4, 5] }
];
const quarter: ChartOptions = { xaxis: { categories: ['Jan', 'Feb', 'Mar'] }, chart: { animations: { enabled: false } } };

const handles: ChartHandle[] = [];
afterEach(() => {
    handles.splice(0).forEach((c) => c.destroy());
});

function mount(config: ChartConfig = {}, host?: HTMLElement) {
    const el = host ?? document.createElement('div');
    if (!el.isConnected) document.body.appendChild(el);
    const chart = createChart(el, { type: 'line', series: sales, options: quarter, ...config });
    handles.push(chart);
    const svg = () => el.querySelector<SVGSVGElement>('svg[role="img"]')!;
    const canvas = () => el.querySelector<HTMLElement>('[aria-roledescription]')!;
    const status = () => el.querySelector('[role="status"]')!.textContent;
    const button = (name: string) => [...document.querySelectorAll<HTMLButtonElement>('button')].find((b) => (b.getAttribute('aria-label') ?? b.textContent?.trim()) === name)!;
    return { el, chart, svg, canvas, status, button };
}

const pointer = (type: string, x: number, y: number, init: PointerEventInit = {}) =>
    new PointerEvent(type, { bubbles: true, clientX: x, clientY: y, pointerId: 1, pointerType: 'mouse', button: 0, ...init });

async function press(el: Element, key: string, init: KeyboardEventInit = {}) {
    el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init }));
    el.dispatchEvent(new KeyboardEvent('keyup', { key, bubbles: true, cancelable: true, ...init }));
    await settle();
}

describe('createChart', () => {
    it('turns the element into an image named by a generated summary, inside a focusable group', async () => {
        const host = document.createElement('div');
        host.className = 'mine';
        host.style.border = '1px solid red';
        const { el, svg, canvas } = mount({ options: { ...quarter, title: { text: 'First quarter' } } }, host);
        expect(el.classList.contains('vt-chart')).toBe(true);
        expect(el.classList.contains('mine')).toBe(true);
        expect(el.style.height).toBe('320px');
        expect(el.style.border).toBe('1px solid red');
        const name = document.getElementById(svg().getAttribute('aria-labelledby')!)!.textContent;
        expect(name).toBe('First quarter. Line chart, 2 series: Sales, Costs. Sales, 3 points from 3 to 12. Costs, 3 points from 2 to 5. from Jan to Mar');
        expect(canvas().getAttribute('tabindex')).toBe('0');
        expect(canvas().getAttribute('role')).toBe('group');
        expect(canvas().getAttribute('aria-roledescription')).toBe('chart');
        expect(document.getElementById(canvas().getAttribute('aria-describedby')!)!.textContent).toContain('arrow keys');
        expect(svg().querySelectorAll('.vt-chart-line')).toHaveLength(2);
        expect([...svg().querySelectorAll('.vt-chart-axis-bottom .vt-chart-axis-label')].map((t) => t.textContent)).toEqual(['Jan', 'Feb', 'Mar']);
        // The layout order: toolbar, body (legend after the canvas), key help, live region.
        expect([...el.children].map((c) => c.className || c.tagName)).toEqual(['vt-chart-toolbar', 'vt-chart-body vt-chart-body-legend-bottom', 'SPAN', 'vt-chart-status']);
        await expectNoA11yViolations();
    });

    it('shows a shared tooltip only while the pointer is inside the plot', async () => {
        const { chart, svg } = mount();
        const scene = chart.scene();
        const column = scene.columns[1]!;
        svg().dispatchEvent(pointer('pointermove', column.pos, scene.plot.y + 20));
        await tick();
        const tip = document.querySelector('.vt-chart-tooltip')!;
        expect(tip.getAttribute('aria-hidden')).toBe('true');
        expect(tip.querySelector('.vt-chart-tooltip-title')?.textContent).toBe('Feb');
        expect([...tip.querySelectorAll('.vt-chart-tooltip-row')].map((r) => r.textContent)).toEqual(['Sales7', 'Costs4']);
        expect(tip.querySelectorAll('.vt-chart-tooltip-swatch')).toHaveLength(2);
        expect(svg().querySelector('.vt-chart-crosshair')).not.toBeNull();
        // Over the axis labels, under the plot: nothing is pointed at.
        svg().dispatchEvent(pointer('pointermove', column.pos, scene.plot.y + scene.plot.height + 12));
        await tick();
        expect(document.querySelector('.vt-chart-tooltip')).toBeNull();
        expect(svg().querySelector('.vt-chart-crosshair')).toBeNull();
        svg().dispatchEvent(pointer('pointermove', column.pos, scene.plot.y + 20));
        await tick();
        svg().dispatchEvent(pointer('pointerleave', 0, 0));
        await tick();
        expect(document.querySelector('.vt-chart-tooltip')).toBeNull();
    });

    it('keeps its elements while the pointer moves, so nothing replays or loses focus', async () => {
        const { chart, svg } = mount({ options: { ...quarter, chart: { animations: { enabled: true } } } });
        const lines = [...svg().querySelectorAll('.vt-chart-series')];
        const icons = [...document.querySelectorAll('.vt-chart-tool path, .vt-chart-tool circle, .vt-chart-tool rect')];
        const scene = chart.scene();
        for (const column of scene.columns) {
            svg().dispatchEvent(pointer('pointermove', column.pos, scene.plot.y + 20));
            await tick();
        }
        svg().dispatchEvent(pointer('pointerleave', 0, 0));
        await tick();
        expect([...svg().querySelectorAll('.vt-chart-series')]).toEqual(lines);
        // An icon's drawing is set once: a press and its release land on the same node.
        expect(icons.length).toBeGreaterThan(5);
        expect([...document.querySelectorAll('.vt-chart-tool path, .vt-chart-tool circle, .vt-chart-tool rect')]).toEqual(icons);
    });

    it('emits point events and selects on click', async () => {
        const { chart, svg } = mount({ type: 'bar' });
        const enter = vi.fn();
        const leave = vi.fn();
        const select = vi.fn();
        const click = vi.fn();
        chart.on('dataPointMouseEnter', enter);
        chart.on('dataPointMouseLeave', leave);
        chart.on('dataPointSelection', select);
        const offClick = chart.on('click', click);
        const bar = chart.scene().marks[0]!;
        const b = bar.kind === 'bar' ? bar.bars[1]! : null;
        svg().dispatchEvent(pointer('pointermove', b!.x + b!.width / 2, b!.y + b!.height / 2));
        expect(enter).toHaveBeenCalledWith({ seriesIndex: 0, dataPointIndex: 1, column: 1, value: 7 });
        svg().dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: b!.x + b!.width / 2, clientY: b!.y + b!.height / 2 }));
        expect(click).toHaveBeenCalledWith(expect.objectContaining({ seriesIndex: 0, dataPointIndex: 1, column: 1 }));
        expect(select).toHaveBeenCalledWith({ seriesIndex: 0, dataPointIndex: 1, column: 1, value: 7, selected: true });
        await tick();
        expect(svg().querySelector('.vt-chart-bar.vt-chart-selected')?.getAttribute('data-index')).toBe('1');
        svg().dispatchEvent(pointer('pointerleave', 0, 0));
        expect(leave).toHaveBeenCalledWith({ seriesIndex: 0, dataPointIndex: 1, column: 1, value: 7 });
        offClick();
        svg().dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: 1, clientY: 1 }));
        expect(click).toHaveBeenCalledTimes(1);
    });

    it('toggles series from the legend from the keyboard, keeping focus, but never the last one', async () => {
        const { chart, button, svg, status } = mount();
        const legendClick = vi.fn();
        chart.on('legendClick', legendClick);
        const salesButton = button('Sales');
        expect(salesButton.closest('ul')?.getAttribute('aria-label')).toBe('Legend');
        expect(salesButton.getAttribute('aria-pressed')).toBe('true');
        salesButton.focus();
        await tick();
        // Focus dims the other entries.
        expect(button('Costs').classList.contains('vt-chart-dim')).toBe(true);
        // A keyboard press on a native button is a click.
        salesButton.click();
        await settle();
        expect(button('Sales')).toBe(salesButton);
        expect(document.activeElement).toBe(salesButton);
        expect(salesButton.getAttribute('aria-pressed')).toBe('false');
        expect(salesButton.getAttribute('title')).toBe('Sales hidden');
        expect(svg().querySelectorAll('.vt-chart-line')).toHaveLength(1);
        expect(legendClick).toHaveBeenCalledWith({ seriesIndex: 0, seriesName: 'Sales', hidden: true });
        expect(status()).toBe('Sales hidden');
        button('Costs').click();
        await settle();
        expect(button('Costs').getAttribute('aria-pressed')).toBe('true');
        chart.showSeries('Sales');
        await settle();
        expect(salesButton.getAttribute('aria-pressed')).toBe('true');
        chart.hideSeries(1);
        await settle();
        expect(button('Costs').getAttribute('aria-pressed')).toBe('false');
    });

    it('zooms to a dragged range, pans only once zoomed, and resets', async () => {
        const { chart, svg, button } = mount({ series: [{ name: 'A', data: [1, 2, 3, 4, 5, 6, 7, 8] }], options: { chart: { animations: { enabled: false } } } });
        const zoomed = vi.fn();
        chart.on('zoomed', zoomed);
        let scene = chart.scene();
        const y = scene.plot.y + 10;
        // Shift-drag pans, but there is nothing to pan yet.
        svg().dispatchEvent(pointer('pointerdown', scene.columns[4]!.pos, y, { shiftKey: true }));
        document.dispatchEvent(pointer('pointermove', scene.columns[2]!.pos, y));
        document.dispatchEvent(pointer('pointerup', scene.columns[2]!.pos, y));
        await settle();
        expect(zoomed).not.toHaveBeenCalled();
        expect(button('Pan').disabled).toBe(true);
        // A drag zooms.
        svg().dispatchEvent(pointer('pointerdown', scene.columns[2]!.pos, y));
        document.dispatchEvent(pointer('pointermove', scene.columns[5]!.pos, y));
        await tick();
        expect(svg().querySelector('.vt-chart-selection')).not.toBeNull();
        expect(svg().closest('.vt-chart')!.classList.contains('vt-chart-dragging')).toBe(true);
        document.dispatchEvent(pointer('pointerup', scene.columns[5]!.pos, y));
        await settle();
        expect(svg().querySelector('.vt-chart-selection')).toBeNull();
        expect(zoomed.mock.calls[0]![0].min).toBeCloseTo(2, 5);
        expect(zoomed.mock.calls[0]![0].max).toBeCloseTo(5, 5);
        expect(chart.scene().columns.filter((c) => c.visible).map((c) => c.index)).toEqual([2, 3, 4, 5]);
        // Now the pan tool works, and a drag in pan mode slides the window.
        expect(button('Pan').disabled).toBe(false);
        button('Pan').click();
        await tick();
        expect(document.querySelector('.vt-chart-mode-pan')).not.toBeNull();
        scene = chart.scene();
        svg().dispatchEvent(pointer('pointerdown', scene.plot.x + scene.plot.width / 2, y));
        document.dispatchEvent(pointer('pointermove', scene.plot.x + scene.plot.width / 2 - scene.plot.width / 3, y));
        document.dispatchEvent(pointer('pointerup', scene.plot.x + scene.plot.width / 2 - scene.plot.width / 3, y));
        await settle();
        const panned = zoomed.mock.calls.at(-1)![0];
        expect(panned.min).toBeCloseTo(3, 5);
        expect(panned.max - panned.min).toBeCloseTo(3, 5);
        button('Reset zoom').click();
        await settle();
        expect(zoomed).toHaveBeenLastCalledWith(null);
        expect(button('Reset zoom').disabled).toBe(true);
        expect(button('Pan').disabled).toBe(true);
        expect(button('Zoom by selection').getAttribute('aria-pressed')).toBe('true');
        expect(document.querySelector('.vt-chart-mode-pan')).toBeNull();
        // The toolbar's zoom buttons, and the keyboard's.
        button('Zoom in').click();
        await settle();
        expect(button('Zoom out').disabled).toBe(false);
        chart.resetZoom();
        await settle();
        expect(button('Zoom out').disabled).toBe(true);
    });

    it('leaves the wheel to the page unless asked, and then wants Ctrl', async () => {
        const wheel = (ctrlKey: boolean) => new WheelEvent('wheel', { deltaY: -100, clientX: 200, clientY: 100, ctrlKey, cancelable: true, bubbles: true });
        const first = mount();
        const zoomedFirst = vi.fn();
        first.chart.on('zoomed', zoomedFirst);
        const plain = wheel(true);
        first.svg().dispatchEvent(plain);
        expect(plain.defaultPrevented).toBe(false);
        expect(zoomedFirst).not.toHaveBeenCalled();
        first.chart.destroy();
        const next = mount({ options: { ...quarter, chart: { zoom: { allowMouseWheelZoom: true } } } });
        const zoomed = vi.fn();
        next.chart.on('zoomed', zoomed);
        const without = wheel(false);
        next.svg().dispatchEvent(without);
        expect(without.defaultPrevented).toBe(false);
        const withCtrl = wheel(true);
        next.svg().dispatchEvent(withCtrl);
        expect(withCtrl.defaultPrevented).toBe(true);
        expect(zoomed).toHaveBeenCalled();
    });

    it('has a toolbar with a download menu button', async () => {
        const { button, chart } = mount();
        const toolbar = document.querySelector('[role="toolbar"]')!;
        expect(toolbar.getAttribute('aria-label')).toBe('Chart tools');
        expect([...toolbar.querySelectorAll('button')].map((b) => b.getAttribute('aria-label'))).toEqual(['Zoom in', 'Zoom out', 'Zoom by selection', 'Pan', 'Reset zoom', 'Download']);
        expect(toolbar.querySelectorAll('svg.vt-icon')).toHaveLength(6);
        const download = button('Download');
        expect(download.getAttribute('aria-haspopup')).toBe('menu');
        expect(download.getAttribute('aria-expanded')).toBe('false');
        download.focus();
        await press(download, 'ArrowDown');
        const menu = document.querySelector('[role="menu"]')!;
        expect(menu.parentElement).toBe(document.body);
        expect(menu.classList.contains('vt-chart-menu')).toBe(true);
        expect(download.getAttribute('aria-expanded')).toBe('true');
        expect(download.getAttribute('aria-controls')).toBe(menu.id);
        expect([...menu.querySelectorAll('[role="menuitem"]')].map((m) => m.textContent)).toEqual(['Download SVG', 'Download PNG', 'Download CSV']);
        expect(document.activeElement?.textContent).toBe('Download SVG');
        await press(document.activeElement!, 'ArrowUp');
        expect(document.activeElement?.textContent).toBe('Download CSV');
        await press(document.activeElement!, 'Home');
        expect(document.activeElement?.textContent).toBe('Download SVG');
        await expectNoA11yViolations();
        await press(document.activeElement!, 'Escape');
        expect(document.querySelector('[role="menu"]')).toBeNull();
        expect(document.activeElement).toBe(download);
        expect(download.getAttribute('aria-expanded')).toBe('false');
        // A click opens it; a press outside closes it.
        download.click();
        expect(document.querySelector('[role="menu"]')).not.toBeNull();
        document.body.dispatchEvent(pointer('pointerdown', 0, 0));
        expect(document.querySelector('[role="menu"]')).toBeNull();
        // What the menu's items save.
        expect(chart.exportCsv()).toBe('category,Sales,Costs\nJan,3,2\nFeb,7,4\nMar,12,5');
        expect(chart.exportSvg()).toContain('<svg');
    });

    it('walks the data with the arrow keys and reads each point', async () => {
        const { chart, canvas, status } = mount();
        const select = vi.fn();
        chart.on('dataPointSelection', select);
        canvas().focus();
        await press(canvas(), 'ArrowRight');
        expect(status()).toBe('Sales, Jan: 3. 1 of 3');
        await press(canvas(), 'ArrowRight');
        await press(canvas(), 'ArrowDown');
        expect(status()).toBe('Costs, Feb: 4. 2 of 3');
        expect(document.querySelector('.vt-chart-focus-ring')).not.toBeNull();
        expect(document.querySelector('.vt-chart-tooltip')?.textContent).toContain('Feb');
        await press(canvas(), 'End');
        expect(status()).toBe('Costs, Mar: 5. 3 of 3');
        await press(canvas(), 'Home');
        expect(status()).toBe('Costs, Jan: 2. 1 of 3');
        await press(canvas(), 'Enter');
        expect(select).toHaveBeenCalledWith(expect.objectContaining({ seriesIndex: 1, dataPointIndex: 0, value: 2 }));
        await press(canvas(), '+');
        expect(status()).toBe('Showing Jan to Mar');
        await press(canvas(), '0');
        await press(canvas(), 'Escape');
        expect(document.querySelector('.vt-chart-focus-ring')).toBeNull();
        canvas().dispatchEvent(new FocusEvent('blur'));
        await tick();
        expect(document.querySelector('.vt-chart-tooltip')).toBeNull();
    });

    it('draws a donut with its total, and selects a slice from the keyboard', async () => {
        const { svg, chart, canvas, status } = mount({ type: 'donut', series: [30, 10, 60], options: { labels: ['Rent', 'Food', 'Other'], chart: { animations: { enabled: false } } } });
        const select = vi.fn();
        chart.on('dataPointSelection', select);
        expect(svg().querySelectorAll('.vt-chart-slice')).toHaveLength(3);
        expect(svg().querySelector('.vt-chart-center-label')?.textContent).toBe('Total');
        expect(svg().querySelector('.vt-chart-center-value')?.textContent).toBe('100');
        expect([...svg().querySelectorAll('.vt-chart-data-label')].map((t) => t.textContent)).toEqual(['30%', '10%', '60%']);
        expect(document.querySelector('[role="toolbar"] [aria-label="Zoom in"]')).toBeNull();
        canvas().focus();
        await press(canvas(), 'ArrowRight');
        expect(status()).toBe('Rent, Rent: 30. 1 of 1');
        expect(svg().querySelector('.vt-chart-center-label')?.textContent).toBe('Rent');
        await press(canvas(), ' ');
        expect(select).toHaveBeenCalledWith(expect.objectContaining({ seriesIndex: 0, selected: true }));
        expect(svg().querySelector('.vt-chart-slice.vt-chart-selected')).not.toBeNull();
        await expectNoA11yViolations();
    });

    it('shares the crosshair and the zoom across a group', async () => {
        const top = mount({ options: { ...quarter, chart: { group: 'pair', id: 'top', animations: { enabled: false } } } });
        const bottom = mount({ type: 'bar', options: { ...quarter, chart: { group: 'pair', id: 'bottom', animations: { enabled: false } } } });
        const pos = Number(top.svg().querySelector('.vt-chart-axis-bottom .vt-chart-axis-label')!.getAttribute('x'));
        top.svg().dispatchEvent(pointer('pointermove', pos, 40));
        await tick();
        expect(bottom.svg().querySelector('.vt-chart-crosshair-band')).not.toBeNull();
        top.svg().dispatchEvent(pointer('pointerleave', 0, 0));
        await tick();
        expect(bottom.svg().querySelector('.vt-chart-crosshair-band')).toBeNull();
        const zoomed = vi.fn();
        bottom.chart.on('zoomed', zoomed);
        top.chart.zoomX(1, 2);
        expect(zoomed).toHaveBeenCalledWith({ min: 1, max: 2 });
        await settle();
        expect(bottom.button('Reset zoom')).toBeDefined();
    });

    it('drives its target from a brush', async () => {
        const data = Array.from({ length: 20 }, (_, i) => i * 2);
        const target = mount({ series: [{ name: 'A', data }], options: { chart: { id: 'main', toolbar: { show: false }, animations: { enabled: false } } } });
        const zoomed = vi.fn();
        target.chart.on('zoomed', zoomed);
        const brush = mount({ type: 'area', series: [{ name: 'A', data }], height: 120, options: { chart: { brush: { enabled: true, target: 'main' }, selection: { enabled: true, xaxis: { min: 5, max: 10 } }, animations: { enabled: false } } } });
        const selection = vi.fn();
        brush.chart.on('selection', selection);
        await settle();
        expect(zoomed).toHaveBeenCalledWith({ min: 5, max: 10 });
        expect(brush.svg().querySelectorAll('.vt-chart-brush-shade')).toHaveLength(2);
        expect(brush.el.querySelector('[role="toolbar"]')).toBeNull();
        // Dragging the window moves the target.
        const scene = brush.chart.scene();
        const inside = scene.plot.x + ((7.5 - scene.xDomain.view[0]) / (scene.xDomain.view[1] - scene.xDomain.view[0])) * scene.plot.width;
        brush.svg().dispatchEvent(pointer('pointerdown', inside, scene.plot.y + 10));
        document.dispatchEvent(pointer('pointermove', inside + scene.plot.width / 19, scene.plot.y + 10));
        document.dispatchEvent(pointer('pointerup', inside + scene.plot.width / 19, scene.plot.y + 10));
        await settle();
        const last = zoomed.mock.calls.at(-1)![0];
        expect(last.min).toBeCloseTo(6, 5);
        expect(last.max).toBeCloseTo(11, 5);
        expect(selection).toHaveBeenCalled();
    });

    it('renders every type, the sparkline and the empty state', async () => {
        const cases: [ChartType, ChartSeries, ChartOptions?][] = [
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
            const { svg, chart } = mount({ type, series, options: { ...options, chart: { ...options?.chart, animations: { enabled: false } } } });
            expect(svg().querySelectorAll('path, rect').length, type).toBeGreaterThan(2);
            expect(document.getElementById(svg().getAttribute('aria-labelledby')!)!.textContent, type).not.toContain('No data');
            if (type === 'heatmap' || type === 'radar') await expectNoA11yViolations();
            chart.destroy();
        }
        const spark = mount({ series: [{ name: 'A', data: [1, 3, 2] }], options: { chart: { sparkline: { enabled: true } } } });
        expect(spark.el.classList.contains('vt-chart-sparkline')).toBe(true);
        expect(document.querySelector('.vt-chart-axis-label')).toBeNull();
        expect(document.querySelector('.vt-chart-legend')).toBeNull();
        expect(document.querySelector('[role="toolbar"]')).toBeNull();
        spark.chart.destroy();
        mount({ series: [] });
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
        const { svg } = mount({ type: 'bar', options });
        expect([...svg().querySelectorAll('.vt-chart-axis-left .vt-chart-axis-label')].map((t) => t.textContent)).toContain('$10.00');
        expect(svg().querySelector('.vt-chart-annotation-label')?.textContent).toBe('Goal');
        const table = document.querySelector('table')!;
        expect(table.querySelector('caption')?.textContent).toBe('Data of Chart');
        expect([...table.querySelectorAll('tbody tr')].map((r) => r.textContent)).toEqual(['Jan$3.00$2.00', 'Feb$7.00$4.00', 'Mar$12.00$5.00']);
        await expectNoA11yViolations();
    });

    it('lets hooks replace the tooltip, a legend entry and the empty state', async () => {
        const { chart, svg, el } = mount({
            hooks: {
                tooltip: {
                    render: ({ title, rows }) => {
                        const strong = document.createElement('strong');
                        strong.textContent = `${title}: ${rows.map((r) => r.value).join('/')}`;
                        return strong;
                    }
                },
                legend: { item: ({ name, hidden }) => `${name}${hidden ? ' (off)' : ''}` }
            }
        });
        expect([...el.querySelectorAll('.vt-chart-legend-text')].map((t) => t.textContent)).toEqual(['Sales', 'Costs']);
        const scene = chart.scene();
        svg().dispatchEvent(pointer('pointermove', scene.columns[2]!.pos, scene.plot.y + 5));
        await tick();
        expect(el.querySelector('.vt-chart-tooltip')!.innerHTML).toBe('<strong>Mar: 12/5</strong>');
        chart.hideSeries('Costs');
        await settle();
        expect([...el.querySelectorAll('.vt-chart-legend-text')].map((t) => t.textContent)).toEqual(['Sales', 'Costs (off)']);
        // A string is text, never markup.
        const empty = mount({ series: [], hooks: { noData: { render: () => '<b>Nothing</b>' } } });
        expect(empty.el.querySelector('.vt-chart-no-data')!.innerHTML).toBe('&lt;b&gt;Nothing&lt;/b&gt;');
    });

    it('drops its classes when unstyled, and takes pass-through and replacement classes', async () => {
        const onClick = vi.fn();
        const { el, svg, chart } = mount({
            unstyled: true,
            pt: { root: { class: 'card', 'data-kind': 'sales' }, legendItem: ({ state }) => ({ class: (state as { hidden: boolean }).hidden ? 'off' : 'on', onClick }), canvas: 'plot' },
            classes: { svg: 'picture' }
        });
        expect(el.className).toBe('card');
        expect(el.getAttribute('data-kind')).toBe('sales');
        expect(el.querySelector('.vt-chart-body')).toBeNull();
        expect(el.querySelector('[aria-roledescription]')!.className).toBe('plot');
        expect(svg().getAttribute('class')).toBeNull();
        const legend = [...el.querySelectorAll('ul button')];
        expect(legend.map((b) => b.className)).toEqual(['on', 'on']);
        (legend[0] as HTMLButtonElement).click();
        await settle();
        expect(onClick).toHaveBeenCalled();
        expect(legend.map((b) => b.className)).toEqual(['off', 'on']);
        chart.update({ unstyled: false });
        expect(el.className).toBe('vt-chart vt-chart-with-toolbar card');
        expect(svg().getAttribute('class')).toBe('picture');
    });

    it('follows the locale', async () => {
        const { chart, svg, button } = mount();
        chart.setLocale(ptBR);
        expect(document.getElementById(svg().getAttribute('aria-labelledby')!)!.textContent).toMatch(/^Gráfico de Linhas, 2 séries/);
        expect(button('Baixar')).toBeDefined();
    });

    it('applies an update only when something changed, and leaves nothing behind when destroyed', async () => {
        const host = document.createElement('div');
        host.id = 'mount';
        host.setAttribute('style', 'margin: 4px');
        const { chart, el, svg } = mount({}, host);
        await settle();
        const mutations: MutationRecord[] = [];
        const watcher = new MutationObserver((list) => mutations.push(...list));
        watcher.observe(el, { subtree: true, childList: true, attributes: true, characterData: true });
        // Equal content in new objects: nothing to do.
        chart.update({ series: JSON.parse(JSON.stringify(sales)), options: JSON.parse(JSON.stringify(quarter)), type: 'line' });
        await settle();
        expect(watcher.takeRecords().concat(mutations)).toEqual([]);
        // A change in place counts, and only the changed text is touched.
        const options: ChartOptions = JSON.parse(JSON.stringify(quarter));
        chart.update({ options });
        options.xaxis!.categories = ['Q1', 'Q2', 'Q3'];
        const line = svg().querySelector('.vt-chart-series');
        chart.update({ options });
        await settle();
        expect([...svg().querySelectorAll('.vt-chart-axis-bottom .vt-chart-axis-label')].map((t) => t.textContent)).toEqual(['Q1', 'Q2', 'Q3']);
        expect(svg().querySelector('.vt-chart-series')).toBe(line);
        chart.update({ series: [{ name: 'Sales', data: [1, 2, 3, 4] }], height: 200 });
        await settle();
        expect(el.style.height).toBe('200px');
        expect(svg().querySelectorAll('.vt-chart-line')).toHaveLength(1);
        watcher.disconnect();

        // Destroy: no children, the element's own attributes back, and no listener left.
        const add = vi.spyOn(document, 'addEventListener');
        const remove = vi.spyOn(document, 'removeEventListener');
        const zoomed = vi.fn();
        chart.on('zoomed', zoomed);
        chart.update({ options: { ...quarter, chart: { group: 'solo', animations: { enabled: false } } } });
        chart.destroy();
        expect(el.childNodes).toHaveLength(0);
        expect(el.getAttribute('style')).toBe('margin: 4px');
        expect(el.getAttribute('class')).toBeNull();
        expect([...el.attributes].map((a) => a.name)).toEqual(['id', 'style']);
        chartBus.publish(groupChannel('solo'), { kind: 'window', source: 'other', window: [0, 1] });
        expect(zoomed).not.toHaveBeenCalled();
        expect(add).not.toHaveBeenCalled();
        add.mockRestore();
        remove.mockRestore();
        // Destroying twice, or updating afterwards, does nothing.
        chart.destroy();
        chart.update({ type: 'bar' });
        await settle();
        expect(el.childNodes).toHaveLength(0);
    });

    it('lets go of the document while a drag is in progress when destroyed', async () => {
        const { chart, svg } = mount({ series: [{ name: 'A', data: [1, 2, 3, 4, 5, 6] }] });
        const scene = chart.scene();
        svg().dispatchEvent(pointer('pointerdown', scene.columns[1]!.pos, scene.plot.y + 5));
        const remove = vi.spyOn(document, 'removeEventListener');
        chart.destroy();
        expect(remove.mock.calls.map((c) => c[0]).sort()).toEqual(['keydown', 'pointercancel', 'pointermove', 'pointerup', 'touchmove']);
        remove.mockRestore();
    });

    it('opens the tooltip away from the data being read towards', async () => {
        const { chart, svg } = mount();
        const scene = chart.scene();
        const offsetOf = () => {
            const tip = document.querySelector<HTMLElement>('.vt-chart-tooltip')!;
            return Number(/translate\((-?\d+(?:\.\d+)?)px/.exec(tip.style.transform)![1]);
        };

        // In the left half the panel opens to the right of the column; in the
        // right half to its left, over what has been read rather than over the
        // points the eye is travelling towards.
        const first = scene.columns[0]!;
        svg().dispatchEvent(pointer('pointermove', first.pos, scene.plot.y + 20));
        await tick();
        expect(offsetOf()).toBeGreaterThan(first.pos);

        const last = scene.columns[scene.columns.length - 1]!;
        svg().dispatchEvent(pointer('pointermove', last.pos, scene.plot.y + 20));
        await tick();
        expect(offsetOf()).toBeLessThan(last.pos);
    });
});
