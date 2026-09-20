// The small table. It borrows the grid's measurements so the two read as one
// family — a page that outgrows this table and moves to DataGrid should not
// look like it changed component — and stops where the grid's extras begin.
export default {
    root: {
        background: '{content.background}',
        color: '{text.color}',
        borderColor: '{content.borderColor}',
        borderRadius: '{content.borderRadius}',
        transitionDuration: '{transitionDuration}'
    },
    header: {
        padding: '0.75rem 1rem',
        borderColor: '{content.borderColor}'
    },
    headerCell: {
        background: '{content.background}',
        // A stuck head must be opaque, or rows show through it as they scroll
        // under; content backgrounds are translucent in some presets.
        stickyBackground: '{overlay.popover.background}',
        hoverBackground: '{content.hoverBackground}',
        color: '{text.mutedColor}',
        hoverColor: '{text.color}',
        sortedColor: '{text.color}',
        borderColor: '{content.borderColor}',
        padding: '0.5rem 0.75rem',
        gap: '0.375rem',
        fontWeight: '600'
    },
    row: {
        background: 'transparent',
        color: '{text.color}',
        hoverBackground: '{list.option.focusBackground}',
        stripedBackground: 'color-mix(in srgb, {text.color} 3%, transparent)'
    },
    bodyCell: {
        padding: '0.5rem 0.75rem',
        borderColor: '{content.borderColor}',
        sm: { padding: '0.25rem 0.5rem' },
        lg: { padding: '0.875rem 1rem' }
    },
    sortIcon: {
        color: '{text.mutedColor}',
        activeColor: '{primary.color}'
    },
    empty: {
        padding: '2rem 1rem',
        color: '{text.mutedColor}'
    }
};
