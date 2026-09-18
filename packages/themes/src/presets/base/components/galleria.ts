// One large item with a strip of thumbnails; full screen, it sits on a dark
// veil with light controls.
export default {
    root: {
        gap: '0.5rem',
        borderRadius: '{content.borderRadius}',
        transitionDuration: '0.2s'
    },
    navigator: {
        size: '2.5rem',
        background: 'rgba(0, 0, 0, 0.35)',
        hoverBackground: 'rgba(0, 0, 0, 0.55)',
        color: '#ffffff'
    },
    caption: {
        padding: '0.75rem 1rem',
        background: 'rgba(0, 0, 0, 0.5)',
        color: '#ffffff'
    },
    thumbnail: {
        gap: '0.5rem',
        opacity: '0.55',
        activeBorderColor: '{primary.color}',
        borderRadius: '{borderRadius.sm}'
    },
    indicator: {
        size: '0.625rem',
        background: '{content.borderColor}',
        activeBackground: '{primary.color}'
    },
    mask: {
        background: 'rgba(0, 0, 0, 0.9)'
    }
};
