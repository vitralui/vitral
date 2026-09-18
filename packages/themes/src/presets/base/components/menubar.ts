// The application menu bar: a row of navigation items on the content surface;
// its submenus drop below it and open beside themselves further in.
export default {
    root: {
        gap: '0.5rem',
        padding: '0.25rem 0.5rem',
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
    mobileButton: {
        size: '{control.minHeight}',
        borderRadius: '{navigation.item.borderRadius}',
        color: '{text.mutedColor}',
        hoverColor: '{text.color}',
        hoverBackground: '{content.hoverBackground}'
    },
    separator: {
        borderColor: '{content.borderColor}',
        margin: '0.25rem 0'
    }
};
