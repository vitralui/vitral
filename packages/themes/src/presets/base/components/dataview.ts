// Your own template per item, in a list or a grid, on the content surface.
export default {
    root: {
        background: '{content.background}',
        borderColor: '{content.borderColor}',
        borderRadius: '{content.borderRadius}',
        color: '{content.color}'
    },
    header: {
        padding: '0.75rem 1rem',
        borderColor: '{content.borderColor}'
    },
    content: {
        padding: '0',
        gap: '1rem',
        gridMinWidth: '14rem'
    },
    empty: {
        padding: '1.5rem 1rem',
        color: '{text.mutedColor}'
    },
    loader: {
        background: 'color-mix(in srgb, {content.background} 70%, transparent)',
        iconSize: '1.75rem'
    }
};
