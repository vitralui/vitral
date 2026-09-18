import { defineStyle } from '@vitral/core';
import css from './chart.css?raw';

export interface ChartMarkState {
    /** Another series (or point) is the one in focus. */
    dim?: boolean;
    hover?: boolean;
    selected?: boolean;
}

export const chartStyle = defineStyle({
    name: 'chart',
    css,
    classes: {
        root: (s: { animated?: boolean; sparkline?: boolean; dragging?: boolean; toolbar?: boolean }) => ['vt-chart', { 'vt-chart-animated': s.animated, 'vt-chart-sparkline': s.sparkline, 'vt-chart-dragging': s.dragging, 'vt-chart-with-toolbar': s.toolbar }],
        toolbar: 'vt-chart-toolbar',
        tool: (s: { active?: boolean }) => ['vt-chart-tool', { 'vt-chart-tool-active': s.active }],
        menu: 'vt-overlay vt-chart-menu',
        menuItem: 'vt-chart-menu-item',
        body: (s: { legend?: string }) => ['vt-chart-body', s.legend && `vt-chart-body-legend-${s.legend}`],
        canvas: (s: { mode?: string; interactive?: boolean }) => ['vt-chart-canvas', s.mode && `vt-chart-mode-${s.mode}`, { 'vt-chart-interactive': s.interactive }],
        svg: 'vt-chart-svg',
        title: 'vt-chart-title',
        subtitle: 'vt-chart-subtitle',
        gridLine: 'vt-chart-grid-line',
        gridBand: 'vt-chart-grid-band',
        axis: (s: { side?: string }) => ['vt-chart-axis', `vt-chart-axis-${s.side}`],
        axisLine: 'vt-chart-axis-line',
        axisTick: 'vt-chart-axis-tick',
        axisLabel: 'vt-chart-axis-label',
        axisTitle: 'vt-chart-axis-title',
        series: (s: ChartMarkState & { kind?: string }) => ['vt-chart-series', `vt-chart-series-${s.kind}`, { 'vt-chart-dim': s.dim }],
        line: 'vt-chart-line',
        area: 'vt-chart-area',
        marker: (s: ChartMarkState) => ['vt-chart-marker', { 'vt-chart-hover': s.hover }],
        bar: (s: ChartMarkState) => ['vt-chart-bar', { 'vt-chart-hover': s.hover, 'vt-chart-dim': s.dim, 'vt-chart-selected': s.selected }],
        stem: 'vt-chart-stem',
        connector: 'vt-chart-connector',
        dataLabel: (s: { onFill?: boolean }) => ['vt-chart-data-label', { 'vt-chart-data-label-on-fill': s.onFill }],
        dataLabelBackground: 'vt-chart-data-label-bg',
        candle: (s: ChartMarkState & { rising?: boolean; hollow?: boolean }) => ['vt-chart-candle', { 'vt-chart-hover': s.hover, 'vt-chart-candle-hollow': s.hollow }],
        wick: 'vt-chart-wick',
        median: 'vt-chart-median',
        cell: (s: ChartMarkState) => ['vt-chart-cell', { 'vt-chart-hover': s.hover, 'vt-chart-dim': s.dim }],
        slice: (s: ChartMarkState) => ['vt-chart-slice', { 'vt-chart-hover': s.hover, 'vt-chart-dim': s.dim, 'vt-chart-selected': s.selected }],
        pieBackground: 'vt-chart-pie-bg',
        centerLabel: 'vt-chart-center-label',
        centerValue: 'vt-chart-center-value',
        radarRing: (s: { filled?: boolean }) => ['vt-chart-radar-ring', { 'vt-chart-radar-ring-filled': s.filled }],
        radarSpoke: 'vt-chart-radar-spoke',
        radarLabel: 'vt-chart-radar-label',
        radarTick: 'vt-chart-radar-tick',
        radarArea: 'vt-chart-radar-area',
        annotation: (s: { kind?: string }) => ['vt-chart-annotation', `vt-chart-annotation-${s.kind}`],
        annotationLabel: 'vt-chart-annotation-label',
        annotationLabelBox: 'vt-chart-annotation-label-box',
        crosshair: 'vt-chart-crosshair',
        crosshairBand: 'vt-chart-crosshair-band',
        selection: 'vt-chart-selection',
        brushShade: 'vt-chart-brush-shade',
        brushHandle: 'vt-chart-brush-handle',
        focusRing: 'vt-chart-focus-ring',
        noData: 'vt-chart-no-data',
        tooltip: 'vt-chart-tooltip',
        tooltipTitle: 'vt-chart-tooltip-title',
        tooltipRow: 'vt-chart-tooltip-row',
        tooltipSwatch: 'vt-chart-tooltip-swatch',
        tooltipName: 'vt-chart-tooltip-name',
        tooltipValue: 'vt-chart-tooltip-value',
        legend: (s: { position?: string; align?: string }) => ['vt-chart-legend', `vt-chart-legend-${s.position}`, s.align && `vt-chart-legend-align-${s.align}`],
        legendItem: (s: { hidden?: boolean; dim?: boolean; interactive?: boolean }) => [
            'vt-chart-legend-item',
            { 'vt-chart-legend-hidden': s.hidden, 'vt-chart-dim': s.dim, 'vt-chart-legend-interactive': s.interactive }
        ],
        legendMarker: (s: { shape?: string }) => ['vt-chart-legend-marker', s.shape && `vt-chart-legend-marker-${s.shape}`],
        legendText: 'vt-chart-legend-text',
        status: 'vt-chart-status',
        table: 'vt-chart-table'
    }
});

/** The chart's stylesheet as text, for code that injects it itself (`createChart` does, unless unstyled). */
export const chartCss = css;
