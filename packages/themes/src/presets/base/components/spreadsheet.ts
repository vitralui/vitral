// A spreadsheet: a grid of cells on the content surface, with the headers on a
// tinted track. The selection is the accent — a ring around the active cell, a
// wash over the rectangle it has been dragged over, and the headers it covers
// lit up so a person can see where they are without counting.
export default {
    root: {
        borderRadius: '{borderRadius.md}',
        borderWidth: '1px',
        fontSize: '0.8125rem',
        transitionDuration: '{transitionDuration}'
    },
    header: {
        columnHeight: '1.75rem',
        rowWidth: '3rem',
        fontSize: '0.75rem',
        fontWeight: '500',
        color: '{text.mutedColor}',
        activeFontWeight: '600',
        activeColor: '{primary.color}'
    },
    cell: {
        width: '6.5rem',
        height: '1.75rem',
        padding: '0 0.375rem',
        color: '{text.color}',
        errorColor: '{danger.color}'
    },
    selection: {
        borderWidth: '2px',
        borderColor: '{primary.color}',
        rangeOpacity: '0.12'
    },
    // The outlines over what a formula being typed is reading. They are the
    // chart palette, picked apart for contrast rather than for a series: no two
    // next to each other read as the same colour at two pixels wide.
    reference: {
        borderWidth: '2px',
        fillOpacity: '0.1',
        1: '{chart.1}',
        2: '{chart.6}',
        3: '{chart.3}',
        4: '{chart.7}',
        5: '{chart.5}'
    },
    handle: {
        size: '0.5rem',
        background: '{primary.color}',
        borderWidth: '1px'
    },
    editor: {
        padding: '0 0.3125rem',
        borderWidth: '2px',
        borderColor: '{primary.color}',
        shadow: '{overlay.popover.shadow}'
    },
    toolbar: {
        padding: '0.25rem 0.375rem',
        gap: '0.125rem',
        groupGap: '0.375rem'
    },
    button: {
        size: '1.75rem',
        iconSize: '1rem',
        borderRadius: '{borderRadius.sm}',
        color: '{text.mutedColor}',
        hoverColor: '{text.color}',
        activeColor: '{primary.color}'
    },
    bar: {
        gap: '0.5rem',
        padding: '0.25rem 0.375rem',
        addressWidth: '6rem'
    },
    resizer: {
        size: '5px',
        color: '{primary.color}'
    },
    colorScheme: {
        light: {
            root: { background: '{content.background}', borderColor: '{content.borderColor}' },
            header: { background: '{surface.100}', borderColor: '{surface.300}', activeBackground: '{surface.200}' },
            toolbar: { background: '{surface.50}', separatorColor: '{surface.300}' },
            button: { hoverBackground: '{surface.200}', activeBackground: '{primary.50}' },
            cell: { borderColor: '{surface.200}', background: '{surface.0}' },
            bar: { background: '{surface.50}', borderColor: '{content.borderColor}' }
        },
        dark: {
            root: { background: '{content.background}', borderColor: '{content.borderColor}' },
            header: { background: '{surface.900}', borderColor: '{surface.700}', activeBackground: '{surface.800}' },
            toolbar: { background: '{surface.900}', separatorColor: '{surface.700}' },
            button: { hoverBackground: '{surface.800}', activeBackground: 'color-mix(in srgb, {primary.400} 18%, {surface.900})' },
            cell: { borderColor: '{surface.800}', background: '{surface.950}' },
            bar: { background: '{surface.900}', borderColor: '{content.borderColor}' }
        }
    }
};
