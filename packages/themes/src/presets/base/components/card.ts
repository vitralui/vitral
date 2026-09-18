// A card: the layer fill over the window, a hairline stroke, the 8px
// overlay corner. Everything reads the semantic `content` group.
export default {
    root: {
        background: '{content.background}',
        color: '{content.color}',
        borderColor: '{content.borderColor}',
        borderWidth: '1px',
        borderRadius: '{borderRadius.lg}',
        shadow: 'none'
    },
    body: {
        padding: '1rem',
        gap: '0.75rem'
    },
    caption: {
        gap: '0.125rem'
    },
    title: {
        fontSize: '1rem',
        fontWeight: '600',
        color: '{text.hoverColor}'
    },
    subtitle: {
        color: '{text.mutedColor}'
    }
};
