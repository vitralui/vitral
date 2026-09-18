// A field whose value is a list. The tags are the Chip's shape at the field's
// scale, so a row of them sits on the baseline of the text beside it.
export default {
    root: {
        gap: '0.375rem',
        paddingY: '0.3125rem'
    },
    tag: {
        gap: '0.25rem',
        paddingX: '0.5rem',
        paddingY: '0.125rem',
        fontSize: '0.8125rem',
        borderRadius: '{borderRadius.sm}',
        background: '{secondary.subtleBackground}',
        color: '{secondary.subtleColor}'
    },
    remove: {
        size: '1rem',
        iconSize: '0.75rem',
        borderRadius: '{iconButton.borderRadius}',
        hoverBackground: '{secondary.subtleHoverBackground}'
    },
    input: {
        minWidth: '6rem'
    },
    full: {
        inputOpacity: '0.6'
    }
};
