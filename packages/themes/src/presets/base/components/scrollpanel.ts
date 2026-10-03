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
    // The arrows at the ends of a bar, when the application asks for them.
    arrow: {
        size: '0.875rem',
        color: '{text.mutedColor}',
        hoverColor: '{text.color}',
        hoverBackground: 'color-mix(in srgb, {text.mutedColor} 20%, transparent)'
    }
};
