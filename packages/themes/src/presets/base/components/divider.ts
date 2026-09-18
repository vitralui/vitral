export default {
    root: {
        borderColor: '{content.borderColor}',
        borderWidth: '1px'
    },
    horizontal: {
        margin: '1rem 0',
        /** How far the line runs before content aligned to the start or end. */
        inset: '1rem'
    },
    vertical: {
        margin: '0 1rem',
        minHeight: '1.25rem',
        inset: '0.5rem'
    },
    content: {
        gap: '0.75rem',
        color: '{text.mutedColor}'
    }
};
