// A nested menu: the `navigation` items every menu shares, with submenus on
// the overlay surface beside their item.
export default {
    root: {
        background: '{content.background}',
        borderColor: '{content.borderColor}',
        borderRadius: '{content.borderRadius}',
        shadow: '{overlay.navigation.shadow}'
    },
    list: {
        padding: '{navigation.list.padding}',
        gap: '{navigation.list.gap}'
    },
    submenu: {
        minWidth: '12.5rem'
    },
    item: {
        padding: '{navigation.item.padding}',
        borderRadius: '{navigation.item.borderRadius}',
        gap: '{navigation.item.gap}',
        color: '{navigation.item.color}',
        focusBackground: '{navigation.item.focusBackground}',
        focusColor: '{navigation.item.focusColor}',
        icon: {
            color: '{navigation.item.icon.color}'
        }
    },
    submenuIcon: {
        size: '{navigation.submenuIcon.size}'
    },
    separator: {
        borderColor: '{content.borderColor}',
        margin: '0.25rem 0'
    }
};
