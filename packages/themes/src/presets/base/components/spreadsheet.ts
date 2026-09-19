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
            cell: { borderColor: '{surface.200}', background: '{surface.0}' },
            bar: { background: '{surface.50}', borderColor: '{content.borderColor}' }
        },
        dark: {
            root: { background: '{content.background}', borderColor: '{content.borderColor}' },
            header: { background: '{surface.900}', borderColor: '{surface.700}', activeBackground: '{surface.800}' },
            cell: { borderColor: '{surface.800}', background: '{surface.950}' },
            bar: { background: '{surface.900}', borderColor: '{content.borderColor}' }
        }
    }
};
