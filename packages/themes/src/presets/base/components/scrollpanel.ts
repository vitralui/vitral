// Thin bars in the theme's muted colour, a little stronger under the pointer,
// on a faint track of the same colour, so they follow the scheme, the
// contrast setting and the preset.
export default {
    bar: {
        size: '0.5rem',
        gap: '2px',
        borderRadius: '{borderRadius.pill}',
        background: 'color-mix(in srgb, {text.mutedColor} 45%, transparent)',
        hoverBackground: 'color-mix(in srgb, {text.mutedColor} 75%, transparent)',
        trackBackground: 'color-mix(in srgb, {text.mutedColor} 12%, transparent)',
        transitionDuration: '{transitionDuration}'
    },
    // The arrows at the ends of a bar, when the application asks for them:
    // outside the track and square, as a native bar's are, unless a theme
    // gives them a background or a radius of their own.
    arrow: {
        size: '0.625rem',
        color: '{text.mutedColor}',
        background: 'transparent',
        borderRadius: '0',
        hoverColor: '{text.color}',
        hoverBackground: 'color-mix(in srgb, {text.mutedColor} 20%, transparent)'
    }
};
