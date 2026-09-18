// A stack of expander-like sections, as a settings page lays them out:
// each panel is its own card, a small gap apart.
export default {
    root: {
        gap: '0.25rem'
    },
    panel: {
        background: '{content.background}',
        borderColor: '{content.borderColor}',
        borderWidth: '1px',
        borderRadius: '{content.borderRadius}'
    },
    header: {
        padding: '0.75rem 1rem',
        minHeight: '3rem',
        gap: '0.5rem',
        fontWeight: '600',
        color: '{text.color}',
        hoverBackground: '{content.hoverBackground}',
        activeColor: '{text.hoverColor}'
    },
    toggleIcon: {
        color: '{text.mutedColor}',
        hoverColor: '{text.color}'
    },
    content: {
        padding: '1rem',
        borderColor: '{content.borderColor}',
        color: '{content.color}'
    },
    collapseDuration: '0.2s'
};
