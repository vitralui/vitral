// A tree item is a list option with a toggle and an indent: it borrows the
// option's padding, hover and selected colours so a tree and a list match.
export default {
    root: {
        padding: '0.25rem',
        gap: '2px',
        color: '{text.color}',
        indent: '1.25rem',
        transitionDuration: '{transitionDuration}'
    },
    node: {
        paddingX: '0.5rem',
        paddingY: '0.1875rem',
        gap: '0.25rem',
        minHeight: '{control.minHeight}',
        borderRadius: '{list.option.borderRadius}',
        color: '{list.option.color}',
        hoverBackground: '{list.option.focusBackground}',
        hoverColor: '{list.option.focusColor}',
        selectedBackground: '{list.option.selectedBackground}',
        selectedColor: '{list.option.selectedColor}',
        selectedIndicator: '{list.option.selectedIndicator}'
    },
    toggler: {
        size: '1.5rem',
        borderRadius: '{borderRadius.sm}',
        color: '{text.mutedColor}',
        hoverColor: '{text.color}',
        hoverBackground: '{list.option.focusBackground}'
    },
    nodeIcon: {
        color: '{list.option.icon.color}',
        selectedColor: '{list.option.selectedColor}'
    },
    checkbox: {
        size: '1.125rem',
        borderRadius: '{borderRadius.sm}',
        background: '{formField.background}',
        borderColor: '{text.mutedColor}',
        checkedBackground: '{primary.color}',
        checkedBorderColor: '{primary.color}',
        checkedColor: '{primary.contrastColor}'
    },
    filter: {
        margin: '0 0 0.5rem 0'
    },
    empty: {
        padding: '{list.option.padding}',
        color: '{text.mutedColor}'
    }
};
