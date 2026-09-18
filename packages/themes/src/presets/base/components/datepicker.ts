// The text box is the shared field chrome; these are the calendar's own tokens.
// Selected is the accent fill; today is an accent ring, so the two stay
// distinct and read together as a filled circle when today is selected.
export default {
    root: {
        gap: '0.5rem',
        dropdownColor: '{formField.iconColor}',
        dropdownHoverColor: '{text.color}'
    },
    panel: {
        padding: '0.75rem'
    },
    header: {
        gap: '0.25rem',
        padding: '0 0 0.5rem 0.25rem',
        fontWeight: '600',
        fontSize: '0.9375rem'
    },
    weekday: {
        color: '{text.mutedColor}',
        fontWeight: '600',
        fontSize: '0.75rem',
        height: '2rem'
    },
    day: {
        size: '2.25rem',
        gap: '2px',
        borderRadius: '{borderRadius.pill}',
        color: '{text.color}',
        hoverBackground: '{list.option.focusBackground}',
        otherMonthColor: '{text.mutedColor}',
        todayColor: '{primary.color}',
        todayBorderColor: '{primary.color}',
        todayFontWeight: '600',
        selectedBackground: '{primary.color}',
        selectedHoverBackground: '{primary.hoverColor}',
        selectedColor: '{primary.contrastColor}',
        transitionDuration: '{transitionDuration}'
    },
    footer: {
        gap: '0.5rem',
        padding: '0.5rem 0 0',
        borderColor: '{content.borderColor}'
    }
};
