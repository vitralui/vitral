// An expander: a card whose header is the
// toggle, and a content area separated from it by a hairline.
export default {
    root: {
        background: '{content.background}',
        color: '{content.color}',
        borderColor: '{content.borderColor}',
        borderWidth: '1px',
        borderRadius: '{content.borderRadius}'
    },
    header: {
        padding: '0.75rem 1rem',
        minHeight: '3rem',
        gap: '0.5rem',
        color: '{text.color}',
        hoverBackground: '{content.hoverBackground}'
    },
    title: {
        fontWeight: '600'
    },
    toggleIcon: {
        color: '{text.mutedColor}',
        hoverColor: '{text.color}'
    },
    content: {
        padding: '1rem',
        borderColor: '{content.borderColor}'
    },
    footer: {
        padding: '0 1rem 1rem'
    },
    /** Expanding and collapsing; the semantic duration is tuned for hovers and too quick for a height. */
    collapseDuration: '0.2s'
};
