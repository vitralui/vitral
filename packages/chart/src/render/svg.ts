import { markerPath } from '../engine/geometry';
import type { ChartScene, SceneAnnotation, SceneFill, SceneLabel, SceneMarker, SceneText } from '../engine/scene';
import { mergeAttrs } from '../dom/attrs';
import { s, type Child, type Props } from '../dom/h';

// The picture: grid, axes, marks, heat map, pie, radar, annotations and data
// labels. Each is a function of the scene and the render state, returning the
// SVG elements to draw.

export interface RenderState {
    /** The column the pointer (or keyboard, or group) is on. */
    column: number;
    /** The series in focus: a legend entry hovered, or the keyboard's series. */
    focusSeries: number;
    hoverSeries: number;
    hoverIndex: number;
    selected: ReadonlySet<string>;
    animated: boolean;
}

export interface ViewContext {
    part: (name: string, state?: unknown) => Props;
    id: string;
    scene: ChartScene;
    state: RenderState;
}

export const round = (n: number) => Math.round(n * 100) / 100;
export const pointKey = (series: number, index: number) => `${series}:${index}`;

/** Attributes of an SVG `<text>` for a scene text. */
export function textAttrs(t: SceneText) {
    const baseline = t.baseline === 'hanging' ? 'hanging' : t.baseline === 'middle' ? 'central' : 'auto';
    return {
        x: round(t.x),
        y: round(t.y),
        'text-anchor': t.anchor,
        'dominant-baseline': baseline,
        transform: t.rotate ? `rotate(${t.rotate} ${round(t.x)} ${round(t.y)})` : undefined,
        style: { fontSize: t.style?.fontSize, fontWeight: t.style?.fontWeight as string | undefined, fontFamily: t.style?.fontFamily, fill: t.style?.color }
    };
}

const within = (v: number, a: number, b: number) => v >= a - 0.5 && v <= b + 0.5;

/** The grid: bands and lines. */
export function gridView({ scene, part }: ViewContext): Child {
    if (!scene.grid.show) return null;
    const plot = scene.plot;
    const gridStyle = { stroke: scene.grid.color, strokeDasharray: scene.grid.dash ? String(scene.grid.dash) : undefined };
    return s(
        'g',
        { 'aria-hidden': 'true' },
        scene.grid.bands.map((b, i) =>
            s('rect', mergeAttrs({ key: `b${i}` }, part('gridBand'), { x: round(b.x), y: round(b.y), width: round(b.width), height: round(b.height), style: { fill: b.color, opacity: b.opacity } }))
        ),
        scene.grid.horizontal.map((y, i) =>
            within(y, plot.y, plot.y + plot.height)
                ? s('line', mergeAttrs({ key: `h${i}` }, part('gridLine'), { x1: round(plot.x), x2: round(plot.x + plot.width), y1: round(y), y2: round(y), style: gridStyle }))
                : null
        ),
        scene.grid.vertical.map((x, i) =>
            within(x, plot.x, plot.x + plot.width)
                ? s('line', mergeAttrs({ key: `v${i}` }, part('gridLine'), { x1: round(x), x2: round(x), y1: round(plot.y), y2: round(plot.y + plot.height), style: gridStyle }))
                : null
        )
    );
}

/** The axes: lines, ticks, labels and titles. */
export function axesView({ scene, part }: ViewContext): Child {
    const plot = scene.plot;
    return s(
        'g',
        { 'aria-hidden': 'true' },
        scene.axes.map((axis, a) => {
            const vertical = axis.side === 'left' || axis.side === 'right';
            const children: Child[] = [];
            if (vertical) {
                if (axis.line) children.push(s('line', mergeAttrs(part('axisLine'), { x1: round(axis.at), x2: round(axis.at), y1: round(plot.y), y2: round(plot.y + plot.height), style: { stroke: axis.color } })));
                axis.ticks.forEach((tick) => {
                    const inside = within(tick.pos, plot.y, plot.y + plot.height);
                    if (axis.tickMarks && inside)
                        children.push(
                            s('line', mergeAttrs(part('axisTick'), { x1: round(axis.at), x2: round(axis.at + (axis.side === 'left' ? -axis.tickLength : axis.tickLength)), y1: round(tick.pos), y2: round(tick.pos) }))
                        );
                    if (tick.label && inside) {
                        const t = textAttrs(tick.label);
                        children.push(s('text', { ...part('axisLabel'), ...t, style: { ...t.style, fill: tick.label.style?.color ?? axis.color } }, tick.label.text));
                    }
                });
            } else {
                if (axis.line) children.push(s('line', mergeAttrs(part('axisLine'), { x1: round(plot.x), x2: round(plot.x + plot.width), y1: round(axis.at), y2: round(axis.at), style: { stroke: axis.color } })));
                axis.ticks.forEach((tick) => {
                    const inside = within(tick.pos, plot.x, plot.x + plot.width);
                    if (axis.tickMarks && inside)
                        children.push(
                            s('line', mergeAttrs(part('axisTick'), { x1: round(tick.pos), x2: round(tick.pos), y1: round(axis.at), y2: round(axis.at + (axis.side === 'top' ? -axis.tickLength : axis.tickLength)) }))
                        );
                    if (tick.label && inside) children.push(s('text', { ...part('axisLabel'), ...textAttrs(tick.label) }, tick.label.text));
                });
            }
            if (axis.title) children.push(s('text', { ...part('axisTitle'), ...textAttrs(axis.title) }, axis.title.text));
            return s('g', { key: a, ...part('axis', { side: axis.side }) }, children);
        })
    );
}

/** A data label, with its optional background box sized from its text. */
export function labelView({ part }: ViewContext, l: SceneLabel, key?: string | number): Child {
    let box: Child = null;
    if (l.background) {
        const size = parseFloat(l.style?.fontSize ?? '') || 11;
        const width = l.text.length * size * 0.6 + l.background.padding * 2;
        const height = size + l.background.padding * 1.5;
        const x = l.anchor === 'start' ? l.x - l.background.padding : l.anchor === 'end' ? l.x - width + l.background.padding : l.x - width / 2;
        box = s('rect', { ...part('dataLabelBackground'), x: round(x), y: round(l.y - height / 2), width: round(width), height: round(height), rx: l.background.radius, style: { fill: l.background.color } });
    }
    const text = s('text', { key, ...part('dataLabel', { onFill: l.onFill }), ...textAttrs(l) }, l.text);
    return box ? [box, text] : text;
}

/** Lines, bands, ranges and points drawn behind or in front of the marks. */
export function annotationsView({ scene, part }: ViewContext, layer: 'back' | 'front'): Child {
    const list = scene.annotations[layer];
    if (!list.length) return null;
    const lineStyle = (a: SceneAnnotation) => ({ stroke: a.color, strokeDasharray: a.dash ? String(a.dash) : undefined });
    const labelBox = (a: SceneAnnotation) => {
        const l = a.label!;
        const size = parseFloat(l.style?.fontSize ?? '') || 11;
        const width = l.text.length * size * 0.6 + 10;
        const height = size + 6;
        const x = l.anchor === 'start' ? l.x - 5 : l.anchor === 'end' ? l.x - width + 5 : l.x - width / 2;
        const y = l.baseline === 'hanging' ? l.y - 3 : l.y - height + 3;
        return { x: round(x), y: round(y), width: round(width), height: round(height), rx: 3, style: { fill: l.fill, stroke: l.borderColor } };
    };
    return s(
        'g',
        { key: layer, 'aria-hidden': 'true' },
        list.map((a, i) => {
            let shape: Child = null;
            if (a.kind === 'yline') shape = s('line', { x1: round(a.x1), x2: round(a.x2), y1: round(a.y1), y2: round(a.y1), style: lineStyle(a) });
            else if (a.kind === 'xline') shape = s('line', { x1: round(a.x1), x2: round(a.x1), y1: round(a.y1), y2: round(a.y2), style: lineStyle(a) });
            else if (a.kind === 'yrange' || a.kind === 'xrange')
                shape = s('rect', { x: round(a.x1), y: round(a.y1), width: round(a.x2 - a.x1), height: round(a.y2 - a.y1), style: { fill: a.fill, fillOpacity: a.opacity } });
            else if (a.marker) shape = s('path', { d: markerPath(a.marker.shape, a.marker.x, a.marker.y, a.marker.size), style: { fill: a.marker.fill, stroke: a.marker.stroke, strokeWidth: a.marker.strokeWidth } });
            return s(
                'g',
                { key: i, ...part('annotation', { kind: a.kind }) },
                shape,
                a.label ? [s('rect', { ...part('annotationLabelBox'), ...labelBox(a) }), s('text', { ...part('annotationLabel'), ...textAttrs(a.label) }, a.label.text)] : null
            );
        })
    );
}

const markerD = (m: SceneMarker) => markerPath(m.shape, m.x, m.y, m.size);
const markerStyle = (m: SceneMarker) => ({ fill: m.fill, stroke: m.stroke, strokeWidth: m.strokeWidth });

/** Lines, areas, bars, lollipops, candles and points: the cartesian marks. */
export function marksView(c: ViewContext): Child[] {
    const { scene, state, part, id } = c;
    const dim = (series: number) => state.focusSeries >= 0 && state.focusSeries !== series;
    const gradientId = (series: number) => `${id}-fill-${series}`;
    const areaFill = (fill: SceneFill, series: number) => (fill.gradient ? `url(#${gradientId(series)})` : fill.color);
    const isHover = (series: number, column: number) => state.column === column && (state.hoverSeries < 0 || state.hoverSeries === series);
    const origin = scene.horizontal ? 'left center' : 'center bottom';

    const column = state.column;
    const hoverMarkers =
        column < 0
            ? []
            : scene.marks
                  .filter((m) => m.kind === 'line' && m.width > 0)
                  .flatMap((m) => {
                      const d = scene.data.find((x) => x.series === m.series && x.column === column && x.value !== null);
                      return d ? [{ series: m.series, x: d.x, y: d.y, color: m.color }] : [];
                  });

    const defs = s(
        'defs',
        { key: 'marks-defs' },
        scene.marks.map((m) =>
            m.kind === 'line' && m.fill?.gradient
                ? s(
                      'linearGradient',
                      { key: `g${m.series}`, id: gradientId(m.series), x1: 0, y1: 0, x2: m.fill.gradient.vertical ? 0 : 1, y2: m.fill.gradient.vertical ? 1 : 0 },
                      s('stop', { offset: `${m.fill.gradient.stops[0]}%`, style: { stopColor: m.fill.color, stopOpacity: m.fill.gradient.from } }),
                      s('stop', { offset: `${m.fill.gradient.stops[1]}%`, style: { stopColor: m.fill.color, stopOpacity: m.fill.gradient.to } })
                  )
                : null
        )
    );

    const series = s(
        'g',
        { key: 'marks', 'clip-path': `url(#${id}-clip)` },
        scene.marks.map((m) => {
            const key = `${m.kind}${m.series}`;
            if (m.kind === 'line') {
                return s(
                    'g',
                    { key, ...part('series', { kind: 'line', dim: dim(m.series) }), 'data-series': m.series },
                    m.area ? s('path', { ...part('area'), d: m.area, style: { fill: areaFill(m.fill!, m.series), fillOpacity: m.fill!.gradient ? 1 : m.fill!.opacity } }) : null,
                    m.path ? s('path', { ...part('line'), d: m.path, style: { stroke: m.color, strokeWidth: m.width, strokeDasharray: m.dash || undefined, strokeLinecap: m.cap } }) : null
                );
            }
            if (m.kind === 'bar') {
                return s(
                    'g',
                    mergeAttrs({ key }, part('series', { kind: scene.horizontal ? 'bar-horizontal' : 'bar', dim: dim(m.series) }), {
                        style: { opacity: m.opacity !== 1 ? m.opacity : undefined, '--vt-chart-origin': origin },
                        'data-series': m.series
                    }),
                    m.connectors ? s('path', mergeAttrs({ key: 'connectors' }, part('connector'), { d: m.connectors })) : null,
                    m.bars.map((b) => [
                        b.path
                            ? s(
                                  'path',
                                  mergeAttrs({ key: `b${b.index}` }, part('bar', { hover: isHover(b.series, b.column), selected: state.selected.has(pointKey(b.series, b.index)) }), {
                                      d: b.path,
                                      style: { fill: b.color },
                                      'data-series': b.series,
                                      'data-index': b.index
                                  })
                              )
                            : null,
                        b.stem
                            ? [
                                  s('line', mergeAttrs({ key: `s${b.index}` }, part('stem'), { x1: round(b.stem.x1), y1: round(b.stem.y1), x2: round(b.stem.x2), y2: round(b.stem.y2), style: { stroke: b.color, strokeWidth: b.stem.width } })),
                                  b.head ? s('path', mergeAttrs({ key: `h${b.index}` }, part('marker', { hover: isHover(b.series, b.column) }), { d: markerD(b.head), style: markerStyle(b.head) })) : null
                              ]
                            : null
                    ])
                );
            }
            if (m.kind === 'candle') {
                return s(
                    'g',
                    { key, ...part('series', { kind: 'candle', dim: dim(m.series) }), 'data-series': m.series },
                    m.candles.map((cd) =>
                        s(
                            'g',
                            { key: cd.index, ...part('candle', { hover: isHover(cd.series, cd.column), rising: cd.rising, hollow: cd.hollow }) },
                            s('line', mergeAttrs(part('wick'), { x1: round(cd.x + cd.width / 2), x2: round(cd.x + cd.width / 2), y1: round(cd.wick.y1), y2: round(cd.wick.y2), style: { stroke: cd.color } })),
                            // A box plot caps its whiskers and draws the median
                            // across the body; a candle has neither.
                            cd.caps
                                ? [cd.wick.y1, cd.wick.y2].map((y, k) =>
                                      s('line', mergeAttrs({ key: `c${k}` }, part('wick'), { x1: round(cd.x + cd.width * 0.25), x2: round(cd.x + cd.width * 0.75), y1: round(y), y2: round(y), style: { stroke: cd.color } }))
                                  )
                                : null,
                            // A box is drawn as an outline over a wash, so the
                            // median reads at full strength across it.
                            s('rect', { x: round(cd.x), y: round(cd.body.y), width: round(cd.width), height: round(cd.body.height), style: { fill: cd.color, fillOpacity: cd.median !== undefined ? 0.3 : undefined, stroke: cd.color } }),
                            cd.median !== undefined
                                ? s('line', mergeAttrs(part('median'), { x1: round(cd.x), x2: round(cd.x + cd.width), y1: round(cd.median), y2: round(cd.median), style: { stroke: cd.color } }))
                                : null
                        )
                    )
                );
            }
            return s(
                'g',
                { key, ...part('series', { kind: 'points', dim: dim(m.series) }), 'data-series': m.series },
                m.markers.map((p) =>
                    s('path', mergeAttrs({ key: p.index }, part('marker', { hover: state.hoverSeries === m.series && state.hoverIndex === p.index }), { d: markerD(p), style: { ...markerStyle(p), fillOpacity: m.opacity } }))
                )
            );
        })
    );

    const overlay = s(
        'g',
        { key: 'marks-over', 'aria-hidden': 'true' },
        scene.marks.map((m) =>
            m.kind === 'line' && m.markers.length
                ? s(
                      'g',
                      { key: `k${m.kind}${m.series}`, ...part('series', { kind: 'markers', dim: dim(m.series) }) },
                      m.markers.map((p, i) => s('path', mergeAttrs({ key: i }, part('marker'), { d: markerD(p), style: markerStyle(p) })))
                  )
                : null
        ),
        hoverMarkers.map((hm) =>
            s('path', mergeAttrs({ key: `h${hm.series}` }, part('marker', { hover: true }), { d: markerD({ x: hm.x, y: hm.y, size: 8, shape: 'circle', fill: hm.color, strokeWidth: 2 }), style: { fill: hm.color, strokeWidth: 2 } }))
        ),
        scene.marks.map((m) => (m.kind !== 'candle' ? m.labels.map((l, i) => labelView(c, l, `l${m.kind}${m.series}-${i}`)) : null))
    );

    return [defs, series, overlay];
}

/** Cells and their labels. */
export function heatmapView(c: ViewContext): Child {
    const { scene, state, part } = c;
    const heatmap = scene.heatmap!;
    const gap = heatmap.strokeWidth / 2;
    return s(
        'g',
        { key: 'heatmap', ...part('series', { kind: 'heatmap' }) },
        heatmap.cells.map((cell) =>
            s(
                'rect',
                mergeAttrs(
                    { key: `${cell.series}-${cell.column}` },
                    part('cell', { hover: state.hoverSeries === cell.series && state.column === cell.column, dim: state.focusSeries >= 0 && state.focusSeries !== cell.series }),
                    {
                        x: round(cell.x + gap),
                        y: round(cell.y + gap),
                        width: round(Math.max(0, cell.width - gap * 2)),
                        height: round(Math.max(0, cell.height - gap * 2)),
                        rx: cell.radius,
                        style: { fill: cell.color },
                        'data-series': cell.series,
                        'data-index': cell.column
                    }
                )
            )
        ),
        s('g', { key: 'labels', 'aria-hidden': 'true' }, heatmap.cells.map((cell) => (cell.label ? labelView(c, cell.label) : null)))
    );
}

export interface PieCenter {
    name: string;
    value: string;
    total: string;
}

/** Slices, their labels, and a donut's centre: the total, or the slice in focus. */
export function pieView(c: ViewContext, center: PieCenter | null, customCenter?: Child): Child {
    const { scene, state, part } = c;
    const pie = scene.pie!;
    const hovered = (series: number) => state.hoverSeries === series || state.focusSeries === series;
    const selected = (series: number) => state.selected.has(pointKey(series, 0));
    const pathOf = (sl: (typeof pie.slices)[number]) => (selected(sl.series) ? sl.selectedPath : hovered(sl.series) ? sl.hoverPath : sl.path);
    return s(
        'g',
        { key: 'pie', ...part('series', { kind: 'pie' }) },
        pie.donut && pie.background && pie.background !== 'transparent'
            ? s('circle', mergeAttrs(part('pieBackground'), { cx: round(pie.cx), cy: round(pie.cy), r: round(pie.inner), style: { fill: pie.background } }))
            : null,
        pie.slices.map((sl) =>
            s(
                'path',
                mergeAttrs({ key: `s${sl.series}` }, part('slice', { hover: hovered(sl.series), selected: selected(sl.series), dim: state.focusSeries >= 0 && state.focusSeries !== sl.series }), {
                    d: pathOf(sl),
                    style: { fill: sl.color, strokeWidth: pie.strokeWidth },
                    'data-series': sl.series,
                    'data-index': 0
                })
            )
        ),
        s(
            'g',
            { key: 'labels', 'aria-hidden': 'true' },
            pie.slices.map((sl) =>
                sl.label ? s('g', { key: `l${sl.series}`, transform: selected(sl.series) ? `translate(${round(sl.offset[0])} ${round(sl.offset[1])})` : undefined }, labelView(c, sl.label)) : null
            )
        ),
        pie.donut && center
            ? s(
                  'g',
                  { key: 'center', 'aria-hidden': 'true' },
                  customCenter ?? [
                      s('text', { ...part('centerLabel'), x: round(pie.cx), y: round(pie.cy - 4), 'text-anchor': 'middle' }, center.name),
                      s('text', { ...part('centerValue'), x: round(pie.cx), y: round(pie.cy + 4), 'text-anchor': 'middle', 'dominant-baseline': 'hanging' }, center.value)
                  ]
              )
            : null
    );
}

/** Rings, spokes, their labels, and a polygon per series. */
export function radarView(c: ViewContext): Child[] {
    const { scene, state, part, id } = c;
    const radar = scene.radar!;
    const spokeLine = state.column >= 0 ? radar.spokes[state.column] : undefined;
    return [
        s(
            'g',
            { key: 'radar-grid', 'aria-hidden': 'true' },
            radar.rings.map((r, i) =>
                s('path', mergeAttrs({ key: `r${i}` }, part('radarRing', { filled: !!r.fill }), { d: r.path, style: { fill: r.fill, stroke: r.fill ? undefined : radar.strokeColor, strokeWidth: radar.strokeWidth } }))
            ),
            radar.spokes.map((sp, i) =>
                s('line', mergeAttrs({ key: `s${i}` }, part('radarSpoke'), { x1: round(sp.x1), y1: round(sp.y1), x2: round(sp.x2), y2: round(sp.y2), style: { stroke: radar.connectorColor, strokeWidth: radar.strokeWidth } }))
            ),
            spokeLine ? s('line', { key: 'cross', ...part('crosshair'), x1: round(spokeLine.x1), y1: round(spokeLine.y1), x2: round(spokeLine.x2), y2: round(spokeLine.y2) }) : null,
            radar.axisLabels.map((l, i) => s('text', { key: `a${i}`, ...part('radarLabel'), ...textAttrs(l) }, l.text)),
            radar.tickLabels.map((l, i) => s('text', { key: `t${i}`, ...part('radarTick'), ...textAttrs(l) }, l.text))
        ),
        s(
            'defs',
            { key: 'radar-defs' },
            radar.polygons.map((p) =>
                p.fill.gradient
                    ? s(
                          'radialGradient',
                          { key: `g${p.series}`, id: `${id}-radar-${p.series}` },
                          s('stop', { offset: '0%', style: { stopColor: p.fill.color, stopOpacity: p.fill.gradient.to } }),
                          s('stop', { offset: '100%', style: { stopColor: p.fill.color, stopOpacity: p.fill.gradient.from } })
                      )
                    : null
            )
        ),
        radar.polygons.map((p) =>
            s(
                'g',
                { key: `p${p.series}`, ...part('series', { kind: 'radar', dim: state.focusSeries >= 0 && state.focusSeries !== p.series }), 'data-series': p.series },
                s(
                    'path',
                    mergeAttrs(part('radarArea'), {
                        d: p.path,
                        style: {
                            fill: p.fill.gradient ? `url(#${id}-radar-${p.series})` : p.fill.color,
                            fillOpacity: p.fill.gradient ? 1 : p.fill.opacity,
                            stroke: p.color,
                            strokeWidth: p.width,
                            strokeLinejoin: 'round'
                        }
                    })
                ),
                p.markers.map((m, i) =>
                    s(
                        'path',
                        mergeAttrs({ key: i }, part('marker', { hover: state.column === i && (state.hoverSeries < 0 || state.hoverSeries === p.series) }), {
                            d: markerPath(m.shape, m.x, m.y, m.size),
                            style: { fill: m.fill, strokeWidth: m.strokeWidth }
                        })
                    )
                ),
                s('g', { 'aria-hidden': 'true' }, p.labels.map((l, i) => labelView(c, l, i)))
            )
        )
    ];
}
