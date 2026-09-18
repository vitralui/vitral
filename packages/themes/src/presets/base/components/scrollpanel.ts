// Thin bars in the theme's muted colour, a little stronger under the pointer.
export default {
    bar: {
        size: '0.5rem',
        gap: '2px',
        borderRadius: '{borderRadius.pill}',
        background: 'color-mix(in srgb, {text.mutedColor} 45%, transparent)',
        hoverBackground: 'color-mix(in srgb, {text.mutedColor} 75%, transparent)',
        trackBackground: 'transparent',
        transitionDuration: '{transitionDuration}'
    }
};
