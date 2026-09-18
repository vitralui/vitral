// A track of items with round navigators beside it and dots under it.
export default {
    root: {
        gap: '0.5rem',
        transitionDuration: '0.4s'
    },
    navigator: {
        size: '2rem',
        color: '{text.mutedColor}',
        hoverColor: '{text.color}',
        hoverBackground: '{content.hoverBackground}',
        borderRadius: '50%'
    },
    indicator: {
        gap: '0.5rem',
        width: '1.5rem',
        height: '0.375rem',
        borderRadius: '{borderRadius.pill}',
        background: '{content.borderColor}',
        hoverBackground: '{text.mutedColor}',
        activeBackground: '{primary.color}'
    }
};
