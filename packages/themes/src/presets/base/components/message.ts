// The message band: a tinted band, an icon in the
// severity colour, a bold title running into the message. The colours come
// from the semantic severity tokens (`subtleBackground`, `subtleColor`…).
export default {
    root: {
        borderRadius: '{content.borderRadius}',
        borderWidth: '1px',
        padding: '0.6875rem 1rem',
        gap: '0.75rem',
        minHeight: '3rem',
        transitionDuration: '0.15s'
    },
    icon: {
        size: '1rem'
    },
    title: {
        fontWeight: '600'
    },
    text: {
        color: '{text.color}'
    },
    closeButton: {
        size: '1.75rem',
        borderRadius: '{iconButton.borderRadius}',
        hoverBackground: '{content.hoverBackground}'
    }
};
