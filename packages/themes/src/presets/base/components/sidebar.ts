// The application sidebar: a column on the content surface with navigation
// items; collapsed, it keeps only the icons.
export default {
    root: {
        width: '16rem',
        collapsedWidth: '3.75rem',
        background: '{content.background}',
        borderColor: '{content.borderColor}',
        color: '{text.color}',
        padding: '0.5rem',
        gap: '0.5rem',
        transitionDuration: '0.2s'
    },
    group: {
        gap: '2px',
        labelPadding: '0.5rem 0.75rem 0.25rem',
        labelFontSize: '0.75rem',
        labelFontWeight: '600',
        labelColor: '{text.mutedColor}'
    },
    item: {
        padding: '{navigation.item.padding}',
        gap: '{navigation.item.gap}',
        borderRadius: '{navigation.item.borderRadius}',
        color: '{navigation.item.color}',
        hoverBackground: '{navigation.item.focusBackground}',
        hoverColor: '{navigation.item.focusColor}',
        activeBackground: '{highlight.background}',
        activeColor: '{highlight.color}',
        iconColor: '{navigation.item.icon.color}',
        subIndent: '1.75rem'
    },
    toggle: {
        size: '2rem'
    },
    // What stays of an off-canvas sidebar: a strip along its edge that brings it back.
    rail: {
        width: '1rem',
        hoverBackground: '{content.hoverBackground}'
    }
};
