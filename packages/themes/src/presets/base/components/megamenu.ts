// A bar whose items open wide panels of grouped links, in columns.
export default {
    root: {
        gap: '0.5rem',
        padding: '0.25rem 0.5rem',
        background: '{content.background}',
        borderColor: '{content.borderColor}',
        borderRadius: '{content.borderRadius}',
        shadow: '{overlay.navigation.shadow}'
    },
    panel: {
        padding: '0.75rem',
        gap: '1.5rem',
        minColumnWidth: '11rem'
    },
    item: {
        padding: '{navigation.item.padding}',
        borderRadius: '{navigation.item.borderRadius}',
        gap: '{navigation.item.gap}',
        color: '{navigation.item.color}',
        focusBackground: '{navigation.item.focusBackground}',
        focusColor: '{navigation.item.focusColor}',
        iconColor: '{navigation.item.icon.color}'
    },
    groupLabel: {
        padding: '{navigation.submenuLabel.padding}',
        fontWeight: '{navigation.submenuLabel.fontWeight}',
        color: '{navigation.submenuLabel.color}'
    },
    submenuIcon: {
        size: '{navigation.submenuIcon.size}'
    }
};
