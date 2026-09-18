import { emptyScene, fonts, measurer, seriesColor, sizeToPx, titles } from './common';
import { chartFormatter } from './format';
import { categoriesOf } from './series';
import type { ChartScene, SceneBar, SceneInput, SceneLabel } from './scene';

/**
 * Stages of a process, each as wide as its share of the first. It is not a
 * cartesian chart — there is no scale, and the only quantity is the width — so
 * it is laid out here rather than bent into the bar path.
 *
 * Each stage is a trapezoid from its own width to the next one's, which is what
 * makes the slope read as a fall rather than as a stack of bars. `neck` sets
 * how wide the last stage is drawn: `'0%'` narrows to a point.
 */
export function buildFunnel(input: SceneInput): ChartScene {
    const { options: o, series, width, height } = input;
    const base = emptyScene(input);
    const visible = series.filter((s) => !input.hidden.has(s.index));
    // One series read down, or a series per stage: both arrive here, and a
    // funnel only ever draws one value per stage.
    // The stages are named by `labels` or by `xaxis.categories` when they are
    // given, and by the points' own x otherwise.
    const names = categoriesOf(visible, o.xaxis?.categories ?? (o.labels?.length ? o.labels : undefined));
    const values = visible.flatMap((s) => s.points.map((p) => ({ series: s.index, index: p.index, name: s.points.length > 1 ? String(names[p.index] ?? p.x) : s.name, value: p.y })));
    const points = values.filter((v) => v.value !== null && v.value >= 0) as { series: number; index: number; name: string; value: number }[];
    if (!points.length) return base;

    const font = fonts(input);
    const t = titles(input);
    const opts = o.plotOptions?.funnel ?? {};
    const gap = Math.max(0, opts.gap ?? 4);
    const neck = Math.max(0, Math.min(1, Number.parseFloat(String(opts.neck ?? '0%')) / 100 || 0));
    const pad = 10;
    const plot = { x: pad, y: t.height + pad, width: Math.max(10, width - pad * 2), height: Math.max(10, height - t.height - pad * 2) };

    const top = points[0]!.value || 1;
    const each = (plot.height - gap * (points.length - 1)) / points.length;
    const labelSize = sizeToPx(o.dataLabels?.style?.fontSize, font.label);
    const measure = measurer(input);
    const format = chartFormatter(o.dataLabels?.formatter, '{value}', input.locale);

    /** How wide a stage is drawn: its share of the first, never below the neck. */
    const widthAt = (value: number) => plot.width * (neck + (1 - neck) * Math.max(0, Math.min(1, value / top)));

    const bars: SceneBar[] = [];
    const labels: SceneLabel[] = [];
    points.forEach((p, i) => {
        const y = plot.y + i * (each + gap);
        const wTop = widthAt(p.value);
        // The stage narrows towards the next one, so the slope is the fall.
        const wBottom = widthAt(points[i + 1]?.value ?? p.value * neck);
        const cx = plot.x + plot.width / 2;
        const path = [
            `M${cx - wTop / 2} ${y}`,
            `L${cx + wTop / 2} ${y}`,
            `L${cx + wBottom / 2} ${y + each}`,
            `L${cx - wBottom / 2} ${y + each}`,
            'Z'
        ].join(' ');
        bars.push({
            series: p.series,
            index: p.index,
            column: i,
            path,
            x: cx - wTop / 2,
            y,
            width: wTop,
            height: each,
            color: seriesColor(o, undefined, i, points.length)
        });
        if (o.dataLabels?.enabled !== false) {
            const text = format(p.value, { seriesIndex: p.series, dataPointIndex: p.index, seriesName: p.name, percent: (p.value / top) * 100 });
            // A narrow stage cannot hold its own label, so the label steps
            // outside it rather than running over the edges.
            const inside = measure(text, labelSize) + 12 < Math.min(wTop, wBottom);
            labels.push({
                x: inside ? cx : cx + wTop / 2 + 8,
                y: y + each / 2 + labelSize * 0.35,
                text,
                anchor: inside ? 'middle' : 'start',
                onFill: inside,
                style: { ...o.dataLabels?.style, fontSize: `${labelSize}px` }
            });
        }
    });

    return {
        ...base,
        // `base` is the empty scene, which is what it says it is until there
        // are stages in it.
        empty: false,
        plot,
        marks: [{ kind: 'bar', series: points[0]!.series, name: '', color: '', opacity: 1, bars, labels }],
        // The stages are the columns, down the plot rather than across it, so
        // the tooltip, the keyboard and the summary read them in order.
        columns: points.map((p, i) => ({ index: i, pos: plot.y + i * (each + gap) + each / 2, half: each / 2, label: p.name, value: p.value, visible: true })),
        data: points.map((p, i) => ({
            series: p.series,
            index: p.index,
            column: i,
            x: plot.x + plot.width / 2,
            y: plot.y + i * (each + gap) + each / 2,
            value: p.value,
            text: format(p.value, { seriesIndex: p.series, dataPointIndex: p.index, seriesName: p.name, percent: (p.value / top) * 100 }),
            label: p.name,
            color: seriesColor(o, undefined, i, points.length),
            // The share of the first stage is the number a funnel is read for.
            extra: i > 0 ? [{ name: p.name, text: `${Math.round((p.value / top) * 100)}%` }] : undefined
        })),
        visibleSeries: [...new Set(points.map((p) => p.series))]
    };
}
