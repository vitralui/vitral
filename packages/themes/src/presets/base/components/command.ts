// A search box over a list of commands, on the popover surface.
export default {
    root: {
        background: '{overlay.popover.background}',
        borderColor: '{overlay.popover.borderColor}',
        borderRadius: '{overlay.popover.borderRadius}',
        color: '{overlay.popover.color}'
    },
    input: {
        padding: '0.75rem',
        gap: '0.5rem',
        borderColor: '{content.borderColor}',
        iconColor: '{text.mutedColor}',
        placeholderColor: '{formField.placeholderColor}'
    },
    list: {
        maxHeight: '20rem',
        padding: '{list.padding}',
        gap: '{list.gap}'
    },
    groupHeading: {
        padding: '0.5rem 0.75rem 0.25rem',
        fontSize: '0.75rem',
        fontWeight: '600',
        color: '{text.mutedColor}'
    },
    item: {
        gap: '0.5rem',
        shortcutColor: '{text.mutedColor}'
    },
    empty: {
        padding: '1.5rem 1rem',
        color: '{text.mutedColor}'
    },
    separator: {
        borderColor: '{content.borderColor}',
        margin: '0.25rem 0'
    },
    dialog: {
        width: '36rem'
    }
};
