import { formatMessage, visuallyHidden, type Locale } from '@vitral/core';
import { getIcon } from '@vitral/icons';
import type { ChartTable } from '../engine/a11y';
import { h, iconNode, mergeAttrs, type Child, type Props } from '@vitral/dom';

// The HTML around the picture: the legend, the tooltip, the toolbar and its
// download menu, and the hidden data table.

type Part = (name: string, state?: unknown) => Props;

/** What a custom renderer may hand back: text, a node, or nodes. Text is never parsed as HTML. */
export type HookResult = string | Node | Node[] | null | undefined;

export const hookChild = (result: HookResult): Child => (result === null || result === undefined ? null : Array.isArray(result) ? result : result);

/** An icon by name, drawn the way the icon component draws it. */
export const iconView = (name: string): Child => iconNode(getIcon(name));

export interface LegendEntry {
    series: number;
    name: string;
    color: string;
    hidden: boolean;
}

export interface LegendItemContext {
    name: string;
    seriesIndex: number;
    hidden: boolean;
    color: string;
}

export interface LegendProps {
    entries: LegendEntry[];
    position: string;
    align?: string;
    interactive: boolean;
    focus: number;
    shape?: string;
    locale: Locale;
    item?: (context: LegendItemContext) => HookResult;
    onToggle: (series: number) => void;
    onHighlight: (series: number) => void;
}

/**
 * The key. Entries are toggle buttons (pressed while their series shows) when
 * clicking toggles series, so the legend is operable from the keyboard; a
 * hover or focus on one dims the others.
 */
export function legendView(part: Part, p: LegendProps, key: string): Child {
    return h(
        'ul',
        mergeAttrs({ key, 'aria-label': p.locale.chart.legend }, part('legend', { position: p.position, align: p.align })),
        p.entries.map((e) => {
            const custom = p.item?.({ name: e.name, seriesIndex: e.series, hidden: e.hidden, color: e.color });
            return h(
                'li',
                { key: e.series, style: 'display: contents' },
                h(
                    p.interactive ? 'button' : 'span',
                    mergeAttrs(
                        {
                            type: p.interactive ? 'button' : undefined,
                            'aria-pressed': p.interactive ? (e.hidden ? 'false' : 'true') : undefined
                        },
                        part('legendItem', { hidden: e.hidden, dim: p.focus >= 0 && p.focus !== e.series, interactive: p.interactive }),
                        {
                            title: p.interactive ? formatMessage(e.hidden ? p.locale.chart.seriesHidden : p.locale.chart.seriesShown, { series: e.name }) : undefined,
                            onClick: () => p.interactive && p.onToggle(e.series),
                            onMouseenter: () => p.onHighlight(e.series),
                            onMouseleave: () => p.onHighlight(-1),
                            onFocus: () => p.onHighlight(e.series),
                            onBlur: () => p.onHighlight(-1)
                        }
                    ),
                    h('span', mergeAttrs({ 'aria-hidden': 'true' }, part('legendMarker', { shape: p.shape }), { style: { background: e.color } })),
                    h('span', part('legendText'), custom === null || custom === undefined ? e.name : hookChild(custom))
                )
            );
        })
    );
}

export interface TooltipRow {
    name: string;
    value: string;
    color: string;
    seriesIndex: number;
    extra?: { name: string; text: string }[];
}

/** What the tooltip shows, and what a custom tooltip receives. */
export interface ChartTooltipRenderContext {
    title: string;
    rows: TooltipRow[];
    seriesIndex: number;
    dataPointIndex: number;
    column: number;
}

export interface TooltipProps {
    content: ChartTooltipRenderContext;
    x: number;
    y: number;
    bounds: { width: number; height: number };
    size: { width: number; height: number };
    swatches: boolean;
    custom?: string;
    render?: (context: ChartTooltipRenderContext) => HookResult;
    ref: (el: Element) => void;
}

/**
 * The readout panel: a title, and a row per series with its swatch. It sits
 * beside the point and flips to the other side before it would leave the
 * chart. It repeats what the live region says, so it is hidden from
 * assistive technology.
 */
export function tooltipView(part: Part, p: TooltipProps): Child {
    const gap = 12;
    // Beside the point, on the side the reader has already been: in the left
    // half it opens to the right, in the right half to the left. Opening to the
    // same side always meant that halfway across a chart the panel lay over the
    // markers being read towards. If the chosen side does not fit, the other
    // one does.
    const before = p.x > p.bounds.width / 2;
    let left = before ? p.x - gap - p.size.width : p.x + gap;
    if (left < 0) left = p.x + gap;
    else if (left + p.size.width > p.bounds.width) left = p.x - gap - p.size.width;
    left = Math.max(0, Math.min(left, Math.max(0, p.bounds.width - p.size.width)));
    let top = p.y - p.size.height / 2;
    top = Math.max(0, Math.min(top, p.bounds.height - p.size.height));
    const position = { transform: `translate(${Math.round(left)}px, ${Math.round(top)}px)` };

    let body: Child;
    const custom = p.render?.(p.content);
    if (custom !== null && custom !== undefined) body = hookChild(custom);
    else if (p.custom) {
        const rows = p.content.rows.map((r) => `${r.name}: ${r.value}`).join('\n');
        body = p.custom
            .replace(/\{title\}/g, p.content.title)
            .replace(/\{rows\}/g, rows)
            .split('\n')
            .map((line, i) => h('div', { key: `c${i}` }, line));
    } else {
        body = [
            p.content.title ? h('div', { key: 'title', ...part('tooltipTitle') }, p.content.title) : null,
            p.content.rows.map((row) => [
                h(
                    'div',
                    { key: `r${row.seriesIndex}`, ...part('tooltipRow') },
                    p.swatches ? h('span', mergeAttrs(part('tooltipSwatch'), { style: { background: row.color } })) : null,
                    row.name ? h('span', part('tooltipName'), row.name) : null,
                    h('span', part('tooltipValue'), row.value)
                ),
                (row.extra ?? []).map((e) =>
                    h(
                        'div',
                        { key: `e${row.seriesIndex}-${e.name}`, ...part('tooltipRow') },
                        p.swatches ? h('span', mergeAttrs(part('tooltipSwatch'), { style: 'visibility: hidden' })) : null,
                        h('span', part('tooltipName'), e.name),
                        h('span', part('tooltipValue'), e.text)
                    )
                )
            ])
        ];
    }
    return h('div', mergeAttrs({ key: 'tooltip', 'aria-hidden': 'true' }, part('tooltip'), { style: position, ref: p.ref }), body);
}

export type ToolbarTools = { download?: boolean; selection?: boolean; zoom?: boolean; zoomin?: boolean; zoomout?: boolean; pan?: boolean; reset?: boolean };
export type DragMode = 'zoom' | 'pan' | 'selection';
export type DownloadKind = 'svg' | 'png' | 'csv';

export interface ToolbarProps {
    tools: ToolbarTools;
    mode: DragMode;
    zoomed: boolean;
    canZoom: boolean;
    locale: Locale;
    menuOpen: boolean;
    menuId: string;
    triggerRef: (el: Element) => void;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onReset: () => void;
    onMode: (mode: DragMode) => void;
    onTrigger: () => void;
    onTriggerKeydown: (event: KeyboardEvent) => void;
}

/**
 * Zoom in, zoom out, the drag mode (zoom or pan), reset, and a download menu.
 * The drag modes are toggle buttons; the menu is a WAI-ARIA menu button.
 */
export function toolbarView(part: Part, p: ToolbarProps): Child {
    const { locale, tools } = p;
    const tool = (name: string, label: string, icon: string, extra: Props = {}, state?: unknown) =>
        h('button', mergeAttrs({ key: name, type: 'button' }, part('tool', state), { 'aria-label': label, title: label }, extra), iconView(icon));
    return h(
        'div',
        mergeAttrs({ key: 'toolbar', role: 'toolbar', 'aria-label': locale.chart.toolbar }, part('toolbar')),
        p.canZoom
            ? [
                  tools.zoomin !== false ? tool('zoomin', locale.chart.zoomIn, 'zoomIn', { onClick: p.onZoomIn }) : null,
                  tools.zoomout !== false ? tool('zoomout', locale.chart.zoomOut, 'zoomOut', { disabled: !p.zoomed, onClick: p.onZoomOut }) : null,
                  tools.zoom !== false
                      ? tool('zoom', locale.chart.selectZoom, 'selection', { 'aria-pressed': p.mode === 'zoom' ? 'true' : 'false', onClick: () => p.onMode('zoom') }, { active: p.mode === 'zoom' })
                      : null,
                  tools.pan !== false
                      ? tool('pan', locale.chart.pan, 'move', { 'aria-pressed': p.mode === 'pan' ? 'true' : 'false', disabled: !p.zoomed, onClick: () => p.onMode('pan') }, { active: p.mode === 'pan' })
                      : null,
                  tools.reset !== false ? tool('reset', locale.chart.resetZoom, 'refresh', { disabled: !p.zoomed, onClick: p.onReset }) : null
              ]
            : null,
        tools.download !== false
            ? tool(
                  'download',
                  locale.chart.download,
                  'download',
                  {
                      'aria-haspopup': 'menu',
                      'aria-expanded': p.menuOpen ? 'true' : 'false',
                      'aria-controls': p.menuOpen ? p.menuId : undefined,
                      ref: p.triggerRef,
                      onClick: p.onTrigger,
                      onKeydown: p.onTriggerKeydown
                  },
                  { active: p.menuOpen }
              )
            : null
    );
}

export interface MenuProps {
    id: string;
    locale: Locale;
    onChoose: (kind: DownloadKind) => void;
    onKeydown: (event: KeyboardEvent) => void;
    ref: (el: Element) => void;
}

/** The download menu, drawn in the overlay container. */
export function menuView(part: Part, p: MenuProps): Child {
    const items: { kind: DownloadKind; label: string }[] = [
        { kind: 'svg', label: p.locale.chart.downloadSvg },
        { kind: 'png', label: p.locale.chart.downloadPng },
        { kind: 'csv', label: p.locale.chart.downloadCsv }
    ];
    return h(
        'ul',
        mergeAttrs({ id: p.id, role: 'menu', 'aria-label': p.locale.chart.download }, part('menu'), { onKeydown: p.onKeydown, ref: p.ref }),
        items.map((item) =>
            h('li', { key: item.kind, role: 'none' }, h('button', mergeAttrs({ type: 'button', role: 'menuitem', tabindex: '-1' }, part('menuItem'), { onClick: () => p.onChoose(item.kind) }), item.label))
        )
    );
}

/** The data as a table, for readers who would rather read it than hear it point by point. Visually hidden. */
export function tableView(part: Part, table: ChartTable, caption: string): Child {
    return h(
        'table',
        mergeAttrs({ key: 'table' }, part('table'), { style: { ...visuallyHidden } }),
        h('caption', null, caption),
        h('thead', null, h('tr', null, table.head.map((cell, i) => h('th', { key: i, scope: 'col' }, cell)))),
        h(
            'tbody',
            null,
            table.rows.map((row, r) => h('tr', { key: r }, h('th', { scope: 'row' }, row[0]), row.slice(1).map((cell, c) => h('td', { key: c }, cell))))
        )
    );
}
