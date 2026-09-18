// Numbered steps joined by a line; the current one and those done take the accent.
export default {
    root: {
        gap: '1rem'
    },
    step: {
        gap: '0.5rem',
        padding: '0.5rem',
        borderRadius: '{content.borderRadius}',
        color: '{text.mutedColor}',
        activeColor: '{text.color}',
        fontWeight: '500'
    },
    number: {
        size: '2rem',
        fontSize: '0.875rem',
        fontWeight: '600',
        background: '{content.background}',
        borderColor: '{content.borderColor}',
        color: '{text.mutedColor}',
        activeBackground: '{primary.color}',
        activeBorderColor: '{primary.color}',
        activeColor: '{primary.contrastColor}',
        doneBorderColor: '{primary.color}',
        doneColor: '{primary.color}'
    },
    separator: {
        size: '2px',
        background: '{content.borderColor}',
        activeBackground: '{primary.color}',
        margin: '0 0.5rem'
    },
    panel: {
        padding: '0.5rem 0',
        indent: '1.25rem'
    }
};
