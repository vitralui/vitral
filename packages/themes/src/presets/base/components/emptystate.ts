// Nothing here yet, said kindly: an icon in a soft disc, a line saying what
// is missing, and what to do about it.
export default {
    root: {
        padding: '2rem 1rem',
        gap: '0.75rem',
        textMaxWidth: '28rem'
    },
    icon: {
        size: '1.5rem',
        boxSize: '3.5rem',
        borderRadius: '50%',
        background: '{content.hoverBackground}',
        color: '{text.mutedColor}'
    },
    title: {
        fontSize: '1rem',
        fontWeight: '600',
        color: '{text.hoverColor}'
    },
    description: {
        color: '{text.mutedColor}'
    },
    actions: {
        gap: '0.5rem',
        marginTop: '0.25rem'
    },
    sm: {
        padding: '1rem 0.75rem',
        iconSize: '1.125rem',
        iconBoxSize: '2.5rem',
        titleFontSize: '0.875rem'
    },
    lg: {
        padding: '3rem 1.5rem',
        iconSize: '2rem',
        iconBoxSize: '4.5rem',
        titleFontSize: '1.25rem'
    }
};
