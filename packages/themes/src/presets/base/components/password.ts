// A text box with a reveal button, and a meter in a small overlay that grades
// the password as it is typed; the three grades take the severity colours.
export default {
    root: {
        gap: '0.5rem',
        revealColor: '{formField.iconColor}',
        revealHoverColor: '{text.color}'
    },
    overlay: {
        padding: '0.75rem',
        gap: '0.5rem',
        minWidth: '14rem'
    },
    meter: {
        height: '0.375rem',
        borderRadius: '{borderRadius.pill}',
        background: '{content.hoverBackground}'
    },
    strength: {
        weakBackground: '{danger.color}',
        mediumBackground: '{warn.color}',
        strongBackground: '{success.color}',
        transitionDuration: '0.2s'
    }
};
