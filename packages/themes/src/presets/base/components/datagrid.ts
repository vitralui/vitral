// Rows reuse the list's hover and selected colours (and the accent pill),
// so a selected row and a selected option read as the same thing.
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
        borderColor: '{content.borderColor}',
        color: '{text.color}'
    },
    headerCell: {
        background: '{content.background}',
        // A sticky header must be opaque, or rows show through it as they scroll under;
        // content backgrounds are translucent in some presets, overlay panels are not.
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
    filterCell: {
        padding: '0.375rem 0.75rem'
    },
    // The handle on a column's edge, the shadow the pinned block casts, and the
    // line a dragged column would land on.
    resizer: {
        width: '10px',
        inset: '6px',
        color: '{primary.color}'
    },
    pinned: {
        shadowLeft: '2px 0 4px -2px rgb(0 0 0 / 0.18)',
        shadowRight: '-2px 0 4px -2px rgb(0 0 0 / 0.18)'
    },
    drop: {
        width: '2px',
        color: '{primary.color}'
    },
    chooserButton: {
        padding: '0.25rem 0.625rem',
        fontSize: '0.8125rem'
    },
    // The heading over a run of rows gathered by a field.
    group: {
        background: '{content.hoverBackground}',
        color: '{text.color}',
        iconColor: '{text.mutedColor}',
        padding: '0.5rem 0.75rem',
        fontWeight: '600',
        count: {
            background: '{content.background}',
            color: '{text.mutedColor}'
        }
    },
    row: {
        background: 'transparent',
        hoverBackground: '{list.option.focusBackground}',
        color: '{text.color}',
        selectedBackground: '{list.option.selectedBackground}',
        selectedColor: '{list.option.selectedColor}',
        selectedIndicator: '{list.option.selectedIndicator}',
        stripedBackground: 'color-mix(in srgb, {text.color} 3%, transparent)'
    },
    bodyCell: {
        padding: '0.5rem 0.75rem',
        borderColor: '{content.borderColor}',
        sm: { padding: '0.25rem 0.5rem' },
        lg: { padding: '0.875rem 1rem' }
    },
    footerCell: {
        color: '{text.color}',
        fontWeight: '600'
    },
    footer: {
        padding: '0.75rem 1rem',
        color: '{text.mutedColor}'
    },
    sortIcon: {
        color: '{text.mutedColor}',
        activeColor: '{primary.color}'
    },
    sortBadge: {
        size: '1rem',
        fontSize: '0.6875rem',
        background: '{primary.color}',
        color: '{primary.contrastColor}'
    },
    checkbox: {
        size: '1.125rem',
        borderRadius: '{borderRadius.sm}',
        background: '{formField.background}',
        borderColor: '{text.mutedColor}',
        hoverBorderColor: '{text.color}',
        checkedBackground: '{primary.color}',
        checkedBorderColor: '{primary.color}',
        checkedColor: '{primary.contrastColor}'
    },
    loadingIcon: {
        size: '2rem',
        color: '{primary.color}'
    },
    colorScheme: {
        light: { loadingMask: { background: 'rgba(255, 255, 255, 0.6)' } },
        dark: { loadingMask: { background: 'rgba(0, 0, 0, 0.4)' } }
    }
};
