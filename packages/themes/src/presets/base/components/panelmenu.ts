// Sections of navigation stacked as cards: a header per section, and the
// section's items as an indented tree drawn with the navigation tokens.
export default {
    root: {
        gap: '0.25rem',
        width: '18rem'
    },
    panel: {
        background: '{content.background}',
        borderColor: '{content.borderColor}',
        borderRadius: '{content.borderRadius}'
    },
    header: {
        padding: '{navigation.item.padding}',
        gap: '{navigation.item.gap}',
        fontWeight: '600',
        color: '{text.color}',
        hoverBackground: '{content.hoverBackground}'
    },
    list: {
        padding: '{navigation.list.padding}',
        gap: '{navigation.list.gap}',
        indent: '1rem'
    },
    item: {
        padding: '{navigation.item.padding}',
        gap: '{navigation.item.gap}',
        borderRadius: '{navigation.item.borderRadius}',
        color: '{navigation.item.color}',
        focusBackground: '{navigation.item.focusBackground}',
        focusColor: '{navigation.item.focusColor}',
        iconColor: '{navigation.item.icon.color}'
    },
    submenuIcon: {
        size: '{navigation.submenuIcon.size}'
    },
    transitionDuration: '0.2s'
};
