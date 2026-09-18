// The field chrome comes from the semantic `formField` tokens. These are the
// spin buttons: stacked at the end of the field, or one on each side of
// horizontal minus/plus pair. Their hover fills are the subtle ones a text
// button uses, so they read as part of the field rather than as buttons on it.
export default {
    root: {
        gap: '0.25rem',
        buttonWidth: '1.75rem',
        buttonColor: '{formField.iconColor}',
        buttonHoverColor: '{text.color}',
        buttonHoverBackground: '{secondary.subtleBackground}',
        buttonActiveBackground: '{secondary.subtleHoverBackground}',
        buttonBorderRadius: '{borderRadius.sm}',
        spinnerWidth: '1.375rem',
        spinnerIconSize: '0.625rem',
        sm: { buttonWidth: '1.375rem', spinnerWidth: '1.125rem' },
        lg: { buttonWidth: '2.25rem', spinnerWidth: '1.625rem', spinnerIconSize: '0.75rem' }
    }
};
