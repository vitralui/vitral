// The chart's own look: axes, grid, readouts and controls. The series colours
// are not here: they are the semantic palette `chart.1`…`chart.8`
// (`--vt-chart-1`…). This tree shares that `chart` namespace, so it never uses
// a numeric key. `tokenCollisions()` and the theme spec hold it to that.
export default {
    root: {
        gap: '0.5rem',
        fontFamily: '{fontFamily}',
        fontSize: '{fontSize}',
        color: '{text.color}',
        background: 'transparent',
        transitionDuration: '{transitionDuration}',
        animationDuration: '0.5s',
        // The curve the first draw follows. `chart.animations.easing` writes
        // over it per chart; this is what a chart moves like by default.
        animationEasing: 'cubic-bezier(0.33, 1, 0.68, 1)'
    },
    title: {
        fontSize: '0.9375rem',
        fontWeight: '600',
        color: '{text.color}'
    },
    subtitle: {
        fontSize: '0.75rem',
        fontWeight: '400',
        color: '{text.mutedColor}'
    },
    axis: {
        fontSize: '0.75rem',
        color: '{text.mutedColor}',
        lineColor: '{content.borderColor}',
        tickColor: '{content.borderColor}',
        titleFontSize: '0.75rem',
        titleFontWeight: '600',
        titleColor: '{text.mutedColor}'
    },
    grid: {
        lineColor: 'color-mix(in srgb, {content.borderColor} 70%, transparent)',
        lineWidth: '1'
    },
    radial: {
        trackColor: 'color-mix(in srgb, {text.color} 8%, transparent)'
    },
    // A bullet's bands and the mark it is measured against.
    band: {
        color: 'color-mix(in srgb, {text.color} 12%, transparent)'
    },
    target: {
        color: '{text.color}'
    },
    crosshair: {
        color: '{text.mutedColor}',
        width: '1',
        dash: '3 3',
        bandColor: 'color-mix(in srgb, {text.color} 6%, transparent)'
    },
    selection: {
        background: 'color-mix(in srgb, {primary.color} 14%, transparent)',
        borderColor: '{primary.color}'
    },
    brush: {
        shade: 'color-mix(in srgb, {surface.500} 22%, transparent)',
        borderColor: '{primary.color}',
        handleColor: '{primary.color}'
    },
    marker: {
        strokeColor: '{content.background}',
        hoverScale: '1.4'
    },
    focus: {
        ringColor: '{focusRing.color}',
        ringWidth: '2'
    },
    dataLabel: {
        fontSize: '0.6875rem',
        fontWeight: '600',
        color: '{text.color}',
        onFillColor: '#ffffff',
        background: '{content.background}'
    },
    tooltip: {
        background: '{overlay.popover.background}',
        borderColor: '{overlay.popover.borderColor}',
        color: '{overlay.popover.color}',
        mutedColor: '{text.mutedColor}',
        shadow: '{overlay.popover.shadow}',
        borderRadius: '{borderRadius.md}',
        padding: '0.5rem 0.625rem',
        fontSize: '0.75rem',
        titleFontWeight: '600',
        gap: '0.25rem',
        swatchSize: '0.625rem',
        swatchRadius: '{borderRadius.xs}',
        valueFontWeight: '600',
        offset: '12px',
        // The row for the series under the pointer, and the rest of the column
        // behind it. The inset lets the highlight run to the panel's padding
        // rather than stopping at the text.
        row: {
            radius: '{borderRadius.xs}',
            mutedOpacity: '0.55',
            activeBackground: '{surface.100}',
            activeInset: '2px'
        }
    },
    legend: {
        // The chip a legend entry can carry when it is showing a figure.
        value: {
            gap: '0.125rem',
            padding: '0 0.3125rem',
            radius: '{borderRadius.sm}',
            background: '{surface.100}',
            color: '{text.color}',
            fontWeight: '600'
        },
        gap: '0.25rem 0.75rem',
        fontSize: '0.8125rem',
        color: '{text.color}',
        hiddenOpacity: '0.45',
        markerSize: '0.625rem',
        markerRadius: '{borderRadius.xs}',
        itemPadding: '0.125rem 0.375rem',
        itemRadius: '{borderRadius.sm}',
        hoverBackground: '{content.hoverBackground}',
        dimOpacity: '0.25'
    },
    toolbar: {
        gap: '0.125rem',
        buttonSize: '1.75rem',
        borderRadius: '{borderRadius.sm}',
        color: '{text.mutedColor}',
        hoverColor: '{text.color}',
        hoverBackground: '{content.hoverBackground}',
        activeColor: '{primary.color}',
        activeBackground: '{highlight.background}'
    },
    annotation: {
        lineColor: '{text.mutedColor}',
        fillColor: '{primary.color}',
        labelBackground: '{content.background}',
        labelColor: '{text.color}',
        labelBorderColor: '{content.borderColor}',
        labelFontSize: '0.6875rem',
        pointColor: '{primary.color}'
    },
    noData: {
        color: '{text.mutedColor}',
        fontSize: '0.875rem'
    },
    pie: {
        strokeColor: '{content.background}',
        totalLabelColor: '{text.mutedColor}',
        totalLabelFontSize: '0.75rem',
        totalValueColor: '{text.color}',
        totalValueFontSize: '1.375rem',
        totalValueFontWeight: '700'
    },
    radar: {
        gridColor: '{content.borderColor}',
        band: 'color-mix(in srgb, {text.color} 5%, transparent)'
    },
    heatmap: {
        base: '{content.background}',
        empty: 'color-mix(in srgb, {text.color} 5%, transparent)',
        strokeColor: '{content.background}',
        color: '{text.color}',
        onFillColor: '#ffffff'
    },
    candle: {
        wickWidth: '1'
    },
    bar: {
        hoverOpacity: '0.85',
        dimOpacity: '0.35'
    },
    line: {
        dimOpacity: '0.2'
    }
};
