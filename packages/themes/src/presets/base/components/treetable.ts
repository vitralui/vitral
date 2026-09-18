// A table of rows that nest: the DataTable look, with a toggle and an indent
// in the expander column. Rows use the list's hover and selected colours.
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
        stickyBackground: '{overlay.popover.background}',
        hoverBackground: '{content.hoverBackground}',
        color: '{text.mutedColor}',
        hoverColor: '{text.color}',
        borderColor: '{content.borderColor}',
        padding: '0.5rem 0.75rem',
        gap: '0.375rem',
        fontWeight: '600'
    },
    row: {
        hoverBackground: '{list.option.focusBackground}',
        selectedBackground: '{list.option.selectedBackground}',
        selectedColor: '{list.option.selectedColor}',
        stripedBackground: 'color-mix(in srgb, {text.color} 3%, transparent)'
    },
    bodyCell: {
        padding: '0.5rem 0.75rem',
        borderColor: '{content.borderColor}',
        sm: { padding: '0.25rem 0.5rem' },
        lg: { padding: '0.875rem 1rem' }
    },
    toggler: {
        size: '1.5rem',
        indent: '1.25rem',
        color: '{text.mutedColor}',
        hoverColor: '{text.color}',
        hoverBackground: '{content.hoverBackground}',
        borderRadius: '{borderRadius.sm}'
    },
    checkbox: {
        size: '1.125rem',
        borderRadius: '{borderRadius.sm}',
        background: '{formField.background}',
        borderColor: '{text.mutedColor}',
        checkedBackground: '{primary.color}',
        checkedBorderColor: '{primary.color}',
        checkedColor: '{primary.contrastColor}'
    },
    sortIcon: {
        color: '{text.mutedColor}',
        activeColor: '{primary.color}'
    },
    loadingMask: {
        background: 'color-mix(in srgb, {content.background} 60%, transparent)',
        iconSize: '2rem',
        iconColor: '{primary.color}'
    }
};
