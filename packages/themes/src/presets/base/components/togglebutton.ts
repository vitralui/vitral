// A button that stays pressed. It borrows the field's chrome so it lines up
// with the inputs beside it, and the primary fill once it is on.
export default {
    root: {
        paddingX: '0.875rem',
        paddingY: '0.375rem',
        gap: '0.5rem',
        fontWeight: '500',
        borderRadius: '{formField.borderRadius}',
        borderColor: '{formField.borderColor}',
        background: '{formField.background}',
        hoverBackground: '{content.hoverBackground}',
        color: '{text.mutedColor}',
        hoverColor: '{text.color}',
        checkedBackground: '{primary.color}',
        checkedHoverBackground: '{primary.hoverColor}',
        checkedColor: '{primary.contrastColor}',
        checkedBorderColor: '{primary.color}',
        invalidBorderColor: '{formField.invalidBorderColor}',
        sm: { paddingX: '0.625rem', paddingY: '0.1875rem', fontSize: '0.8125rem' },
        lg: { paddingX: '1.125rem', paddingY: '0.5rem', fontSize: '1rem' }
    },
    icon: { size: '1rem' }
};
