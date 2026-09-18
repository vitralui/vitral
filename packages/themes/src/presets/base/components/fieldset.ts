// A group of fields under a legend, which can be the button that collapses it.
export default {
    root: {
        background: '{content.background}',
        borderColor: '{content.borderColor}',
        borderRadius: '{content.borderRadius}',
        padding: '0 1.125rem 1.125rem',
        color: '{content.color}'
    },
    legend: {
        padding: '0.375rem 0.625rem',
        gap: '0.5rem',
        fontWeight: '600',
        borderRadius: '{borderRadius.sm}',
        color: '{text.color}',
        hoverBackground: '{content.hoverBackground}'
    },
    toggleIcon: { color: '{text.mutedColor}', hoverColor: '{text.color}' },
    content: { padding: '0.75rem 0 0' }
};
