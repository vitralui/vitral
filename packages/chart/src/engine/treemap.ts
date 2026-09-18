import { emptyScene, fonts, measurer, seriesColor, sizeToPx, titles } from './common';
import { chartFormatter } from './format';
import type { ChartScene, SceneCell, SceneDatum, SceneInput } from './scene';

export interface TreemapBox {
    x: number;
    y: number;
    width: number;
    height: number;
}

interface Item extends TreemapBox {
    value: number;
}

/**
 * The squarified treemap of Bruls, Huizing and van Wijk: boxes are laid in
 * rows across the shorter side, and a row is closed as soon as adding another
 * box would make its worst aspect ratio worse. Long thin slivers are what make
 * a treemap unreadable, and this is the layout that avoids them without
 * reordering the data.
 *
 * `values` must be positive and are taken in the order given; areas come out
 * proportional to them, filling the rectangle exactly.
 */
export function squarify(values: number[], rect: TreemapBox): TreemapBox[] {
    const out: TreemapBox[] = values.map(() => ({ x: rect.x, y: rect.y, width: 0, height: 0 }));
    const items: Item[] = values.map((value, i) => ({ value, x: i, y: 0, width: 0, height: 0 }));
    const total = values.reduce((a, b) => a + Math.max(0, b), 0);
    if (!(total > 0) || rect.width <= 0 || rect.height <= 0) return out;

    // Areas in pixels, so a row's height falls out of its total directly.
    const scale = (rect.width * rect.height) / total;
    const queue = items.filter((i) => i.value > 0).map((i) => ({ index: i.x, area: i.value * scale }));
    let free = { ...rect };
    let row: { index: number; area: number }[] = [];

    /** The worst aspect ratio in a row of this total area, laid along `side`. */
    const worst = (areas: number[], side: number) => {
        if (!areas.length) return Infinity;
        const sum = areas.reduce((a, b) => a + b, 0);
        if (sum <= 0 || side <= 0) return Infinity;
        const max = Math.max(...areas);
        const min = Math.min(...areas);
        const side2 = side * side;
        const sum2 = sum * sum;
        return Math.max((side2 * max) / sum2, sum2 / (side2 * min));
    };

    const place = () => {
        if (!row.length) return;
        const sum = row.reduce((a, b) => a + b.area, 0);
        const vertical = free.width >= free.height;
        // The row runs along the shorter side, and is as deep as its area needs.
        const depth = vertical ? sum / free.height : sum / free.width;
        let along = vertical ? free.y : free.x;
        for (const cell of row) {
            const length = sum > 0 ? (cell.area / sum) * (vertical ? free.height : free.width) : 0;
            out[cell.index] = vertical ? { x: free.x, y: along, width: depth, height: length } : { x: along, y: free.y, width: length, height: depth };
            along += length;
        }
        if (vertical) free = { x: free.x + depth, y: free.y, width: Math.max(0, free.width - depth), height: free.height };
        else free = { x: free.x, y: free.y + depth, width: free.width, height: Math.max(0, free.height - depth) };
        row = [];
    };

    for (const cell of queue) {
        const side = Math.min(free.width, free.height);
        const areas = row.map((r) => r.area);
        if (row.length && worst([...areas, cell.area], side) > worst(areas, side)) place();
        row.push(cell);
    }
    place();
    return out;
}

/**
 * A treemap: every box is a value, and its area is what says how big that
 * value is. Each series is a group — its boxes take its colour — and a chart
 * of one series colours its boxes by rank instead, since a single colour would
 * say nothing.
 */
export function buildTreemap(input: SceneInput): ChartScene {
    const { options: o, locale, width, height } = input;
    const base = emptyScene(input);
    const visible = input.series.filter((s) => !input.hidden.has(s.index));
    const boxes = visible.flatMap((s) =>
        s.points.filter((p) => p.y !== null && p.y > 0).map((p) => ({ series: s.index, index: p.index, name: String(p.x), group: s.name, value: p.y as number, fillColor: p.fillColor }))
    );
    if (!boxes.length) return base;

    const t = titles(input);
    const font = fonts(input);
    const pad = 2;
    const plot = { x: pad, y: t.height + pad, width: Math.max(10, width - pad * 2), height: Math.max(10, height - t.height - pad * 2) };
    // Biggest first, which is what the layout is for: it fills from the corner
    // and the small boxes end up together rather than scattered.
    const order = boxes.map((_, i) => i).sort((a, b) => boxes[b]!.value - boxes[a]!.value);
    const laid = squarify(
        order.map((i) => boxes[i]!.value),
        plot
    );

    const labelSize = sizeToPx(o.dataLabels?.style?.fontSize, font.dataLabel);
    const measure = measurer(input);
    const format = chartFormatter(o.dataLabels?.formatter, '{seriesName}', locale);
    const valueFormat = chartFormatter(o.tooltip?.y?.formatter, '{value}', locale);
    const total = boxes.reduce((sum, b) => sum + b.value, 0);
    const distributed = visible.length === 1 || !!o.plotOptions?.treemap?.distributed;
    const gap = o.stroke?.show === false ? 0 : (o.stroke?.width as number | undefined) ?? 2;
    const radius = o.plotOptions?.treemap?.radius ?? 2;

    const cells: SceneCell[] = [];
    const data: SceneDatum[] = [];
    order.forEach((box, k) => {
        const b = boxes[box]!;
        const rect = laid[k]!;
        const color = b.fillColor ?? (distributed ? seriesColor(o, undefined, k, order.length) : seriesColor(o, visible.find((s) => s.index === b.series), b.series, visible.length));
        const context = { seriesIndex: b.series, dataPointIndex: b.index, seriesName: b.name, percent: (b.value / total) * 100 };
        const text = format(b.value, context);
        cells.push({
            series: b.series,
            index: b.index,
            column: box,
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height,
            radius,
            color,
            level: 1,
            stroke: gap > 0,
            // A box too small for its name is left blank rather than clipped.
            label:
                o.dataLabels?.enabled !== false && measure(text, labelSize) + 10 < rect.width && rect.height > labelSize * 1.8
                    ? { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2, text, anchor: 'middle', baseline: 'middle', style: { ...o.dataLabels?.style, fontSize: `${labelSize}px` }, onFill: true }
                    : undefined
        });
        data.push({
            series: b.series,
            index: b.index,
            column: box,
            x: rect.x + rect.width / 2,
            y: rect.y + rect.height / 2,
            value: b.value,
            text: valueFormat(b.value, context),
            label: b.name,
            color,
            extra: b.group && b.group !== b.name ? [{ name: locale.chart.category, text: b.group }] : undefined
        });
    });

    return {
        ...base,
        empty: false,
        plot,
        heatmap: { kind: 'heatmap', cells, rows: [], strokeWidth: gap },
        columns: cells.map((c, i) => ({ index: c.column, pos: c.x + c.width / 2, half: c.width / 2, label: data[i]!.label, value: data[i]!.value ?? 0, visible: true })),
        data,
        visibleSeries: [...new Set(boxes.map((b) => b.series))]
    };
}
