// Items, group labels and icons read the semantic `navigation` group, which
// every menu-like component shares; the popup takes the overlay chrome.
export default {
    root: {
        background: '{content.background}',
        color: '{content.color}',
        borderColor: '{content.borderColor}',
        borderWidth: '1px',
        borderRadius: '{content.borderRadius}',
        minWidth: '12.5rem'
    },
    list: {
        padding: '{navigation.list.padding}',
        gap: '{navigation.list.gap}'
    },
    item: {
        padding: '{navigation.item.padding}',
        borderRadius: '{navigation.item.borderRadius}',
        gap: '{navigation.item.gap}',
        color: '{navigation.item.color}',
        focusBackground: '{navigation.item.focusBackground}',
        focusColor: '{navigation.item.focusColor}',
        icon: {
            color: '{navigation.item.icon.color}',
            focusColor: '{navigation.item.icon.focusColor}'
        }
    },
    submenuLabel: {
        padding: '{navigation.submenuLabel.padding}',
        fontWeight: '{navigation.submenuLabel.fontWeight}',
        background: '{navigation.submenuLabel.background}',
        color: '{navigation.submenuLabel.color}'
    },
    separator: {
        borderColor: '{content.borderColor}',
        margin: '0.25rem 0'
    },
    overlay: {
        shadow: '{overlay.navigation.shadow}'
    }
};
