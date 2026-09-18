// A translucent shelf of large icons; the one under the pointer grows, its
// neighbours a little less.
export default {
    root: {
        background: 'color-mix(in srgb, {content.background} 72%, transparent)',
        borderColor: '{content.borderColor}',
        borderRadius: '{borderRadius.xl}',
        padding: '0.5rem',
        gap: '0.5rem',
        shadow: '{overlay.navigation.shadow}',
        transitionDuration: '0.2s'
    },
    item: {
        size: '3rem',
        borderRadius: '{borderRadius.lg}',
        color: '{text.color}',
        background: '{content.hoverBackground}',
        iconSize: '1.5rem',
        activeScale: '1.4',
        nearScale: '1.2',
        farScale: '1.08'
    }
};
