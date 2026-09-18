// A scroll container: the loader sits over it on the content surface.
export default {
    root: {
        borderRadius: '{content.borderRadius}'
    },
    loader: {
        background: 'color-mix(in srgb, {content.background} 70%, transparent)',
        color: '{text.mutedColor}',
        iconSize: '1.5rem'
    }
};
