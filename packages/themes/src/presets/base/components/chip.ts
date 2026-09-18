// A token the reader can take out: a filter that is on, a recipient, a tag on
// an input. Bigger than a Tag, and pill-shaped by default.
export default {
    root: {
        paddingX: '0.75rem',
        paddingY: '0.25rem',
        gap: '0.5rem',
        fontSize: '0.8125rem',
        borderRadius: '{borderRadius.pill}',
        background: '{secondary.subtleBackground}',
        hoverBackground: '{secondary.subtleHoverBackground}',
        color: '{secondary.subtleColor}'
    },
    icon: { size: '1rem' },
    image: { size: '1.5rem' },
    removeButton: { size: '1.125rem', borderRadius: '{iconButton.borderRadius}' }
};
