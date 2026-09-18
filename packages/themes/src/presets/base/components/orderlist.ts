// An order list: lists drawn like a listbox field, with a column of buttons beside them.
export default {
    root: {
        gap: '0.75rem'
    },
    controls: {
        gap: '0.5rem'
    },
    list: {
        background: '{formField.background}',
        borderColor: '{content.borderColor}',
        borderRadius: '{formField.borderRadius}',
        height: '16rem',
        minWidth: '12rem',
        padding: '{list.padding}',
        gap: '{list.gap}'
    },
    header: {
        padding: '0.5rem 0.25rem',
        fontWeight: '600',
        color: '{text.color}'
    },
    dropIndicator: {
        color: '{primary.color}'
    }
};
