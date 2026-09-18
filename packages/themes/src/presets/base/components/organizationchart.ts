// A tree drawn as a chart: cards on the content surface, joined by hairlines.
export default {
    root: {
        gap: '0.75rem',
        connectorHeight: '1.25rem',
        connectorColor: '{content.borderColor}'
    },
    node: {
        padding: '0.75rem 1rem',
        background: '{content.background}',
        hoverBackground: '{content.hoverBackground}',
        selectedBackground: '{highlight.background}',
        selectedColor: '{highlight.color}',
        borderColor: '{content.borderColor}',
        borderRadius: '{content.borderRadius}',
        color: '{content.color}',
        transitionDuration: '{transitionDuration}'
    },
    toggler: {
        size: '1.25rem',
        background: '{content.background}',
        borderColor: '{content.borderColor}',
        color: '{text.mutedColor}'
    }
};
