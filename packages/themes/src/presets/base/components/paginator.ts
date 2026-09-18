// A pager is a row of flat buttons; the current page borrows the list's
// selected look, and the accent pill a preset may draw under the number.
export default {
    root: {
        padding: '0.5rem 0.75rem',
        gap: '0.25rem',
        background: '{content.background}',
        color: '{text.color}',
        borderRadius: '{content.borderRadius}',
        transitionDuration: '{transitionDuration}'
    },
    navButton: {
        width: '{control.minHeight}',
        height: '{control.minHeight}',
        borderRadius: '{borderRadius.sm}',
        color: '{text.mutedColor}',
        hoverColor: '{text.hoverColor}',
        hoverBackground: '{list.option.focusBackground}',
        selectedColor: '{list.option.selectedColor}',
        selectedBackground: '{list.option.selectedBackground}',
        selectedIndicator: '{list.option.selectedIndicator}',
        selectedFontWeight: '600'
    },
    currentPageReport: {
        color: '{text.mutedColor}',
        padding: '0 0.5rem'
    },
    rowsPerPage: {
        gap: '0.5rem'
    }
};
