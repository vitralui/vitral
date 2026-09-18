import type { ResolvedChartOptions } from './options';
import type { ChartScene, SceneInput, SceneText } from './scene';
import type { NormalizedSeries } from './series';
import type { ChartTitle } from './types';

/** Fallback text width: good enough to lay out axes when nothing can measure. */
export const estimateText = (text: string, fontSize: number) => text.length * fontSize * 0.58;

export function measurer(input: SceneInput) {
    const measure = input.measure ?? estimateText;
    return (text: string, size: number) => measure(text, size);
}

export function fonts(input: SceneInput) {
    return { label: input.fonts?.label ?? 12, title: input.fonts?.title ?? 15, subtitle: input.fonts?.subtitle ?? 12, dataLabel: input.fonts?.dataLabel ?? 11 };
}

const px = (value: string | undefined, fallback: number) => {
    if (!value) return fallback;
    const n = parseFloat(value);
    if (Number.isNaN(n)) return fallback;
    return value.endsWith('rem') || value.endsWith('em') ? n * 16 : n;
};

export { px as sizeToPx };

/** A series' colour: its own, a monochrome shade, or the palette's. */
export function seriesColor(options: ResolvedChartOptions, series: NormalizedSeries | undefined, index: number, count = 1): string {
    if (series?.color) return series.color;
    const mono = options.theme?.monochrome;
    if (mono?.enabled) {
        const share = count > 1 ? index / (count - 1) : 0;
        const intensity = mono.shadeIntensity ?? 0.65;
        const target = mono.shadeTo === 'dark' ? 'black' : 'white';
        return `color-mix(in srgb, ${mono.color ?? 'var(--vt-chart-1)'} ${Math.round(100 - share * intensity * 100)}%, ${target})`;
    }
    const colors = options.colors?.length ? options.colors : ['var(--vt-chart-1)'];
    return colors[index % colors.length]!;
}

/** The title and subtitle, and how much height they take. */
export function titles(input: SceneInput): { title?: SceneText; subtitle?: SceneText; height: number } {
    const o = input.options;
    if (o.chart?.sparkline?.enabled) return { height: 0 };
    const f = fonts(input);
    let y = 0;
    const place = (t: ChartTitle | undefined, size: number): SceneText | undefined => {
        if (!t?.text) return undefined;
        const fontSize = px(t.style?.fontSize, size);
        const align = t.align ?? 'left';
        const x = align === 'left' ? 0 : align === 'right' ? input.width : input.width / 2;
        y += fontSize * 1.2;
        const text: SceneText = {
            x: x + (t.offsetX ?? 0),
            y: y + (t.offsetY ?? 0) - fontSize * 0.25,
            text: t.text,
            anchor: align === 'left' ? 'start' : align === 'right' ? 'end' : 'middle',
            style: t.style
        };
        y += t.margin ?? 4;
        return text;
    };
    const title = place(o.title, f.title);
    const subtitle = place(o.subtitle, f.subtitle);
    return { title, subtitle, height: y ? y + 4 : 0 };
}

export function emptyScene(input: SceneInput, extra: Partial<ChartScene> = {}): ChartScene {
    const t = titles(input);
    return {
        type: input.type,
        width: input.width,
        height: input.height,
        plot: { x: 0, y: t.height, width: input.width, height: Math.max(0, input.height - t.height) },
        horizontal: false,
        title: t.title,
        subtitle: t.subtitle,
        grid: { show: false, position: 'back', dash: 0, horizontal: [], vertical: [], bands: [] },
        axes: [],
        marks: [],
        annotations: { back: [], front: [] },
        columns: [],
        data: [],
        visibleSeries: [],
        xDomain: { full: [0, 1], view: [0, 1], kind: 'category' },
        xInvert: () => 0,
        yDomains: [],
        yInvert: () => 0,
        empty: true,
        formatX: (v) => String(v),
        formatY: (v) => (v === null ? '' : String(v)),
        ...extra
    };
}

/** A percentage size option (`'70%'`) as a fraction. */
export function fraction(value: string | undefined, fallback: number): number {
    if (!value) return fallback;
    const n = parseFloat(value);
    if (Number.isNaN(n)) return fallback;
    return value.trim().endsWith('%') ? Math.max(0, Math.min(1, n / 100)) : n;
}
